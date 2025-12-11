import { Coffee, Leaf, Sunrise, X } from 'lucide-react';
import { SessionType } from '../types';

interface TimerAlertProps {
  isOpen: boolean;
  sessionType: SessionType;
  onClose: () => void;
}

export function TimerAlert({ isOpen, sessionType, onClose }: TimerAlertProps) {
  if (!isOpen) return null;

  const config = {
    [SessionType.Work]: {
      icon: <Coffee className="w-12 h-12" />,
      title: '☕ Pomodoro Complete!',
      message: 'Great job! Time for a well-deserved break.',
      color: 'from-espresso-500 to-espresso-600',
      bgColor: 'bg-espresso-50 dark:bg-espresso-900/30'
    },
    [SessionType.ShortBreak]: {
      icon: <Leaf className="w-12 h-12" />,
      title: '🌿 Break Over!',
      message: 'Feeling refreshed? Let\'s get back to work!',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30'
    },
    [SessionType.LongBreak]: {
      icon: <Sunrise className="w-12 h-12" />,
      title: '🌅 Long Break Over!',
      message: 'Ready to start a new cycle? Let\'s go!',
      color: 'from-sky-500 to-sky-600',
      bgColor: 'bg-sky-50 dark:bg-sky-900/30'
    }
  };

  const { icon, title, message, color, bgColor } = config[sessionType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-sm ${bgColor} rounded-2xl shadow-2xl p-6 space-y-4 animate-bounce-in`}>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-coffee-400 hover:text-coffee-600 dark:hover:text-coffee-200 transition-colors"
          aria-label="Close alert"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className={`p-4 bg-gradient-to-br ${color} rounded-full text-white shadow-lg`}>
            {icon}
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="font-display text-2xl font-bold text-coffee-800 dark:text-coffee-100">
            {title}
          </h3>
          <p className="text-coffee-600 dark:text-coffee-300">
            {message}
          </p>
        </div>

        {/* Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl bg-gradient-to-r ${color} text-white font-medium shadow-lg hover:shadow-xl transition-all`}
        >
          {sessionType === SessionType.Work ? 'Start Break' : 'Start Working'}
        </button>
      </div>
    </div>
  );
}