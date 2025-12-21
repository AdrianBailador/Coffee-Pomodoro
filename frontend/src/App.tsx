import { useState } from 'react';
import { Crown } from 'lucide-react';
import { Header } from './components/Header';
import { Timer } from './components/Timer';
import { TodoList } from './components/TodoList';
import { ProductivityCalendar } from './components/ProductivityCalendar';
import { LoginScreen } from './components/LoginScreen';
import { UpgradeModal } from './components/UpgradeModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { SessionType } from './types';
import { ConnectionStatus } from './components/ConnectionStatus';

function AppContent() {
  const { user, loading } = useAuth();
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isGuest = localStorage.getItem('caffe-pomodoro-guest') === 'true';

  const handleSessionComplete = (sessionType: SessionType) => {
    if (sessionType === SessionType.Work) {
      console.log('Work session completed for task:', selectedTaskId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-coffee-100 dark:from-coffee-900 dark:via-coffee-900 dark:to-espresso-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-coffee-200 border-t-espresso-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-coffee-600 dark:text-coffee-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-coffee-100 dark:from-coffee-900 dark:via-coffee-900 dark:to-espresso-900 transition-colors duration-500">
      <Header onUpgradeClick={() => setShowUpgradeModal(true)} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Timer Section */}
          <section className="glass-card p-8">
            <Timer
              selectedTaskId={selectedTaskId}
              onSessionComplete={handleSessionComplete}
            />
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <TodoList
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onUpgradeClick={() => setShowUpgradeModal(true)}
            />

            {/* Productivity Calendar */}
            <ProductivityCalendar />

            {/* Upgrade Banner (solo si no es premium y está logueado) */}
            {user && !isPremium && !subscriptionLoading && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full glass-card p-4 border-2 border-amber-400 dark:border-amber-600 hover:border-amber-500 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-espresso-600 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-coffee-800 dark:text-coffee-100">Upgrade to Premium</p>
                    <p className="text-sm text-coffee-500 dark:text-coffee-400">Unlock all features</p>
                  </div>
                </div>
              </button>
            )}

            {/* Guest Mode Banner */}
            {isGuest && !user && (
              <div className="glass-card p-4 border-l-4 border-l-amber-500">
                <p className="text-sm text-coffee-600 dark:text-coffee-300">
                  You're in guest mode. Sign in to sync your data across devices.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-coffee-500 dark:text-coffee-400">
        <p>Made with ☕ and 💜 by Adrian</p>
      </footer>

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;