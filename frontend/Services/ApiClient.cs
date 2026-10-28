using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net;
using System.Text.Json;
using Client.Models;
using Microsoft.JSInterop;

namespace Client.Services;

public sealed class ApiClient(HttpClient httpClient, IJSRuntime js)
{
    private const string TokenKey = "neurosecurity-token";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    public async Task<LoginResponse> LoginAsync(string email, string password)
    {
        var result = await SendAsync<LoginResponse>(HttpMethod.Post, "api/auth/login", new LoginRequest(email, password), false);
        await js.InvokeVoidAsync("sessionStorage.setItem", TokenKey, result.token);
        return result;
    }

    public async Task<AdminUser> GetCurrentUserAsync()
    {
        var result = await SendAsync<LoginUserResponse>(HttpMethod.Get, "api/auth/me");
        return result.user;
    }

    public async Task<AdminUser?> RestoreSessionAsync()
    {
        var token = await js.InvokeAsync<string?>("sessionStorage.getItem", TokenKey);
        if (string.IsNullOrWhiteSpace(token))
            return null;

        try
        {
            return await GetCurrentUserAsync();
        }
        catch (ApiException exception) when (exception.StatusCode == (int)HttpStatusCode.Unauthorized)
        {
            await LogoutAsync();
            return null;
        }
    }

    public Task<SedesResponse> GetSedesAsync(bool includeArchived) =>
        SendAsync<SedesResponse>(HttpMethod.Get, $"api/sedes?include_archived={includeArchived.ToString().ToLowerInvariant()}", authenticated: false);

    public Task<StatsView> GetStatsAsync() =>
        SendAsync<StatsView>(HttpMethod.Get, "api/stats", authenticated: false);

    public Task<HistoryResponse> GetHistoryAsync() =>
        SendAsync<HistoryResponse>(HttpMethod.Get, "api/historial?limit=100", authenticated: false);

    public async Task<List<AdminUser>> GetUsersAsync()
    {
        var result = await SendAsync<UsersResponse>(HttpMethod.Get, "api/admin/users");
        return result.users;
    }

    public Task UpdateSedeAsync(string id, string nombre, string grupo) =>
        SendAsync<object>(HttpMethod.Put, $"api/admin/sedes/{Uri.EscapeDataString(id)}", new EditSedeRequest(nombre, grupo));

    public Task UpdateStatusAsync(string id, string estado, string nota) =>
        SendAsync<object>(HttpMethod.Put, $"api/admin/sedes/{Uri.EscapeDataString(id)}/status", new UpdateStatusRequest(estado, nota, null));

    public Task MarkOperationalAsync(string id) =>
        SendAsync<object>(HttpMethod.Post, $"api/admin/sedes/{Uri.EscapeDataString(id)}/mark-operational");

    public Task CreateSedeAsync(string nombre, string grupo) =>
        SendAsync<object>(HttpMethod.Post, "api/admin/sedes", new CreateSedeRequest(nombre, grupo));

    public Task ToggleArchiveAsync(string id) =>
        SendAsync<object>(HttpMethod.Delete, $"api/admin/sedes/{Uri.EscapeDataString(id)}");

    public Task CreateUserAsync(string email, string nombre, string password, string rol) =>
        SendAsync<object>(HttpMethod.Post, "api/admin/users", new CreateUserRequest(email, nombre, password, rol));

    public Task DeleteSuperAdminAsync(string id) =>
        SendAsync<object>(HttpMethod.Delete, $"api/admin/users/{Uri.EscapeDataString(id)}");

    public Task ChangePasswordAsync(string currentPassword, string newPassword) =>
        SendAsync<object>(HttpMethod.Post, "api/auth/change-password", new ChangePasswordRequest(currentPassword, newPassword));

    public Task DeleteSedeAsync(string id) =>
        SendAsync<object>(HttpMethod.Delete, $"api/admin/sedes/{Uri.EscapeDataString(id)}?permanent=true");

    public Task ResetDefaultsAsync() =>
        SendAsync<object>(HttpMethod.Post, "api/admin/reset-defaults");

    public Task<BulkUpdateResult> BulkUpdateAsync(List<BulkUpdate> updates) =>
        SendAsync<BulkUpdateResult>(HttpMethod.Post, "api/admin/sedes/bulk-update", new BulkUpdateRequest(updates, null));

    public Task<string> ExportSedesAsync() =>
        SendTextAsync("api/export/sedes-csv");

    public Task<string> ExportHistoryAsync() =>
        SendTextAsync("api/export/historial-csv");

    public ValueTask LogoutAsync() => js.InvokeVoidAsync("sessionStorage.removeItem", TokenKey);

    private async Task<T> SendAsync<T>(HttpMethod method, string uri, object? body = null, bool authenticated = true)
    {
        using var request = new HttpRequestMessage(method, uri);
        if (body is not null)
            request.Content = JsonContent.Create(body, body.GetType(), options: JsonOptions);

        if (authenticated)
        {
            var token = await js.InvokeAsync<string?>("sessionStorage.getItem", TokenKey);
            if (!string.IsNullOrWhiteSpace(token))
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        using var response = await httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
            throw await CreateApiExceptionAsync(response);

        var result = await response.Content.ReadFromJsonAsync<T>(JsonOptions);
        return result ?? throw new InvalidOperationException("La API devolvió una respuesta vacía.");
    }

    private async Task<string> SendTextAsync(string uri)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        var token = await js.InvokeAsync<string?>("sessionStorage.getItem", TokenKey);
        if (!string.IsNullOrWhiteSpace(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
            throw await CreateApiExceptionAsync(response);
        return await response.Content.ReadAsStringAsync();
    }

    private static async Task<ApiException> CreateApiExceptionAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        var message = response.ReasonPhrase ?? "La solicitud a la API falló.";
        if (!string.IsNullOrWhiteSpace(content))
        {
            try
            {
                using var document = JsonDocument.Parse(content);
                if (document.RootElement.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.String)
                    message = error.GetString() ?? message;
            }
            catch (JsonException)
            {
                message = content;
            }
        }

        return new ApiException((int)response.StatusCode, message);
    }

    private sealed record UsersResponse(List<AdminUser> users);
}
