import { Coffee, Clock, CheckSquare, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LoginScreen() {
  const { signIn, loading } = useAuth();

  const features = [
    {
      icon: <Coffee className="w-5 h-5" />,
      title: 'Pomodoro Timer',
      description: 'Stay focused with our coffee cup timer'
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      title: 'Task Management',
      description: 'Organise and track your tasks'
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Customisable',
      description: 'Adjust durations to your needs'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Statistics',
      description: 'Track your productivity'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-coffee-100 dark:from-coffee-900 dark:via-coffee-900 dark:to-espresso-900 flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-espresso-500 to-espresso-700 rounded-lg md:rounded-xl shadow-lg">
            <Coffee className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h1 className="font-display text-lg md:text-xl font-bold text-coffee-800 dark:text-coffee-100">
            Coffee Pomodoro
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          
          {/* Login Card - Primero en móvil */}
          <div className="flex justify-center order-1 md:order-2">
            <div className="w-full max-w-sm bg-white dark:bg-coffee-800 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl p-6 md:p-8 space-y-4 md:space-y-6">
              {/* Coffee Cup Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-espresso-400 to-espresso-600 rounded-full flex items-center justify-center shadow-lg">
                    <Coffee className="w-8 h-8 md:w-12 md:h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                    <CheckSquare className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Welcome Text */}
              <div className="text-center space-y-1">
                <h3 className="font-display text-xl md:text-2xl font-bold text-coffee-800 dark:text-coffee-100">
                  Welcome
                </h3>
                <p className="text-coffee-500 dark:text-coffee-400 text-xs md:text-sm">
                  Sign in to start your productivity journey
                </p>
              </div>

              {/* Sign In Button */}
              <button
                onClick={signIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 md:px-6 md:py-4 rounded-xl bg-white dark:bg-coffee-700 border-2 border-coffee-200 dark:border-coffee-600 text-coffee-800 dark:text-coffee-100 font-medium hover:bg-coffee-50 dark:hover:bg-coffee-600 hover:border-espresso-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-coffee-300 border-t-espresso-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-coffee-200 dark:border-coffee-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-coffee-800 text-coffee-400">or</span>
                </div>
              </div>

              {/* Guest Button */}
              <button
                onClick={() => {
                  localStorage.setItem('caffe-pomodoro-guest', 'true');
                  window.location.reload();
                }}
                className="w-full px-4 py-2.5 md:px-6 md:py-3 rounded-xl bg-coffee-100 dark:bg-coffee-700 text-coffee-700 dark:text-coffee-200 font-medium hover:bg-coffee-200 dark:hover:bg-coffee-600 transition-colors text-sm md:text-base"
              >
                Continue as Guest
              </button>

              {/* Terms */}
              <p className="text-xs text-center text-coffee-400 dark:text-coffee-500">
                By continuing, you agree to our Terms of Service
              </p>
            </div>
          </div>

          {/* Info - Oculto en móvil, visible en desktop */}
          <div className="hidden md:block space-y-8 order-2 md:order-1">
            <div className="space-y-4">
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-coffee-800 dark:text-coffee-100 leading-tight">
                Boost your
                <span className="text-espresso-500"> productivity</span>
                <br />with style
              </h2>
              <p className="text-lg text-coffee-600 dark:text-coffee-300">
                A beautiful Pomodoro timer that helps you stay focused and be more productive.
              </p>
            </div>

            {/* Features Grid - Solo en desktop */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="p-4 bg-white/50 dark:bg-coffee-800/50 rounded-xl backdrop-blur-sm"
                >
                  <div className="text-espresso-500 mb-2">
                    {feature.icon}
                  </div>
                  <h3 className="font-medium text-coffee-800 dark:text-coffee-100 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-1">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mini features - Solo en móvil, debajo del login */}
          <div className="flex justify-center gap-6 order-3 md:hidden mt-4">
            {features.slice(0, 4).map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-espresso-500 flex justify-center mb-1">
                  {feature.icon}
                </div>
                <p className="text-xs text-coffee-600 dark:text-coffee-300">{feature.title}</p>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs md:text-sm text-coffee-500 dark:text-coffee-400">
        Made with ☕ and 💜 by Adrian
      </footer>
    </div>
  );
}