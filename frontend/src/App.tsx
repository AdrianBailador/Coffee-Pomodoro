import { useState } from 'react';
import { Header } from './components/Header';
import { Timer } from './components/Timer';
import { TodoList } from './components/TodoList';
import { ProductivityCalendar } from './components/ProductivityCalendar';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SessionType } from './types';
import { ConnectionStatus } from './components/ConnectionStatus';

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

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
      <Header />
      
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
            />
            
            {/* Productivity Calendar */}
            <ProductivityCalendar />

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
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;