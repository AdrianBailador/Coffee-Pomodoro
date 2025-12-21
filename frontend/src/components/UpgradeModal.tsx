import { useState } from 'react';
import { X, Coffee, Sparkles, Calendar, Brain, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession } from '../services/subscriptionService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const checkoutUrl = await createCheckoutSession(user.id, user.email!, selectedPlan);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error starting checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Coffee, text: 'Unlimited tasks' },
    { icon: Calendar, text: 'Productivity calendar & streaks' },
    { icon: Brain, text: 'AI-powered suggestions' },
    { icon: Sparkles, text: 'Advanced statistics' },
    { icon: Crown, text: 'Priority support' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-coffee-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-espresso-600 p-6 text-white">
   <button
  onClick={onClose}
  aria-label="Close"
  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
>
  <X className="w-5 h-5" />
</button>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
              <p className="text-amber-100">Unlock all features</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-coffee-700 dark:text-coffee-200">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-espresso-500 bg-espresso-50 dark:bg-espresso-900/20'
                  : 'border-coffee-200 dark:border-coffee-700 hover:border-coffee-300'
              }`}
            >
              <div className="text-sm text-coffee-500 dark:text-coffee-400">Monthly</div>
              <div className="text-2xl font-bold text-coffee-800 dark:text-coffee-100">€2.99</div>
              <div className="text-xs text-coffee-500">/month</div>
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-espresso-500 bg-espresso-50 dark:bg-espresso-900/20'
                  : 'border-coffee-200 dark:border-coffee-700 hover:border-coffee-300'
              }`}
            >
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 30%
              </div>
              <div className="text-sm text-coffee-500 dark:text-coffee-400">Yearly</div>
              <div className="text-2xl font-bold text-coffee-800 dark:text-coffee-100">€24.99</div>
              <div className="text-xs text-coffee-500">/year</div>
            </button>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-espresso-600 text-white font-semibold hover:from-amber-600 hover:to-espresso-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Upgrade Now
              </>
            )}
          </button>

          <p className="text-center text-xs text-coffee-500">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}