using Microsoft.AspNetCore.Mvc;
using Supabase;
using Stripe;
using Stripe.Checkout;

using CaffePomodoro.Api.DTOs;
using CaffePomodoro.Api.Models;
using CaffePomodoro.Api.Services;

namespace CaffePomodoro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly Client _supabase;
    private readonly IConfiguration _configuration;
    private readonly IStripeService _stripeService;
    private readonly ILogger<SubscriptionController> _logger;

    public SubscriptionController(
        Client supabase,
        IConfiguration configuration,
        IStripeService stripeService,
        ILogger<SubscriptionController> logger)
    {
        _supabase = supabase;
        _configuration = configuration;
        _stripeService = stripeService;
        _logger = logger;
    }

    // --------------------------------------------------
    // CREATE CHECKOUT SESSION
    // --------------------------------------------------
    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession(CreateCheckoutRequest request)
    {
        var priceId = request.Plan == "yearly"
            ? _configuration["Stripe:PriceIdYearly"]
            : _configuration["Stripe:PriceIdMonthly"];

        if (string.IsNullOrEmpty(priceId))
            return BadRequest("Stripe price not configured");

        var successUrl = request.SuccessUrl
            ?? $"{_configuration["Frontend:Url"]}/subscription/success";

        var cancelUrl = request.CancelUrl
            ?? $"{_configuration["Frontend:Url"]}/subscription/cancel";

        var checkoutUrl = await _stripeService.CreateCheckoutSession(
            request.UserId,
            request.UserEmail,
            priceId,
            successUrl,
            cancelUrl
        );

        return Ok(new { url = checkoutUrl });
    }

    // --------------------------------------------------
    // STRIPE WEBHOOK
    // --------------------------------------------------
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var payload = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"];
        var webhookSecret = _configuration["Stripe:WebhookSecret"];

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                payload,
                signature,
                webhookSecret
            );

            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                    await HandleCheckoutCompleted(stripeEvent);
                    break;

                case "invoice.payment_succeeded":
                    await HandleInvoicePaid(stripeEvent);
                    break;

                case "invoice.payment_failed":
                    await HandleInvoiceFailed(stripeEvent);
                    break;

                case "customer.subscription.deleted":
                    await HandleSubscriptionDeleted(stripeEvent);
                    break;
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook error");
            return BadRequest();
        }
    }

    // --------------------------------------------------
    // WEBHOOK HANDLERS
    // --------------------------------------------------

    /// <summary>
    /// Activa la suscripción tras el checkout (SIN tocar periodos)
    /// </summary>
    private async Task HandleCheckoutCompleted(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Session session)
            return;

        if (!Guid.TryParse(session.Metadata["user_id"], out var userId))
            return;

        if (string.IsNullOrEmpty(session.SubscriptionId))
            return;

        var stripeSubscription = await _stripeService.GetSubscription(session.SubscriptionId);
        if (stripeSubscription == null)
            return;

        var interval = stripeSubscription.Items.Data.First().Price.Recurring.Interval;
        var plan = interval == "year" ? "yearly" : "monthly";

        var response = await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.UserId == userId)
            .Get();

        var subscription = response.Models.FirstOrDefault();
        if (subscription == null)
            return;

        subscription.StripeCustomerId = session.CustomerId;
        subscription.StripeSubscriptionId = stripeSubscription.Id;
        subscription.Plan = plan;
        subscription.Status = "active";
        subscription.UpdatedAt = DateTime.UtcNow;

        await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.Id == subscription.Id)
            .Update(subscription);
    }

    /// <summary>
    /// Fuente ÚNICA de verdad para los periodos
    /// </summary>
    private async Task HandleInvoicePaid(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Invoice invoice)
            return;

        var line = invoice.Lines.Data.FirstOrDefault();
        if (line?.Period == null)
            return;

        var response = await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.StripeCustomerId == invoice.CustomerId)
            .Get();

        var subscription = response.Models.FirstOrDefault();
        if (subscription == null)
            return;

        subscription.CurrentPeriodStart = line.Period.Start;
        subscription.CurrentPeriodEnd = line.Period.End;
        subscription.Status = "active";
        subscription.UpdatedAt = DateTime.UtcNow;

        await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.Id == subscription.Id)
            .Update(subscription);
    }

    private async Task HandleInvoiceFailed(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Invoice invoice)
            return;

        var response = await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.StripeCustomerId == invoice.CustomerId)
            .Get();

        var subscription = response.Models.FirstOrDefault();
        if (subscription == null)
            return;

        subscription.Status = "past_due";
        subscription.UpdatedAt = DateTime.UtcNow;

        await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.Id == subscription.Id)
            .Update(subscription);
    }

    private async Task HandleSubscriptionDeleted(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Stripe.Subscription stripeSubscription)
            return;

        var response = await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.StripeSubscriptionId == stripeSubscription.Id)
            .Get();

        var subscription = response.Models.FirstOrDefault();
        if (subscription == null)
            return;

        subscription.Status = "cancelled";
        subscription.Plan = "free";
        subscription.UpdatedAt = DateTime.UtcNow;

        await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.Id == subscription.Id)
            .Update(subscription);
    }

    // --------------------------------------------------
    // SUBSCRIPTION STATUS
    // --------------------------------------------------
    [HttpGet("status/{userId:guid}")]
    public async Task<IActionResult> GetSubscriptionStatus(Guid userId)
    {
        var userResponse = await _supabase
            .From<User>()
            .Where(x => x.Id == userId)
            .Get();

        var user = userResponse.Models.FirstOrDefault();

        if (user?.IsAdmin == true)
        {
            return Ok(new SubscriptionStatusResponse(
                Plan: "premium",
                Status: "active",
                IsPremium: true
            ));
        }

        var subResponse = await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.UserId == userId)
            .Get();

        var subscription = subResponse.Models.FirstOrDefault();

        if (subscription == null)
        {
            return Ok(new SubscriptionStatusResponse(
                Plan: "free",
                Status: "active",
                IsPremium: false
            ));
        }

        var isPremium =
            subscription.Status == "active" &&
            subscription.Plan != "free";

        return Ok(new SubscriptionStatusResponse(
            Plan: subscription.Plan,
            Status: subscription.Status,
            IsPremium: isPremium,
            CurrentPeriodEnd: subscription.CurrentPeriodEnd
        ));
    }

    // --------------------------------------------------
    // CANCEL SUBSCRIPTION
    // --------------------------------------------------
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscription(CancelSubscriptionRequest request)
    {
        var response = await _supabase
            .From<SubscriptionRecord>()
            .Where(x => x.UserId == Guid.Parse(request.UserId))
            .Get();

        var subscription = response.Models.FirstOrDefault();

        if (subscription?.StripeSubscriptionId != null)
        {
            await _stripeService.CancelSubscription(subscription.StripeSubscriptionId);
        }

        return Ok(new { message = "Subscription cancelled" });
    }
}