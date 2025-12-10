using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CaffePomodoro.Api.Models;

[Table("pomodoro_sessions")]
public class PomodoroSession : BaseModel
{
    [PrimaryKey("id", false)]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Column("user_id")]
    public Guid UserId { get; set; }
    
    [Column("task_id")]
    public Guid? TaskId { get; set; }
    
    [Column("type")]
    public int Type { get; set; }
    
    [Column("duration_minutes")]
    public int DurationMinutes { get; set; }
    
    [Column("started_at")]
    public DateTime StartedAt { get; set; }
    
    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }
    
    [Column("was_completed")]
    public bool WasCompleted { get; set; }
}

public enum SessionType
{
    Work = 0,
    ShortBreak = 1,
    LongBreak = 2
}