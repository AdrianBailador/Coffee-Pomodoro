import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Leaf, Sunrise, Plus, Minus, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { SessionType } from '../types';
import { CoffeeCup } from './CoffeeCup';
import { TimerAlert } from './TimerAlert';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { useNotificationSound } from '../hooks/useNotificationSound';

interface TimerProps {
  selectedTaskId?: string;
  onSessionComplete?: (sessionType: SessionType) => void;
}

export function Timer({ selectedTaskId, onSessionComplete }: TimerProps) {
  const {
    state,
    progress,
    formattedTime,
    start,
    pause,
    resume,
    reset,
    skip,
    setSessionType,
    addTime,
    subtractTime
  } = usePomodoroTimer();

  const { sendBrowserNotification, requestNotificationPermission } = useNotificationSound();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [completedSessionType, setCompletedSessionType] = useState<SessionType>(SessionType.Work);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('caffe-pomodoro-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { workDuration: 25, shortBreak: 5, longBreak: 15, sessionsBeforeLongBreak: 4 };
      }
    }
    return { workDuration: 25, shortBreak: 5, longBreak: 15, sessionsBeforeLongBreak: 4 };
  });

useEffect(() => {
  if (state.status === 'completed') {
    setCompletedSessionType(state.sessionType);
    setShowAlert(true);
    
    // Notificación con sonido
    const isWork = state.sessionType === SessionType.Work;
    const title = isWork ? '☕ Pomodoro Complete!' : '🌿 Break Over!';
    const body = isWork ? 'Time for a well-deserved break!' : 'Ready to get back to work?';
    sendBrowserNotification(title, body);
  }
}, [state.status, state.sessionType, sendBrowserNotification]);

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isIdle = state.status === 'idle';
  const isCompleted = state.status === 'completed';

const handleStart = () => {
  requestNotificationPermission();
  start(selectedTaskId);
};

  const handleSkip = () => {
    if (state.sessionType === SessionType.Work) {
      onSessionComplete?.(state.sessionType);
    }
    skip();
  };

  const handleSaveSettings = () => {
    localStorage.setItem('caffe-pomodoro-settings', JSON.stringify(settings));
    window.location.reload();
  };

  const getSessionLabel = () => {
    switch (state.sessionType) {
      case SessionType.Work:
        return 'Work Time';
      case SessionType.ShortBreak:
        return 'Short Break';
      case SessionType.LongBreak:
        return 'Long Break';
    }
  };

  const getSessionIcon = () => {
    switch (state.sessionType) {
      case SessionType.Work:
        return <Coffee className="w-5 h-5" />;
      case SessionType.ShortBreak:
        return <Leaf className="w-5 h-5" />;
      case SessionType.LongBreak:
        return <Sunrise className="w-5 h-5" />;
    }
  };

  return (
    <>
      {/* Alert Modal */}
      <TimerAlert 
        isOpen={showAlert} 
        sessionType={completedSessionType}
        onClose={handleCloseAlert}
      />

      <div className="flex flex-col items-center gap-6">
        {/* Session Type Selector */}
        <div className="flex gap-2 p-1 bg-coffee-100 dark:bg-coffee-800 rounded-full">
          <button
            aria-label="Work session"
            onClick={() => setSessionType(SessionType.Work)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              state.sessionType === SessionType.Work
                ? 'bg-espresso-600 text-white shadow-lg'
                : 'text-coffee-700 dark:text-coffee-200 hover:bg-coffee-200 dark:hover:bg-coffee-700'
            }`}
            disabled={isRunning}
          >
            <Coffee className="w-4 h-4" />
            <span className="hidden sm:inline">Work</span>
          </button>
          <button
            aria-label="Short break"
            onClick={() => setSessionType(SessionType.ShortBreak)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              state.sessionType === SessionType.ShortBreak
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-coffee-700 dark:text-coffee-200 hover:bg-coffee-200 dark:hover:bg-coffee-700'
            }`}
            disabled={isRunning}
          >
            <Leaf className="w-4 h-4" />
            <span className="hidden sm:inline">Short</span>
          </button>
          <button
            aria-label="Long break"
            onClick={() => setSessionType(SessionType.LongBreak)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              state.sessionType === SessionType.LongBreak
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-coffee-700 dark:text-coffee-200 hover:bg-coffee-200 dark:hover:bg-coffee-700'
            }`}
            disabled={isRunning}
          >
            <Sunrise className="w-4 h-4" />
            <span className="hidden sm:inline">Long</span>
          </button>
        </div>

        {/* Current Session Label */}
        <div className="flex items-center gap-2 text-coffee-700 dark:text-coffee-200">
          {getSessionIcon()}
          <span className="font-display text-lg">{getSessionLabel()}</span>
        </div>

        {/* Coffee Cup Timer */}
        <div className="relative">
          <CoffeeCup 
            progress={progress} 
            sessionType={state.sessionType}
            isRunning={isRunning}
          />
          
          {/* Time Display Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 dark:bg-coffee-900/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg mt-12">
              <span className="font-display text-5xl font-bold text-coffee-800 dark:text-coffee-100 tabular-nums">
                {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Time Adjust Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Subtract 1 minute"
            onClick={subtractTime}
            disabled={isRunning || state.timeRemaining <= 60}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-coffee-100 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200 dark:hover:bg-coffee-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          <span className="text-sm text-coffee-500 dark:text-coffee-400">Adjust time</span>
          <button
            type="button"
            aria-label="Add 1 minute"
            onClick={addTime}
            disabled={isRunning}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-coffee-100 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200 dark:hover:bg-coffee-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Session Counter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-coffee-600 dark:text-coffee-300">
            Sessions completed:
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < (state.completedSessions % 4)
                    ? 'bg-espresso-500'
                    : 'bg-coffee-200 dark:bg-coffee-700'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-espresso-600 dark:text-espresso-400">
            ({state.completedSessions})
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="p-3 rounded-full bg-coffee-100 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200 dark:hover:bg-coffee-700 transition-colors"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          {isIdle || isCompleted ? (
            <button
              type="button"
              onClick={handleStart}
              aria-label="Start timer"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-espresso-500 to-espresso-600 text-white font-medium text-lg shadow-lg hover:shadow-xl hover:from-espresso-600 hover:to-espresso-700 transition-all transform hover:scale-105"
            >
              <Play className="w-6 h-6" />
              {isCompleted ? 'Next' : 'Start'}
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={resume}
              aria-label="Resume timer"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-espresso-500 to-espresso-600 text-white font-medium text-lg shadow-lg hover:shadow-xl hover:from-espresso-600 hover:to-espresso-700 transition-all transform hover:scale-105"
            >
              <Play className="w-6 h-6" />
              Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              aria-label="Pause timer"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium text-lg shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              <Pause className="w-6 h-6" />
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={handleSkip}
            className="p-3 rounded-full bg-coffee-100 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200 dark:hover:bg-coffee-700 transition-colors"
            aria-label="Skip session"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

{/* Settings Panel */}
<div className="w-full max-w-md mt-4">
  <button
    type="button"
    onClick={() => setShowSettings(!showSettings)}
    className="w-full flex items-center justify-center gap-2 py-2 text-coffee-600 dark:text-coffee-300 hover:text-espresso-500 transition-colors"
  >
    <Settings className="w-4 h-4" />
    <span className="text-sm font-medium">Timer Settings</span>
    {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
  </button>

  {showSettings && (
    <div className="mt-4 p-4 bg-coffee-50 dark:bg-coffee-800 rounded-xl space-y-4">
      {/* Work Duration */}
      <div className="flex items-center justify-between">
        <label htmlFor="settings-work" className="flex items-center gap-2 text-sm text-coffee-700 dark:text-coffee-200">
          <Coffee className="w-4 h-4 text-espresso-500" />
          Work
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease work duration"
            onClick={() => setSettings({ ...settings, workDuration: Math.max(1, settings.workDuration - 1) })}
            className="w-8 h-8 rounded-full bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600"
          >
            <Minus className="w-4 h-4 mx-auto" />
          </button>
          <div className="relative">
            <input
              id="settings-work"
              type="text"
              inputMode="numeric"
              value={settings.workDuration}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setSettings({ ...settings, workDuration: value === '' ? '' : parseInt(value) });
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 25;
                setSettings({ ...settings, workDuration: Math.min(60, Math.max(1, value)) });
              }}
              className="w-14 text-center font-medium text-coffee-800 dark:text-coffee-100 bg-white dark:bg-coffee-900 border border-coffee-200 dark:border-coffee-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-coffee-400">m</span>
          </div>
          <button
            type="button"
            aria-label="Increase work duration"
            onClick={() => setSettings({ ...settings, workDuration: Math.min(60, (parseInt(settings.workDuration) || 0) + 1) })}
            className="w-8 h-8 rounded-full bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600"
          >
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* Short Break */}
      <div className="flex items-center justify-between">
        <label htmlFor="settings-short" className="flex items-center gap-2 text-sm text-coffee-700 dark:text-coffee-200">
          <Leaf className="w-4 h-4 text-emerald-500" />
          Short Break
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease short break duration"
            onClick={() => setSettings({ ...settings, shortBreak: Math.max(1, settings.shortBreak - 1) })}
            className="w-8 h-8 rounded-full bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600"
          >
            <Minus className="w-4 h-4 mx-auto" />
          </button>
          <div className="relative">
            <input
              id="settings-short"
              type="text"
              inputMode="numeric"
              value={settings.shortBreak}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setSettings({ ...settings, shortBreak: value === '' ? '' : parseInt(value) });
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 5;
                setSettings({ ...settings, shortBreak: Math.min(30, Math.max(1, value)) });
              }}
              className="w-14 text-center font-medium text-coffee-800 dark:text-coffee-100 bg-white dark:bg-coffee-900 border border-coffee-200 dark:border-coffee-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-coffee-400">m</span>
          </div>
          <button
            type="button"
            aria-label="Increase short break duration"
            onClick={() => setSettings({ ...settings, shortBreak: Math.min(30, (parseInt(settings.shortBreak) || 0) + 1) })}
            className="w-8 h-8 rounded-full bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600"
          >
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* Long Break */}
      <div className="flex items-center justify-between">
        <label htmlFor="settings-long" className="flex items-center gap-2 text-sm text-coffee-700 dark:text-coffee-200">
          <Sunrise className="w-4 h-4 text-sky-500" />
          Long Break
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease long break duration"
            onClick={() => setSettings({ ...settings, longBreak: Math.max(1, settings.longBreak - 1) })}
            className="w-8 h-8 rounded-full bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600"
          >
            <Minus className="w-4 h-4 mx-auto" />
          </button>
          <div className="relative">
            <input
              id="settings-long"
              type="text"
              inputMode="numeric"
              value={settings.longBreak}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setSettings({ ...settings, longBreak: value === '' ? '' : parseInt(value) });
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 15;
                setSettings({ ...settings, longBreak: Math.min(60, Math.max(1, value)) });
              }}
              className="w-14 text-center font-medium text-coffee-800 dark:text-coffee-100 bg-white dark:bg-coffee-900 border border-coffee-200 dark:border-coffee-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-coffee-400">m</span>
          </div>
          <button
            type="button"
            aria-label="Increase long break duration"
            onClick={() => setSettings({ ...settings, longBreak: Math.min(60, (parseInt(settings.longBreak) || 0) + 1) })}
            className="w-8 h-8 rounded-full bg-coffee-200 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-300 dark:hover:bg-coffee-600"
          >
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSaveSettings}
        className="w-full py-2 mt-2 bg-espresso-500 text-white rounded-lg hover:bg-espresso-600 transition-colors font-medium"
      >
        Save Settings
      </button>
    </div>
  )}
</div>
      </div>
    </>
  );
}