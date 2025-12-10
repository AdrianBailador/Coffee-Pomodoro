namespace CaffePomodoro.Api.DTOs;

// ========== Task DTOs ==========

public record CreateTaskDto(
    string Title,
    string? Description = null,
    int EstimatedPomodoros = 1,
    int Priority = 0
);

public record UpdateTaskDto(
    string? Title = null,
    string? Description = null,
    bool? IsCompleted = null,
    int? EstimatedPomodoros = null,
    int? Priority = null,
    int? DisplayOrder = null
);

public record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsCompleted,
    int EstimatedPomodoros,
    int CompletedPomodoros,
    int Priority,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    int DisplayOrder
);

// ========== Session DTOs ==========

public record StartSessionDto(
    int Type, // 0: Work, 1: ShortBreak, 2: LongBreak
    Guid? TaskId = null,
    int? DurationMinutes = null
);

public record CompleteSessionDto(
    bool WasCompleted = true
);

public record SessionDto(
    Guid Id,
    Guid? TaskId,
    int Type,
    int DurationMinutes,
    DateTime StartedAt,
    DateTime? CompletedAt,
    bool WasCompleted
);

// ========== User/Settings DTOs ==========

public record UserSettingsDto(
    int WorkDurationMinutes,
    int ShortBreakMinutes,
    int LongBreakMinutes,
    int SessionsBeforeLongBreak,
    bool DarkMode
);

public record UpdateUserSettingsDto(
    int? WorkDurationMinutes = null,
    int? ShortBreakMinutes = null,
    int? LongBreakMinutes = null,
    int? SessionsBeforeLongBreak = null,
    bool? DarkMode = null
);

public record UserProfileDto(
    Guid Id,
    string Email,
    string? DisplayName,
    string? AvatarUrl,
    UserSettingsDto Settings
);

// ========== Stats DTOs ==========

public record DailyStatsDto(
    DateTime Date,
    int TotalSessions,
    int CompletedSessions,
    int TotalMinutes,
    int TasksCompleted
);

public record WeeklyStatsDto(
    DateTime StartDate,
    DateTime EndDate,
    int TotalSessions,
    int CompletedSessions,
    int TotalMinutes,
    int TasksCompleted,
    List<DailyStatsDto> DailyBreakdown
);
