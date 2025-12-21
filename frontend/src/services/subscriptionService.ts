const API_URL = import.meta.env.VITE_API_URL || 'https://coffee-pomodoro.onrender.com/api';

export interface SubscriptionStatus {
  plan: string;
  status: string;
  isPremium: boolean;
  currentPeriodEnd?: string;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const response = await fetch(`${API_URL}/subscription/status/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get subscription status');
  }
  
  return response.json();
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: 'monthly' | 'yearly'
): Promise<string> {
  const response = await fetch(`${API_URL}/subscription/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      userEmail,
      plan,
      successUrl: `${window.location.origin}/Coffee-Pomodoro/?subscription=success`,
      cancelUrl: `${window.location.origin}/Coffee-Pomodoro/?subscription=cancelled`
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const data = await response.json();
  return data.url;
}

export async function cancelSubscription(userId: string): Promise<void> {
  const response = await fetch(`${API_URL}/subscription/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }
}