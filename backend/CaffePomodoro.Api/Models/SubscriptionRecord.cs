using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CaffePomodoro.Api.Models;

[Table("subscriptions")]
public class SubscriptionRecord : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("stripe_customer_id")]
    public string? StripeCustomerId { get; set; }

    [Column("stripe_subscription_id")]
    public string? StripeSubscriptionId { get; set; }

    [Column("plan")]
    public string Plan { get; set; } = "free";

    [Column("status")]
    public string Status { get; set; } = "inactive";

    [Column("current_period_start")]
    public DateTime? CurrentPeriodStart { get; set; }

    [Column("current_period_end")]
    public DateTime? CurrentPeriodEnd { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}