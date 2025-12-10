using CaffePomodoro.Api.DTOs;
using CaffePomodoro.Api.Infrastructure;
using CaffePomodoro.Api.Models;
using Supabase.Postgrest;

namespace CaffePomodoro.Api.Services;

public interface IUserService
{
    Task<UserProfileDto?> GetProfileAsync(Guid userId);
    Task<UserSettingsDto> GetSettingsAsync(Guid userId);
    Task<UserSettingsDto?> UpdateSettingsAsync(Guid userId, UpdateUserSettingsDto dto);
}

public class UserService : IUserService
{
    private readonly ISupabaseService _supabase;
    private readonly ILogger<UserService> _logger;

    public UserService(ISupabaseService supabase, ILogger<UserService> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
    {
        var user = await _supabase.GetUserByIdAsync(userId);
        if (user == null) return null;

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.AvatarUrl,
            new UserSettingsDto(
                user.WorkDurationMinutes,
                user.ShortBreakMinutes,
                user.LongBreakMinutes,
                user.SessionsBeforeLongBreak,
                user.DarkMode
            )
        );
    }

    public async Task<UserSettingsDto> GetSettingsAsync(Guid userId)
    {
        var user = await _supabase.GetUserByIdAsync(userId);
        
        if (user == null)
        {
            return new UserSettingsDto(25, 5, 15, 4, false);
        }

        return new UserSettingsDto(
            user.WorkDurationMinutes,
            user.ShortBreakMinutes,
            user.LongBreakMinutes,
            user.SessionsBeforeLongBreak,
            user.DarkMode
        );
    }

    public async Task<UserSettingsDto?> UpdateSettingsAsync(Guid userId, UpdateUserSettingsDto dto)
    {
        try
        {
            var user = await _supabase.GetUserByIdAsync(userId);
            if (user == null) return null;

            if (dto.WorkDurationMinutes.HasValue)
                user.WorkDurationMinutes = dto.WorkDurationMinutes.Value;
            if (dto.ShortBreakMinutes.HasValue)
                user.ShortBreakMinutes = dto.ShortBreakMinutes.Value;
            if (dto.LongBreakMinutes.HasValue)
                user.LongBreakMinutes = dto.LongBreakMinutes.Value;
            if (dto.SessionsBeforeLongBreak.HasValue)
                user.SessionsBeforeLongBreak = dto.SessionsBeforeLongBreak.Value;
            if (dto.DarkMode.HasValue)
                user.DarkMode = dto.DarkMode.Value;

            user.UpdatedAt = DateTime.UtcNow;

            await _supabase.GetClient()
                .From<User>()
                .Filter("id", Constants.Operator.Equals, userId.ToString())
                .Update(user);

            return new UserSettingsDto(
                user.WorkDurationMinutes,
                user.ShortBreakMinutes,
                user.LongBreakMinutes,
                user.SessionsBeforeLongBreak,
                user.DarkMode
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating settings for user {UserId}", userId);
            return null;
        }
    }
}