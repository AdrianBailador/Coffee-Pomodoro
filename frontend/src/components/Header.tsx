import { Sun, Moon, LogOut, User, Settings, Coffee } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SettingsModal } from './SettingsModal';

export function Header() {
  const { user, profile, signIn, logOut, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-coffee-900/80 backdrop-blur-md border-b border-coffee-200 dark:border-coffee-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-espresso-500 to-espresso-700 rounded-xl shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-coffee-800 dark:text-coffee-100">
                Coffee Pomodoro
              </h1>
              <p className="text-xs text-coffee-500 dark:text-coffee-400 hidden sm:block">
                Productivity with style
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
              className="p-2 rounded-full bg-coffee-100 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200 dark:hover:bg-coffee-700 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Menu / Login */}
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-coffee-200 dark:bg-coffee-700 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="User menu"
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-coffee-100 dark:hover:bg-coffee-800 transition-colors"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName || 'User'}
                      className="w-9 h-9 rounded-full border-2 border-espresso-500"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-espresso-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-coffee-800 rounded-xl shadow-xl border border-coffee-200 dark:border-coffee-700 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-coffee-200 dark:border-coffee-700">
                      <p className="font-medium text-coffee-800 dark:text-coffee-100 truncate">
                        {profile?.displayName || 'User'}
                      </p>
                      <p className="text-sm text-coffee-500 dark:text-coffee-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowSettings(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-coffee-700 dark:text-coffee-200 hover:bg-coffee-100 dark:hover:bg-coffee-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        logOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signIn}
                aria-label="Sign in with Google"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-espresso-500 to-espresso-600 text-white font-medium hover:from-espresso-600 hover:to-espresso-700 transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}