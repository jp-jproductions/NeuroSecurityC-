using System.Text.Json.Serialization;

namespace Client.Models;

public sealed class SedeView
{
    public string id { get; set; } = "";
    public string nombre { get; set; } = "";
    public string grupo { get; set; } = "";
    public bool activa { get; set; }
    public int orden { get; set; }
    public string estado_camaras { get; set; } = "operativo";
    public string nota { get; set; } = "";
    public string fecha_revision { get; set; } = "";
    public bool es_100_operativa { get; set; }
    public bool tiene_novedad { get; set; }
    public bool tiene_desactivado { get; set; }
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
    public string? nota_nueva { get; set; }
    public string tipo_evento { get; set; } = "";
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
}

public sealed record BulkUpdate(string sede_id, string estado_camaras, string? nota = null, string? fecha_revision = null);
public sealed record LoginRequest(string email, string password);
public sealed record LoginResponse(string token, AdminUser user);
public sealed record LoginUserResponse(AdminUser user);
public sealed record SedesResponse(List<SedeView> sedes, int total, string ultima_actualizacion_general);
public sealed record HistoryResponse(List<HistoryRow> historial, int total);
public sealed record BulkUpdateRequest(List<BulkUpdate> updates, string? fecha_revision_general);
public sealed record ChangePasswordRequest(
    [property: JsonPropertyName("currentPassword")] string currentPassword,
    [property: JsonPropertyName("newPassword")] string newPassword);
public sealed record CreateUserRequest(string email, string nombre, string password, string rol);
public sealed record CreateSedeRequest(string nombre, string? grupo);
public sealed record EditSedeRequest(string? nombre, string? grupo);
public sealed record UpdateStatusRequest(string? estado_camaras, string? nota, string? fecha_revision);
public sealed record BulkUpdateResult(int actualizadas);

public sealed class ApiException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
