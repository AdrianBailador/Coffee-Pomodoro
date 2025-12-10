using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CaffePomodoro.Api.Models;

[Table("todo_tasks")]
public class TodoTask : BaseModel
{
    [PrimaryKey("id", false)]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Column("user_id")]
    public Guid UserId { get; set; }
    
    [Column("title")]
    public string Title { get; set; } = string.Empty;
    
    [Column("description")]
    public string? Description { get; set; }
    
    [Column("is_completed")]
    public bool IsCompleted { get; set; }
    
    [Column("estimated_pomodoros")]
    public int EstimatedPomodoros { get; set; } = 1;
    
    [Column("completed_pomodoros")]
    public int CompletedPomodoros { get; set; } = 0;
    
    [Column("priority")]
    public int Priority { get; set; } = 0;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
    
    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }
    
    [Column("display_order")]
    public int DisplayOrder { get; set; }
}

public enum TaskPriority
{
    Normal = 0,
    High = 1,
    Urgent = 2
}