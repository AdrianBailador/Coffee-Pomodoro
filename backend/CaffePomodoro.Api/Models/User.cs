using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CaffePomodoro.Api.Models;

[Table("users")]
public class User : BaseModel
{
    [PrimaryKey("id", false)]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Column("email")]
    public string Email { get; set; } = string.Empty;
    
    [Column("display_name")]
    public string? DisplayName { get; set; }
    
    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
    
    [Column("work_duration_minutes")]
    public int WorkDurationMinutes { get; set; } = 25;
    
    [Column("short_break_minutes")]
    public int ShortBreakMinutes { get; set; } = 5;
    
    [Column("long_break_minutes")]
    public int LongBreakMinutes { get; set; } = 15;
    
    [Column("sessions_before_long_break")]
    public int SessionsBeforeLongBreak { get; set; } = 4;
    
    [Column("dark_mode")]
    public bool DarkMode { get; set; } = false;
}