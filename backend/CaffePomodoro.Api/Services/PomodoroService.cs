using CaffePomodoro.Api.DTOs;
using CaffePomodoro.Api.Infrastructure;
using CaffePomodoro.Api.Models;
using Supabase.Postgrest;

namespace CaffePomodoro.Api.Services;

public interface IPomodoroService
{
    Task<SessionDto> StartSessionAsync(Guid userId, StartSessionDto dto, UserSettingsDto settings);
    Task<SessionDto?> CompleteSessionAsync(Guid userId, Guid sessionId, CompleteSessionDto dto);
    Task<SessionDto?> GetCurrentSessionAsync(Guid userId);
    Task<IEnumerable<SessionDto>> GetSessionHistoryAsync(Guid userId, int days = 7);
    Task<DailyStatsDto> GetTodayStatsAsync(Guid userId);
    Task<WeeklyStatsDto> GetWeeklyStatsAsync(Guid userId);
}

public class PomodoroService : IPomodoroService
{
    private readonly ISupabaseService _supabase;
    private readonly ITaskService _taskService;
    private readonly ILogger<PomodoroService> _logger;

    public PomodoroService(
        ISupabaseService supabase, 
        ITaskService taskService,
        ILogger<PomodoroService> logger)
    {
        _supabase = supabase;
        _taskService = taskService;
        _logger = logger;
    }

    public async Task<SessionDto> StartSessionAsync(Guid userId, StartSessionDto dto, UserSettingsDto settings)
    {
        var duration = dto.DurationMinutes ?? dto.Type switch
        {
            0 => settings.WorkDurationMinutes,
            1 => settings.ShortBreakMinutes,
            2 => settings.LongBreakMinutes,
            _ => settings.WorkDurationMinutes
        };

        var session = new PomodoroSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TaskId = dto.TaskId,
            Type = dto.Type,
            DurationMinutes = duration,
            StartedAt = DateTime.UtcNow,
            WasCompleted = false
        };

        await _supabase.GetClient()
            .From<PomodoroSession>()
            .Insert(session);

        return MapToDto(session);
    }

    public async Task<SessionDto?> CompleteSessionAsync(Guid userId, Guid sessionId, CompleteSessionDto dto)
    {
        try
        {
            var session = await _supabase.GetClient()
                .From<PomodoroSession>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("id", Constants.Operator.Equals, sessionId.ToString())
                .Single();

            if (session == null) return null;

            session.CompletedAt = DateTime.UtcNow;
            session.WasCompleted = dto.WasCompleted;

            await _supabase.GetClient()
                .From<PomodoroSession>()
                .Filter("id", Constants.Operator.Equals, sessionId.ToString())
                .Update(session);

            if (dto.WasCompleted && session.Type == (int)SessionType.Work && session.TaskId.HasValue)
            {
                await _taskService.IncrementPomodoroAsync(userId, session.TaskId.Value);
            }

            return MapToDto(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing session {SessionId}", sessionId);
            return null;
        }
    }

    public async Task<SessionDto?> GetCurrentSessionAsync(Guid userId)
    {
        try
        {
            var response = await _supabase.GetClient()
                .From<PomodoroSession>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("completed_at", Constants.Operator.Is, "null")
                .Order("started_at", Constants.Ordering.Descending)
                .Limit(1)
                .Get();

            var session = response.Models.FirstOrDefault();
            return session != null ? MapToDto(session) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current session for user {UserId}", userId);
            return null;
        }
    }

    public async Task<IEnumerable<SessionDto>> GetSessionHistoryAsync(Guid userId, int days = 7)
    {
        try
        {
            var startDate = DateTime.UtcNow.AddDays(-days).ToString("o");
            
            var response = await _supabase.GetClient()
                .From<PomodoroSession>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("started_at", Constants.Operator.GreaterThanOrEqual, startDate)
                .Order("started_at", Constants.Ordering.Descending)
                .Get();

            return response.Models.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session history for user {UserId}", userId);
            return Enumerable.Empty<SessionDto>();
        }
    }

    public async Task<DailyStatsDto> GetTodayStatsAsync(Guid userId)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        try
        {
            var response = await _supabase.GetClient()
                .From<PomodoroSession>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("started_at", Constants.Operator.GreaterThanOrEqual, today.ToString("o"))
                .Filter("started_at", Constants.Operator.LessThan, tomorrow.ToString("o"))
                .Get();

            var workSessions = response.Models.Where(s => s.Type == (int)SessionType.Work).ToList();

            return new DailyStatsDto(
                today,
                workSessions.Count,
                workSessions.Count(s => s.WasCompleted),
                workSessions.Where(s => s.WasCompleted).Sum(s => s.DurationMinutes),
                0
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting today stats for user {UserId}", userId);
            return new DailyStatsDto(today, 0, 0, 0, 0);
        }
    }

    public async Task<WeeklyStatsDto> GetWeeklyStatsAsync(Guid userId)
    {
        var today = DateTime.UtcNow.Date;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
        var endOfWeek = startOfWeek.AddDays(7);

        try
        {
            var response = await _supabase.GetClient()
                .From<PomodoroSession>()
                .Filter("user_id", Constants.Operator.Equals, userId.ToString())
                .Filter("started_at", Constants.Operator.GreaterThanOrEqual, startOfWeek.ToString("o"))
                .Filter("started_at", Constants.Operator.LessThan, endOfWeek.ToString("o"))
                .Get();

            var workSessions = response.Models.Where(s => s.Type == (int)SessionType.Work).ToList();

            var dailyBreakdown = Enumerable.Range(0, 7)
                .Select(i =>
                {
                    var date = startOfWeek.AddDays(i);
                    var daySessions = workSessions.Where(s => s.StartedAt.Date == date).ToList();
                    return new DailyStatsDto(
                        date,
                        daySessions.Count,
                        daySessions.Count(s => s.WasCompleted),
                        daySessions.Where(s => s.WasCompleted).Sum(s => s.DurationMinutes),
                        0
                    );
                })
                .ToList();

            return new WeeklyStatsDto(
                startOfWeek,
                endOfWeek.AddDays(-1),
                workSessions.Count,
                workSessions.Count(s => s.WasCompleted),
                workSessions.Where(s => s.WasCompleted).Sum(s => s.DurationMinutes),
                0,
                dailyBreakdown
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting weekly stats for user {UserId}", userId);
            return new WeeklyStatsDto(startOfWeek, endOfWeek, 0, 0, 0, 0, new List<DailyStatsDto>());
        }
    }

    private static SessionDto MapToDto(PomodoroSession session) => new(
        session.Id,
        session.TaskId,
        session.Type,
        session.DurationMinutes,
        session.StartedAt,
        session.CompletedAt,
        session.WasCompleted
    );
}