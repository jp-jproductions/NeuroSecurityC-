using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using dotnet.Components;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorComponents().AddInteractiveServerComponents();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});
builder.Services.AddSingleton<NeuroSecurityStore>();

var signingSecret = builder.Configuration["JWT_SECRET"];
if (string.IsNullOrWhiteSpace(signingSecret))
{
    if (builder.Environment.IsProduction())
        throw new InvalidOperationException("Configure JWT_SECRET con un valor secreto antes de ejecutar en producción.");
    signingSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
}
var tokenKey = Encoding.UTF8.GetBytes(signingSecret);

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();
app.UseAntiforgery();
app.MapStaticAssets();

app.Use(async (context, next) =>
{
    try { await next(); }
    catch (StoreException exception) when (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.StatusCode = exception.StatusCode;
        await context.Response.WriteAsJsonAsync(new { error = exception.Message });
    }
});

app.MapGet("/api/health", (NeuroSecurityStore store) => Results.Ok(new
{
    status = "ok",
    total_sedes = store.GetSedes().Count,
    supabase_configured = false,
    timestamp = DateTime.UtcNow.ToString("O")
}));
app.MapGet("/api/sedes", (bool? include_archived, NeuroSecurityStore store) =>
{
    var sedes = store.GetSedes(include_archived == true);
    return Results.Ok(new { sedes, total = sedes.Count, ultima_actualizacion_general = store.GetStats().ultima_actualizacion_general });
});
app.MapGet("/api/stats", (NeuroSecurityStore store) => Results.Ok(store.GetStats()));
app.MapGet("/api/historial", (string? sede_id, int? limit, NeuroSecurityStore store) =>
{
    var result = store.GetHistory(sede_id, Math.Clamp(limit ?? 100, 1, 1000));
    return Results.Ok(new { historial = result.historial, total = result.total });
});
app.MapGet("/api/export/sedes-csv", (NeuroSecurityStore store) =>
    Results.Text(store.ExportSedesCsv(), "text/csv; charset=utf-8"));
app.MapGet("/api/export/historial-csv", (NeuroSecurityStore store) =>
    Results.Text(store.ExportHistoryCsv(), "text/csv; charset=utf-8"));

app.MapPost("/api/auth/login", (LoginRequest request, NeuroSecurityStore store) =>
{
    var user = store.Login(request.email, request.password);
    return Results.Ok(new { token = CreateToken(user, tokenKey), user });
});
app.MapGet("/api/auth/me", (HttpContext context, NeuroSecurityStore store) =>
{
    var user = Authenticate(context, store, tokenKey);
    return user is null ? Unauthorized() : Results.Ok(new { user });
});
app.MapPost("/api/auth/change-password", (HttpContext context, ChangePasswordRequest request, NeuroSecurityStore store) =>
{
    var user = Authenticate(context, store, tokenKey);
    if (user is null) return Unauthorized();
    store.ChangePassword(user.id, request.currentPassword, request.newPassword);
    return Results.Ok(new { message = "Contraseña actualizada correctamente." });
});

var admin = app.MapGroup("/api/admin").AddEndpointFilter(async (filterContext, next) =>
{
    var user = Authenticate(filterContext.HttpContext, filterContext.HttpContext.RequestServices.GetRequiredService<NeuroSecurityStore>(), tokenKey);
    if (user is null) return Unauthorized();
    filterContext.HttpContext.Items["admin-user"] = user;
    return await next(filterContext);
});
admin.MapGet("/users", (NeuroSecurityStore store) => Results.Ok(new { users = store.GetUsers() }));
admin.MapPost("/users", (CreateUserRequest request, NeuroSecurityStore store) =>
{
    var user = store.CreateUser(request.email, request.nombre, request.password, request.rol);
    return Results.Json(new { message = "Administrador creado con éxito", user }, statusCode: StatusCodes.Status201Created);
});
admin.MapDelete("/users/{id}", (string id, HttpContext context, NeuroSecurityStore store) =>
{
    var actor = (AdminUser)context.Items["admin-user"]!;
    store.DeleteSuperAdmin(id, actor);
    return Results.Ok(new { message = "Superadministrador eliminado correctamente." });
});
admin.MapPut("/sedes/{id}/status", (string id, UpdateStatusRequest request, HttpContext context, NeuroSecurityStore store) =>
{
    var user = (AdminUser)context.Items["admin-user"]!;
    var sede = store.UpdateStatus(id, request.estado_camaras, request.nota, request.fecha_revision, user);
    return Results.Ok(new { message = "Estado actualizado correctamente", sede });
});
admin.MapPost("/sedes/{id}/mark-operational", (string id, HttpContext context, NeuroSecurityStore store) =>
{
    var user = (AdminUser)context.Items["admin-user"]!;
    var sede = store.MarkOperational(id, user);
    return Results.Ok(new { message = $"{sede.nombre} marcada como 100% operativa.", sede });
});
admin.MapPost("/sedes/bulk-update", (BulkUpdateRequest request, HttpContext context, NeuroSecurityStore store) =>
{
    var user = (AdminUser)context.Items["admin-user"]!;
    var count = store.BulkUpdate(request.updates, user, request.fecha_revision_general);
    return Results.Ok(new { message = $"Se actualizaron {count} sedes exitosamente en revisión masiva.", actualizadas = count });
});
admin.MapPost("/sedes", (CreateSedeRequest request, HttpContext context, NeuroSecurityStore store) =>
{
    var user = (AdminUser)context.Items["admin-user"]!;
    var sede = store.CreateSede(request.nombre, request.grupo, user,
        request.estado_camaras ?? "operativo", request.nota ?? "");
    return Results.Json(new { message = "Sede creada exitosamente.", sede }, statusCode: StatusCodes.Status201Created);
});
admin.MapPut("/sedes/{id}", (string id, EditSedeRequest request, NeuroSecurityStore store) =>
{
    var sede = store.UpdateSede(id, request.nombre, request.grupo, request.activa, request.orden);
    return Results.Ok(new { message = "Sede actualizada correctamente.", sede });
});
admin.MapDelete("/sedes/{id}", (string id, bool? permanent, HttpContext context, NeuroSecurityStore store) =>
{
    var user = (AdminUser)context.Items["admin-user"]!;
    if (permanent == true)
    {
        var sede = store.GetSede(id) ?? throw new StoreException(404, "Sede no encontrada.");
        store.DeleteSede(id, user);
        return Results.Ok(new { message = $"Sede {sede.nombre} eliminada definitivamente." });
    }
    var active = store.ToggleArchive(id, user);
    return Results.Ok(new { message = $"Sede {(active ? "reactivada" : "archivada")}." });
});
admin.MapPost("/reset-defaults", (NeuroSecurityStore store) =>
{
    store.ResetDefaults();
    return Results.Ok(new { message = "Estados restablecidos y sedes archivadas reactivadas." });
});

app.MapRazorComponents<App>().AddInteractiveServerRenderMode();
app.Run();

static IResult Unauthorized() => Results.Json(new { error = "No autorizado. Debe iniciar sesión." }, statusCode: StatusCodes.Status401Unauthorized);

static AdminUser? Authenticate(HttpContext context, NeuroSecurityStore store, byte[] key)
{
    var authorization = context.Request.Headers.Authorization.ToString();
    if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
    var token = authorization["Bearer ".Length..].Trim();
    var parts = token.Split('.');
    if (parts.Length != 2) return null;
    try
    {
        var signature = Convert.FromBase64String(ToBase64(parts[1]));
        var expected = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(parts[0]));
        if (!CryptographicOperations.FixedTimeEquals(signature, expected)) return null;
        using var payload = JsonDocument.Parse(Convert.FromBase64String(ToBase64(parts[0])));
        var id = payload.RootElement.GetProperty("userId").GetString();
        return id is null ? null : store.GetUser(id);
    }
    catch (Exception exception) when (exception is FormatException or JsonException or KeyNotFoundException)
    {
        return null;
    }
}

static string CreateToken(AdminUser user, byte[] key)
{
    var payload = JsonSerializer.SerializeToUtf8Bytes(new
    {
        userId = user.id, email = user.email, rol = user.rol, name = user.nombre, iat = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
    });
    var data = Base64Url(payload);
    return $"{data}.{Base64Url(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(data)))}";
}

static string Base64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
static string ToBase64(string value)
{
    var base64 = value.Replace('-', '+').Replace('_', '/');
    return base64.PadRight(base64.Length + ((4 - base64.Length % 4) % 4), '=');
}
