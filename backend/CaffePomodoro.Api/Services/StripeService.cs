using Stripe;
using Stripe.Checkout;

namespace CaffePomodoro.Api.Services;

public interface IStripeService
{
    Task<string> CreateCheckoutSession(string userId, string userEmail, string priceId, string successUrl, string cancelUrl);
    Task<Subscription?> GetSubscription(string subscriptionId);
    Task CancelSubscription(string subscriptionId);
    Task<Customer> CreateOrGetCustomer(string email, string userId);
}

public class StripeService : IStripeService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeService> _logger;

    public StripeService(IConfiguration configuration, ILogger<StripeService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
    }

    public async Task<Customer> CreateOrGetCustomer(string email, string userId)
    {
        var customerService = new CustomerService();
        
        var customers = await customerService.ListAsync(new CustomerListOptions
        {
            Email = email,
            Limit = 1
        });

        if (customers.Data.Count > 0)
        {
            return customers.Data[0];
        }

        var customer = await customerService.CreateAsync(new CustomerCreateOptions
        {
            Email = email,
            Metadata = new Dictionary<string, string>
            {
                { "user_id", userId }
            }
        });

        return customer;
    }

    public async Task<string> CreateCheckoutSession(string userId, string userEmail, string priceId, string successUrl, string cancelUrl)
    {
        var customer = await CreateOrGetCustomer(userEmail, userId);

        var options = new SessionCreateOptions
        {
            Customer = customer.Id,
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1
                }
            },
            Mode = "subscription",
            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
            Metadata = new Dictionary<string, string>
            {
                { "user_id", userId }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        return session.Url;
    }

    public async Task<Subscription?> GetSubscription(string subscriptionId)
    {
        try
        {
            var service = new SubscriptionService();
            return await service.GetAsync(subscriptionId);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Error getting subscription {SubscriptionId}", subscriptionId);
            return null;
        }
    }

    public async Task CancelSubscription(string subscriptionId)
    {
        var service = new SubscriptionService();
        await service.CancelAsync(subscriptionId);
    }
}