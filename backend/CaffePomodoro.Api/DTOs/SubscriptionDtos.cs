namespace CaffePomodoro.Api.DTOs;

// ========== Subscription DTOs ==========

public record CreateCheckoutRequest(
    string UserId,
    string UserEmail,
    string Plan = "monthly",
    string? SuccessUrl = null,
    string? CancelUrl = null
);

public record CancelSubscriptionRequest(
    string UserId
);

public record SubscriptionStatusResponse(
    string Plan,
    string Status,
    bool IsPremium,
    DateTime? CurrentPeriodEnd = null
);