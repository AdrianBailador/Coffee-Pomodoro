import { useState } from 'react';
import { Header } from './components/Header';
import { Timer } from './components/Timer';
import { TodoList } from './components/TodoList';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SessionType } from './types';

function AppContent() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  const handleSessionComplete = (sessionType: SessionType) => {
    if (sessionType === SessionType.Work) {
      // Optionally increment pomodoro count for selected task
      console.log('Work session completed for task:', selectedTaskId);
    }
  };

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

          {/* Todo List Section */}
          <aside className="space-y-4">
            <TodoList 
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
            
            {/* Stats Card */}
            <div className="glass-card p-4">
              <h3 className="font-display text-lg font-semibold text-coffee-800 dark:text-coffee-100 mb-3">
                Today's Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-coffee-50 dark:bg-coffee-800 rounded-lg">
                  <p className="text-2xl font-bold text-espresso-600 dark:text-espresso-400">0</p>
                  <p className="text-xs text-coffee-500 dark:text-coffee-400">Pomodoros</p>
                </div>
                <div className="text-center p-3 bg-coffee-50 dark:bg-coffee-800 rounded-lg">
                  <p className="text-2xl font-bold text-espresso-600 dark:text-espresso-400">0</p>
                  <p className="text-xs text-coffee-500 dark:text-coffee-400">Minutes</p>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="glass-card p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-medium text-coffee-800 dark:text-coffee-100 text-sm">
                    Tip of the Day
                  </h4>
                  <p className="text-xs text-coffee-600 dark:text-coffee-300 mt-1">
                    Take a 5-minute break after each pomodoro to maintain optimal focus.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-coffee-500 dark:text-coffee-400">
        <p>
          Made with ☕ and 💜 by Adrian
        </p>
      </footer>
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