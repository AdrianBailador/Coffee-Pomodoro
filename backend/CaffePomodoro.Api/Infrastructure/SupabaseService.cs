using Supabase;
using CaffePomodoro.Api.Models;

namespace CaffePomodoro.Api.Infrastructure;

public interface ISupabaseService
{
    Client GetClient();
    Task<User?> GetUserByIdAsync(Guid userId);
    Task<User> CreateOrUpdateUserAsync(Guid userId, string email, string? displayName, string? avatarUrl);
}

public class SupabaseService : ISupabaseService
{
    private readonly Client _client;
    private readonly ILogger<SupabaseService> _logger;

    public SupabaseService(IConfiguration configuration, ILogger<SupabaseService> logger)
    {
        _logger = logger;
        
        var url = configuration["Supabase:Url"] 
            ?? throw new InvalidOperationException("Supabase:Url not configured");
        var key = configuration["Supabase:ServiceKey"] 
            ?? configuration["Supabase:Key"]
            ?? throw new InvalidOperationException("Supabase:Key not configured");

        var options = new SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = false
        };

        _client = new Client(url, key, options);
    }

    public Client GetClient() => _client;

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        try
        {
            var response = await _client
                .From<User>()
                .Where(u => u.Id == userId)
                .Single();
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", userId);
            return null;
        }
    }

    public async Task<User> CreateOrUpdateUserAsync(Guid userId, string email, string? displayName, string? avatarUrl)
    {
        var existingUser = await GetUserByIdAsync(userId);

        if (existingUser != null)
        {
            existingUser.Email = email;
            existingUser.DisplayName = displayName;
            existingUser.AvatarUrl = avatarUrl;
            existingUser.UpdatedAt = DateTime.UtcNow;

            await _client
                .From<User>()
                .Where(u => u.Id == userId)
                .Update(existingUser);

            return existingUser;
        }

        var newUser = new User
        {
            Id = userId,
            Email = email,
            DisplayName = displayName,
            AvatarUrl = avatarUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _client
            .From<User>()
            .Insert(newUser);

        return newUser;
    }
}
