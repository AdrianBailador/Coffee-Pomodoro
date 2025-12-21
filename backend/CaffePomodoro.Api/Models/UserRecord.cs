using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CaffePomodoro.Api.Models;

[Table("users")]
public class UserRecord : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("full_name")]
    public string? FullName { get; set; }

    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("is_admin")]
    public bool IsAdmin { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}