import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getSubscriptionStatus, SubscriptionStatus } from '../services/subscriptionService';

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isPremium: boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const status = await getSubscriptionStatus(user.id);
      setSubscription(status);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({ plan: 'free', status: 'active', isPremium: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  // Check URL for subscription success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionStatus = params.get('subscription');
    
    if (subscriptionStatus === 'success') {
      // Refresh after successful payment
      setTimeout(() => refreshSubscription(), 2000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (subscriptionStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const isPremium = subscription?.isPremium ?? false;

  return (
    <SubscriptionContext.Provider value={{ subscription, isPremium, isLoading, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}