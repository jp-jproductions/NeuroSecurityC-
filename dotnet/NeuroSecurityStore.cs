using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Npgsql;
using NpgsqlTypes;

// JProduction author marker: JPROD-NSC-A81C.
public sealed class NeuroSecurityStore
{
    private const string PasswordSalt = "neuromedica_salt_2026";
    private const string InitialOperationalNote = "Marcada como 100% operativa";
    private const long PostgresWriteLockId = 824735921;
    private readonly object gate = new();
    private readonly string databasePath;
    private readonly string? postgresConnectionString;
    private readonly JsonSerializerOptions jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };
    private LocalDatabase database;
    private WriteScope? activeWrite;

    public NeuroSecurityStore(IWebHostEnvironment environment, IConfiguration configuration)
    {
        databasePath = configuration["NEUROSECURITY_DB"]
            ?? Path.GetFullPath(Path.Combine(environment.ContentRootPath, "..", "data", "db.json"));
        if (!File.Exists(databasePath))
            throw new FileNotFoundException($"No se encontró la base de datos local: {databasePath}");

        var json = File.ReadAllText(databasePath);
        database = JsonSerializer.Deserialize<LocalDatabase>(json, jsonOptions)
            ?? throw new InvalidDataException("La base de datos local no contiene datos válidos.");

        postgresConnectionString = BuildPostgresConnectionString(
            configuration["DATABASE_URL"] ?? configuration["POSTGRES_URL"]);
        if (environment.IsProduction() && postgresConnectionString is null)
            throw new InvalidOperationException("Configure DATABASE_URL en producción para usar almacenamiento persistente.");
        if (postgresConnectionString is not null)
            InitializePostgres();
    }

    public bool IsPersistent => postgresConnectionString is not null;

    public List<SedeView> GetSedes(bool includeArchived = false)
    {
        lock (gate)
        {
            RefreshFromPostgres();
            return database.sedes.Where(s => includeArchived || s.activa)
                .OrderBy(s => s.orden)
                .Select(Enrich)
                .ToList();
        }
    }

    public SedeView? GetSede(string id)
    {
        lock (gate)
        {
            RefreshFromPostgres();
            var sede = database.sedes.FirstOrDefault(s => s.id == id);
            return sede is null ? null : Enrich(sede);
        }
    }

    public StatsView GetStats()
    {
        var active = GetSedes();
        return new StatsView
        {
            total_sedes = active.Count,
            operativas_100 = active.Count(s => s.es_100_operativa),
            con_novedad = active.Count(s => s.tiene_novedad),
            con_desactivado = active.Count(s => s.tiene_desactivado),
            desactualizadas = active.Count(s => s.es_desactualizada),
            ultima_actualizacion_general = LatestUpdate(active)
        };
    }

    public (List<HistoryRow> historial, int total) GetHistory(string? sedeId = null, int limit = 100)
    {
        lock (gate)
        {
            RefreshFromPostgres();
            var rows = database.historial
                .Where(h => string.IsNullOrEmpty(sedeId) || h.sede_id == sedeId)
                .OrderByDescending(h => h.fecha)
                .ToList();
            return (rows            .Take(Math.Clamp(limit, 1, 10000)).ToList(), rows.Count);
        }
    }

    public AdminUser Login(string email, string password)
    {
        lock (gate)
        {
            RefreshFromPostgres();
            var user = database.usuarios.FirstOrDefault(u => u.email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase));
            if (user is null || !FixedEquals(user.password_hash, HashPassword(password)))
                throw new StoreException(401, "Credenciales inválidas. Verifique el correo o contraseña.");
            return PublicUser(user);
        }
    }

    public AdminUser? GetUser(string id)
    {
        lock (gate)
        {
            RefreshFromPostgres();
            var user = database.usuarios.FirstOrDefault(u => u.id == id);
            return user is null ? null : PublicUser(user);
        }
    }

    public List<AdminUser> GetUsers()
    {
        lock (gate)
        {
            RefreshFromPostgres();
            return database.usuarios.Select(PublicUser).ToList();
        }
    }

    public AdminUser CreateUser(string email, string name, string password, string role)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(name) || string.IsNullOrEmpty(password))
            throw new StoreException(400, "Faltan campos obligatorios (email, nombre, password).");
        lock (gate)
        {
            using var write = BeginWrite();
            var normalizedEmail = email.Trim().ToLowerInvariant();
            if (database.usuarios.Any(u => u.email.Equals(normalizedEmail, StringComparison.OrdinalIgnoreCase)))
                throw new StoreException(400, "Ya existe un administrador con este correo.");
            var row = new UserRow
            {
                id = $"admin-{Guid.NewGuid():N}",
                email = normalizedEmail,
                nombre = name.Trim(),
                password_hash = HashPassword(password),
                rol = role == "superadmin" ? "superadmin" : "admin",
                creado_en = UtcNow()
            };
            database.usuarios.Add(row);
            Save();
            return PublicUser(row);
        }
    }

    public void DeleteSuperAdmin(string id, AdminUser actor)
    {
        lock (gate)
        {
            using var write = BeginWrite();
            if (actor.rol != "superadmin")
                throw new StoreException(403, "Solo un superadministrador puede eliminar a otro superadministrador.");
            if (actor.id == id)
                throw new StoreException(400, "No puedes eliminar tu propia cuenta.");

            var user = database.usuarios.FirstOrDefault(u => u.id == id)
                ?? throw new StoreException(404, "Administrador no encontrado.");
            if (user.rol != "superadmin")
                throw new StoreException(403, "Solo se pueden eliminar cuentas de superadministrador.");
            if (database.usuarios.Count(u => u.rol == "superadmin") <= 1)
                throw new StoreException(400, "No se puede eliminar al último superadministrador.");

            database.usuarios.Remove(user);
            Save();
        }
    }

    public void ChangePassword(string id, string currentPassword, string newPassword)
    {
        if (newPassword.Length < 6)
            throw new StoreException(400, "La nueva contraseña debe tener mínimo 6 caracteres.");
        lock (gate)
        {
            using var write = BeginWrite();
            var user = database.usuarios.FirstOrDefault(u => u.id == id)
                ?? throw new StoreException(404, "Usuario no encontrado.");
            if (!FixedEquals(user.password_hash, HashPassword(currentPassword)))
                throw new StoreException(400, "La contraseña actual no es correcta.");
            user.password_hash = HashPassword(newPassword);
            Save();
        }
    }

    public SedeView UpdateStatus(string id, string? cameras, string? note, string? revision, AdminUser actor)
    {
        lock (gate)
        {
            using var write = BeginWrite();
            var sede = FindSede(id);
            var previous = GetState(sede);
            var next = new StateRow
            {
                sede_id = id,
                estado_camaras = cameras ?? previous.estado_camaras,
                nota = note?.Trim() ?? previous.nota,
                fecha_revision = revision ?? UtcNow(),
                actualizado_en = UtcNow(),
                actualizado_por = actor.nombre
            };
            ValidateState(next.estado_camaras, next.nota);
            database.estados[id] = next;
            AddHistory(sede, previous, next, actor.nombre, "actualizacion");
            Save();
            return Enrich(sede);
        }
    }

    public SedeView MarkOperational(string id, AdminUser actor)
    {
        lock (gate)
        {
            using var write = BeginWrite();
            var sede = FindSede(id);
            var previous = GetState(sede);
            var next = new StateRow
            {
                sede_id = id, estado_camaras = "operativo",
                nota = "", fecha_revision = UtcNow(), actualizado_en = UtcNow(), actualizado_por = actor.nombre
            };
            database.estados[id] = next;
            AddHistory(sede, previous, next, actor.nombre, "marcado_operativo", InitialOperationalNote);
            Save();
            return Enrich(sede);
        }
    }

    public int BulkUpdate(IReadOnlyCollection<BulkUpdate> updates, AdminUser actor, string? revision = null)
    {
        if (updates.Count == 0) throw new StoreException(400, "Lista de actualizaciones inválida o vacía.");
        lock (gate)
        {
            using var write = BeginWrite();
            var candidates = new List<(SedeRow sede, StateRow previous, StateRow next)>();
            foreach (var update in updates)
            {
                var sede = database.sedes.FirstOrDefault(s => s.id == update.sede_id);
                if (sede is null) continue;
                var note = update.nota?.Trim() ?? "";
                ValidateState(update.estado_camaras, note, sede.nombre);
                var previous = GetState(sede);
                var next = new StateRow
                {
                    sede_id = sede.id, estado_camaras = update.estado_camaras,
                    nota = note, fecha_revision = update.fecha_revision ?? revision ?? UtcNow(),
                    actualizado_en = UtcNow(), actualizado_por = actor.nombre
                };
                candidates.Add((sede, previous, next));
            }

            foreach (var (sede, previous, next) in candidates)
            {
                database.estados[sede.id] = next;
                if (previous.estado_camaras != next.estado_camaras || previous.nota != next.nota)
                    AddHistory(sede, previous, next, actor.nombre, "masivo");
            }
            if (candidates.Count > 0) Save();
            return candidates.Count;
        }
    }

    public SedeView CreateSede(string name, string? group, AdminUser actor, string cameras = "operativo", string note = "")
    {
        if (string.IsNullOrWhiteSpace(name)) throw new StoreException(400, "El nombre de la sede es obligatorio.");
        lock (gate)
        {
            using var write = BeginWrite();
            var now = UtcNow();
            var sede = new SedeRow
            {
                id = $"sede-{Guid.NewGuid():N}", nombre = name.Trim().ToUpperInvariant(),
                grupo = string.IsNullOrWhiteSpace(group) ? "OTROS" : group.Trim().ToUpperInvariant(),
                activa = true, orden = database.sedes.Select(s => s.orden).DefaultIfEmpty().Max() + 1, creada_en = now
            };
            var state = new StateRow
            {
                sede_id = sede.id, estado_camaras = cameras,
                nota = note.Trim(), fecha_revision = now, actualizado_en = now, actualizado_por = actor.nombre
            };
            ValidateState(state.estado_camaras, state.nota);
            database.sedes.Add(sede);
            database.estados[sede.id] = state;
            AddHistory(sede, DefaultState(sede.id), state, actor.nombre, "creacion", "Sede creada en el sistema");
            Save();
            return Enrich(sede);
        }
    }

    public SedeView UpdateSede(string id, string? name, string? group, bool? active, int? order)
    {
        lock (gate)
        {
            using var write = BeginWrite();
            var sede = FindSede(id);
            if (!string.IsNullOrWhiteSpace(name)) sede.nombre = name.Trim().ToUpperInvariant();
            if (!string.IsNullOrWhiteSpace(group)) sede.grupo = group.Trim().ToUpperInvariant();
            if (active.HasValue) sede.activa = active.Value;
            if (order.HasValue) sede.orden = order.Value;
            Save();
            return Enrich(sede);
        }
    }

    public bool ToggleArchive(string id, AdminUser actor)
    {
        lock (gate)
        {
            using var write = BeginWrite();
            var sede = FindSede(id);
            sede.activa = !sede.activa;
            AddDeletionHistory(sede, actor, false);
            Save();
            return sede.activa;
        }
    }

    public void DeleteSede(string id, AdminUser actor)
    {
        lock (gate)
        {
            using var write = BeginWrite();
            var sede = FindSede(id);
            AddDeletionHistory(sede, actor, true);
            database.sedes.Remove(sede);
            database.estados.Remove(id);
            Save();
        }
    }

    public void ResetDefaults()
    {
        lock (gate)
        {
            using var write = BeginWrite();
            var now = UtcNow();
            foreach (var sede in database.sedes)
            {
                sede.activa = true;
                database.estados[sede.id] = new StateRow
                {
                    sede_id = sede.id, estado_camaras = "operativo", nota = "",
                    fecha_revision = now, actualizado_en = now, actualizado_por = "Sistema"
                };
            }
            database.historial =
            [
                new HistoryRow
                {
                    id = Guid.NewGuid().ToString("N"), sede_id = "todas", sede_nombre = "Todas las Sedes",
                    fecha = now, usuario = "Sistema", estado_camaras_anterior = "operativo",
                    estado_camaras_nuevo = "operativo", nota_anterior = "",
                    nota_nueva = "Carga inicial del sistema. Todas las sedes operativas.", tipo_evento = "creacion"
                }
            ];
            Save();
        }
    }

    public string ExportSedesCsv()
    {
        var header = "ID;Sede;Grupo;Estado Cámaras;Nota / Novedad;Fecha Última Revisión;Días Sin Revisar;Desactualizada (>4 días);Última Modificación;Responsable";
        var rows = GetSedes().Select(s => string.Join(';', new[]
        {
            Csv(s.id), Csv(s.nombre), Csv(s.grupo), Csv(s.estado_camaras.ToUpperInvariant()),
            Csv(s.nota), Csv(s.fecha_revision), s.dias_sin_revision.ToString(), s.es_desactualizada ? "SÍ" : "NO",
            Csv(s.actualizado_en), Csv(s.actualizado_por)
        }));
        return "\uFEFF" + string.Join("\r\n", new[] { header }.Concat(rows));
    }

    public string ExportHistoryCsv()
    {
        var header = "Fecha Evento;Sede;Usuario Responsable;Tipo Evento;Cámaras Anterior;Cámaras Nuevo;Nota Anterior;Nota Nueva";
        var rows = GetHistory(null, 1000).historial.Select(h => string.Join(';', new[]
        {
            Csv(h.fecha), Csv(h.sede_nombre), Csv(h.usuario), Csv(h.tipo_evento), Csv(h.estado_camaras_anterior),
            Csv(h.estado_camaras_nuevo), Csv(h.nota_anterior), Csv(h.nota_nueva)
        }));
        return "\uFEFF" + string.Join("\r\n", new[] { header }.Concat(rows));
    }

    private SedeView Enrich(SedeRow sede)
    {
        var state = database.estados.TryGetValue(sede.id, out var saved) ? saved : DefaultState(sede.id);
        var revision = DateTime.TryParse(state.fecha_revision, out var date) ? date.ToUniversalTime() : DateTime.UtcNow;
        var hours = (DateTime.UtcNow - revision).TotalHours;
        return new SedeView
        {
            id = sede.id, nombre = sede.nombre, grupo = sede.grupo, activa = sede.activa, orden = sede.orden,
            creada_en = sede.creada_en, estado_camaras = state.estado_camaras,
            nota = state.nota, fecha_revision = state.fecha_revision, actualizado_en = state.actualizado_en,
            actualizado_por = state.actualizado_por, dias_sin_revision = Math.Max(0, (int)Math.Floor(hours / 24)),
            es_desactualizada = hours > 96, es_100_operativa = state.estado_camaras == "operativo",
            tiene_novedad = state.estado_camaras == "novedad",
            tiene_desactivado = state.estado_camaras == "desactivado"
        };
    }

    private string LatestUpdate(List<SedeView>? active = null)
    {
        active ??= GetSedes();
        return active.Select(s => s.actualizado_en).Where(s => !string.IsNullOrEmpty(s)).OrderDescending().FirstOrDefault() ?? UtcNow();
    }

    private void AddHistory(SedeRow sede, StateRow previous, StateRow next, string actor, string type, string? newNote = null)
    {
        database.historial.Add(new HistoryRow
        {
            id = Guid.NewGuid().ToString("N"), sede_id = sede.id, sede_nombre = sede.nombre, fecha = UtcNow(), usuario = actor,
            estado_camaras_anterior = previous.estado_camaras, estado_camaras_nuevo = next.estado_camaras,
            nota_anterior = previous.nota, nota_nueva = newNote ?? next.nota, tipo_evento = type
        });
    }

    private void AddDeletionHistory(SedeRow sede, AdminUser actor, bool permanent)
    {
        database.historial.Add(new HistoryRow
        {
            id = Guid.NewGuid().ToString("N"), sede_id = sede.id, sede_nombre = sede.nombre, fecha = UtcNow(),
            usuario = actor.nombre, estado_camaras_anterior = "", estado_camaras_nuevo = "",
            nota_nueva = permanent ? $"Sede eliminada permanentemente por {actor.nombre}" : $"Sede {(sede.activa ? "archivada" : "reactivada")} por {actor.nombre}",
            tipo_evento = permanent ? "eliminacion" : "actualizacion"
        });
    }

    private SedeRow FindSede(string id) => database.sedes.FirstOrDefault(s => s.id == id)
        ?? throw new StoreException(404, "Sede no encontrada.");

    private StateRow GetState(SedeRow sede) => database.estados.TryGetValue(sede.id, out var state) ? state : DefaultState(sede.id);

    private static StateRow DefaultState(string id) => new()
    {
        sede_id = id, estado_camaras = "operativo", nota = "",
        fecha_revision = UtcNow(), actualizado_en = UtcNow(), actualizado_por = "Sistema"
    };

    private static void ValidateState(string cameras, string note, string? locationName = null)
    {
        if (!ValidStates.Contains(cameras))
            throw new StoreException(400, locationName is null ? "Estado inválido." : $"Estado inválido para la sede \"{locationName}\".");
        if (cameras == "novedad" && !ValidNoveltyReasons.Contains(note))
            throw new StoreException(400, locationName is null
                ? "Selecciona una novedad válida para las cámaras."
                : $"Selecciona una novedad válida para las cámaras de la sede \"{locationName}\".");
    }

    private WriteScope? BeginWrite()
    {
        if (postgresConnectionString is null) return null;
        if (activeWrite is not null)
            throw new InvalidOperationException("Ya existe una transacción de escritura activa.");

        var connection = new NpgsqlConnection(postgresConnectionString);
        connection.Open();
        var transaction = connection.BeginTransaction();
        try
        {
            using (var command = new NpgsqlCommand("SELECT pg_advisory_xact_lock(@lock_id)", connection, transaction))
            {
                command.Parameters.AddWithValue("lock_id", PostgresWriteLockId);
                command.ExecuteNonQuery();
            }

            database = LoadPostgresDatabase(connection, transaction);
            activeWrite = new WriteScope(this, connection, transaction);
            return activeWrite;
        }
        catch
        {
            transaction.Dispose();
            connection.Dispose();
            throw;
        }
    }

    private void RefreshFromPostgres()
    {
        if (postgresConnectionString is null) return;
        using var connection = new NpgsqlConnection(postgresConnectionString);
        connection.Open();
        database = LoadPostgresDatabase(connection, null);
    }

    private void InitializePostgres()
    {
        using var connection = new NpgsqlConnection(postgresConnectionString);
        connection.Open();
        using (var command = new NpgsqlCommand(
            "CREATE TABLE IF NOT EXISTS neurosecurity_state (id smallint PRIMARY KEY CHECK (id = 1), payload jsonb NOT NULL)",
            connection))
            command.ExecuteNonQuery();

        using (var command = new NpgsqlCommand(
            "INSERT INTO neurosecurity_state (id, payload) VALUES (1, @payload) ON CONFLICT (id) DO NOTHING",
            connection))
        {
            command.Parameters.Add("payload", NpgsqlDbType.Jsonb).Value = JsonSerializer.Serialize(database, jsonOptions);
            command.ExecuteNonQuery();
        }

        database = LoadPostgresDatabase(connection, null);
    }

    private LocalDatabase LoadPostgresDatabase(NpgsqlConnection connection, NpgsqlTransaction? transaction)
    {
        using var command = new NpgsqlCommand(
            "SELECT payload::text FROM neurosecurity_state WHERE id = 1",
            connection,
            transaction);
        var payload = command.ExecuteScalar() as string
            ?? throw new InvalidDataException("No se encontró el estado de la aplicación en PostgreSQL.");
        return JsonSerializer.Deserialize<LocalDatabase>(payload, jsonOptions)
            ?? throw new InvalidDataException("La base de datos PostgreSQL no contiene datos válidos.");
    }

    private static string? BuildPostgresConnectionString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        value = value.Trim();
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)
            || (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
            return new NpgsqlConnectionStringBuilder(value).ConnectionString;

        var credentials = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = credentials.Length > 1 ? Uri.UnescapeDataString(credentials[1]) : "",
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            SslMode = SslMode.Require,
            Timeout = 15,
            CommandTimeout = 30
        };

        foreach (var parameter in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var pair = parameter.Split('=', 2);
            if (pair.Length == 2 && pair[0].Equals("sslmode", StringComparison.OrdinalIgnoreCase)
                && Enum.TryParse<SslMode>(Uri.UnescapeDataString(pair[1]), true, out var sslMode))
                builder.SslMode = sslMode;
        }
        return builder.ConnectionString;
    }

    private void Save()
    {
        if (postgresConnectionString is not null)
        {
            var write = activeWrite
                ?? throw new InvalidOperationException("La escritura PostgreSQL requiere una transacción activa.");
            using var command = new NpgsqlCommand(
                "UPDATE neurosecurity_state SET payload = @payload WHERE id = 1",
                write.Connection,
                write.Transaction);
            command.Parameters.Add("payload", NpgsqlDbType.Jsonb).Value = JsonSerializer.Serialize(database, jsonOptions);
            if (command.ExecuteNonQuery() != 1)
                throw new InvalidOperationException("No se pudo guardar el estado en PostgreSQL.");
            write.Commit();
            return;
        }

        var directory = Path.GetDirectoryName(databasePath) ?? throw new InvalidOperationException("No se pudo determinar la carpeta de la base de datos.");
        Directory.CreateDirectory(directory);
        var temporaryPath = databasePath + ".tmp";
        File.WriteAllText(temporaryPath, JsonSerializer.Serialize(database, jsonOptions), new UTF8Encoding(false));
        File.Move(temporaryPath, databasePath, true);
    }

    private sealed class WriteScope(NeuroSecurityStore owner, NpgsqlConnection connection, NpgsqlTransaction transaction) : IDisposable
    {
        public NpgsqlConnection Connection { get; } = connection;
        public NpgsqlTransaction Transaction { get; } = transaction;

        public void Commit() => Transaction.Commit();

        public void Dispose()
        {
            try
            {
                Transaction.Dispose();
                Connection.Dispose();
            }
            finally
            {
                owner.activeWrite = null;
            }
        }
    }

    private static AdminUser PublicUser(UserRow user) => new()
    {
        id = user.id, email = user.email, nombre = user.nombre, rol = user.rol, creado_en = user.creado_en
    };

    public static string HashPassword(string password)
    {
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, Encoding.UTF8.GetBytes(PasswordSalt), 1000, HashAlgorithmName.SHA512, 64);
        return Convert.ToHexStringLower(hash);
    }

    private static bool FixedEquals(string a, string b)
    {
        try { return CryptographicOperations.FixedTimeEquals(Convert.FromHexString(a), Convert.FromHexString(b)); }
        catch (FormatException) { return false; }
    }

    private static string Csv(string? value) => $"\"{(value ?? "").Replace("\"", "\"\"")}\"";
    private static string UtcNow() => DateTime.UtcNow.ToString("O");
    private static readonly HashSet<string> ValidStates = ["operativo", "desactivado", "novedad"];
    public static IReadOnlyList<string> NoveltyOptions { get; } = Array.AsReadOnly(new[]
    {
        "No conecta por fallo de internet.",
        "No conecta por falta de energía.",
        "Falla de DVR",
        "Falla de disco duro",
        "Cambio de horario por pila desgastada.",
        "Cámara sin funcionamiento."
    });
    private static readonly HashSet<string> ValidNoveltyReasons = new(NoveltyOptions, StringComparer.Ordinal);
}

public sealed class StoreException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public sealed class LocalDatabase
{
    public List<SedeRow> sedes { get; set; } = [];
    public Dictionary<string, StateRow> estados { get; set; } = [];
    public List<HistoryRow> historial { get; set; } = [];
    public List<UserRow> usuarios { get; set; } = [];
}

public class SedeRow
{
    public string id { get; set; } = "";
    public string nombre { get; set; } = "";
    public string grupo { get; set; } = "";
    public bool activa { get; set; }
    public int orden { get; set; }
    public string creada_en { get; set; } = "";
}

public sealed class StateRow
{
    public string sede_id { get; set; } = "";
    public string estado_camaras { get; set; } = "operativo";
    public string nota { get; set; } = "";
    public string fecha_revision { get; set; } = "";
    public string actualizado_en { get; set; } = "";
    public string actualizado_por { get; set; } = "Sistema";
}

public sealed class HistoryRow
{
    public string id { get; set; } = "";
    public string sede_id { get; set; } = "";
    public string sede_nombre { get; set; } = "";
    public string fecha { get; set; } = "";
    public string usuario { get; set; } = "";
    public string estado_camaras_anterior { get; set; } = "";
    public string estado_camaras_nuevo { get; set; } = "";
    public string? nota_anterior { get; set; }
    public string? nota_nueva { get; set; }
    public string tipo_evento { get; set; } = "";
}

public sealed class UserRow
{
    public string id { get; set; } = "";
    public string email { get; set; } = "";
    public string nombre { get; set; } = "";
    public string password_hash { get; set; } = "";
    public string rol { get; set; } = "admin";
    public string creado_en { get; set; } = "";
}

public sealed class SedeView : SedeRow
{
    public string estado_camaras { get; set; } = "operativo";
    public string nota { get; set; } = "";
    public string fecha_revision { get; set; } = "";
    public string actualizado_en { get; set; } = "";
    public string actualizado_por { get; set; } = "";
    public int dias_sin_revision { get; set; }
    public bool es_desactualizada { get; set; }
    public bool es_100_operativa { get; set; }
    public bool tiene_novedad { get; set; }
    public bool tiene_desactivado { get; set; }
}

public sealed class StatsView
{
    public int total_sedes { get; set; }
    public int operativas_100 { get; set; }
    public int con_novedad { get; set; }
    public int con_desactivado { get; set; }
    public int desactualizadas { get; set; }
    public string ultima_actualizacion_general { get; set; } = "";
}

public sealed class AdminUser
{
    public string id { get; set; } = "";
    public string email { get; set; } = "";
    public string nombre { get; set; } = "";
    public string rol { get; set; } = "admin";
    public string creado_en { get; set; } = "";
}

public sealed record BulkUpdate(string sede_id, string estado_camaras, string? nota = null, string? fecha_revision = null);

public sealed record LoginRequest(string email, string password);
public sealed record ChangePasswordRequest(
    [property: JsonPropertyName("currentPassword")] string currentPassword,
    [property: JsonPropertyName("newPassword")] string newPassword);
public sealed record CreateUserRequest(string email, string nombre, string password, string rol);
public sealed record UpdateStatusRequest(string? estado_camaras, string? nota, string? fecha_revision);
public sealed record BulkUpdateRequest(List<BulkUpdate> updates, string? fecha_revision_general);
public sealed record CreateSedeRequest(string nombre, string? grupo, string? estado_camaras, string? nota);
public sealed record EditSedeRequest(string? nombre, string? grupo, bool? activa, int? orden);
