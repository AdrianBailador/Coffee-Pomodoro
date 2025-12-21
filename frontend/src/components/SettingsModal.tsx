import { useState } from 'react';
import { X, Coffee, Leaf, Sunrise, RotateCcw, Mail } from 'lucide-react';

interface Settings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('caffe-pomodoro-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          workDuration: 25,
          shortBreak: 5,
          longBreak: 15,
          sessionsBeforeLongBreak: 4
        };
      }
    }
    return {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4
    };
  });

  const handleSave = () => {
    localStorage.setItem('caffe-pomodoro-settings', JSON.stringify(settings));
    onClose();
    window.location.reload();
  };

  const handleReset = () => {
    const defaults = {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4
    };
    setSettings(defaults);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-coffee-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-200 dark:border-coffee-700">
          <h2 className="text-xl font-semibold text-coffee-800 dark:text-coffee-100">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-full hover:bg-coffee-100 dark:hover:bg-coffee-800 text-coffee-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Work Duration */}
          <div className="space-y-2">
            <label 
              htmlFor="work-duration"
              className="flex items-center gap-2 text-sm font-medium text-coffee-700 dark:text-coffee-200"
            >
              <Coffee className="w-4 h-4 text-espresso-500" />
              Work Duration (minutes)
            </label>
            <input
              id="work-duration"
              type="number"
              min="1"
              max="60"
              value={settings.workDuration}
              onChange={(e) => setSettings({ ...settings, workDuration: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-800 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
          </div>

          {/* Short Break */}
          <div className="space-y-2">
            <label 
              htmlFor="short-break"
              className="flex items-center gap-2 text-sm font-medium text-coffee-700 dark:text-coffee-200"
            >
              <Leaf className="w-4 h-4 text-emerald-500" />
              Short Break (minutes)
            </label>
            <input
              id="short-break"
              type="number"
              min="1"
              max="30"
              value={settings.shortBreak}
              onChange={(e) => setSettings({ ...settings, shortBreak: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-800 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
          </div>

          {/* Long Break */}
          <div className="space-y-2">
            <label 
              htmlFor="long-break"
              className="flex items-center gap-2 text-sm font-medium text-coffee-700 dark:text-coffee-200"
            >
              <Sunrise className="w-4 h-4 text-sky-500" />
              Long Break (minutes)
            </label>
            <input
              id="long-break"
              type="number"
              min="1"
              max="60"
              value={settings.longBreak}
              onChange={(e) => setSettings({ ...settings, longBreak: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-800 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
          </div>

          {/* Sessions before long break */}
          <div className="space-y-2">
            <label 
              htmlFor="sessions-before-long-break"
              className="flex items-center gap-2 text-sm font-medium text-coffee-700 dark:text-coffee-200"
            >
              <RotateCcw className="w-4 h-4 text-coffee-500" />
              Sessions before long break
            </label>
            <input
              id="sessions-before-long-break"
              type="number"
              min="1"
              max="10"
              value={settings.sessionsBeforeLongBreak}
              onChange={(e) => setSettings({ ...settings, sessionsBeforeLongBreak: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-coffee-200 dark:border-coffee-600 bg-white dark:bg-coffee-800 text-coffee-800 dark:text-coffee-100 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
          </div>

          {/* Support Section */}
          <div className="pt-4 border-t border-coffee-200 dark:border-coffee-700">
            <div className="flex items-center gap-2 text-sm font-medium text-coffee-700 dark:text-coffee-200 mb-2">
              <Mail className="w-4 h-4 text-espresso-500" />
              Support
            </div>
            <p className="text-sm text-coffee-500 dark:text-coffee-400">
              Questions, feedback or issues? Contact us at{' '}
              <a 
                href="mailto:abailador.dev@gmail.com"
                className="text-espresso-500 hover:underline"
              >
                abailador.dev@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-coffee-200 dark:border-coffee-700 bg-coffee-50 dark:bg-coffee-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-100 dark:hover:bg-coffee-700 rounded-lg transition-colors"
          >
            Reset to defaults
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-100 dark:hover:bg-coffee-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-espresso-500 text-white rounded-lg hover:bg-espresso-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}