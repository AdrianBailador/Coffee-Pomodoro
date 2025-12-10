import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionType } from '../types';

interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  sessionType: SessionType;
  timeRemaining: number;
  completedSessions: number;
}

interface PomodoroSettings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
}

const getStoredSettings = (): PomodoroSettings => {
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
};

export function usePomodoroTimer() {
  const settings = getStoredSettings();
  
  const getDuration = useCallback((type: SessionType) => {
    switch (type) {
      case SessionType.Work:
        return settings.workDuration * 60;
      case SessionType.ShortBreak:
        return settings.shortBreak * 60;
      case SessionType.LongBreak:
        return settings.longBreak * 60;
      default:
        return settings.workDuration * 60;
    }
  }, [settings.workDuration, settings.shortBreak, settings.longBreak]);

  const [state, setState] = useState<TimerState>({
    status: 'idle',
    sessionType: SessionType.Work,
    timeRemaining: getDuration(SessionType.Work),
    completedSessions: 0
  });

  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const progress = 1 - state.timeRemaining / getDuration(state.sessionType);

  const formattedTime = `${Math.floor(state.timeRemaining / 60)
    .toString()
    .padStart(2, '0')}:${(state.timeRemaining % 60).toString().padStart(2, '0')}`;

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/coffee.svg' });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const start = useCallback((_taskId?: string) => {
    requestNotificationPermission();
    setState(prev => ({
      ...prev,
      status: 'running'
    }));
  }, [requestNotificationPermission]);

  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'paused'
    }));
  }, []);

  const resume = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'running'
    }));
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setState(prev => ({
      ...prev,
      status: 'idle',
      timeRemaining: getDuration(prev.sessionType)
    }));
  }, [clearTimer, getDuration]);

  const skip = useCallback(() => {
    clearTimer();
    setState(prev => {
      const isWork = prev.sessionType === SessionType.Work;
      const newCompletedSessions = isWork ? prev.completedSessions + 1 : prev.completedSessions;
      
      let nextSessionType: SessionType;
      if (isWork) {
        nextSessionType = newCompletedSessions % settings.sessionsBeforeLongBreak === 0
          ? SessionType.LongBreak
          : SessionType.ShortBreak;
      } else {
        nextSessionType = SessionType.Work;
      }

      return {
        status: 'idle',
        sessionType: nextSessionType,
        timeRemaining: getDuration(nextSessionType),
        completedSessions: newCompletedSessions
      };
    });
  }, [clearTimer, getDuration, settings.sessionsBeforeLongBreak]);

  const setSessionType = useCallback((type: SessionType) => {
    clearTimer();
    setState(prev => ({
      ...prev,
      status: 'idle',
      sessionType: type,
      timeRemaining: getDuration(type)
    }));
  }, [clearTimer, getDuration]);

  const addTime = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeRemaining: prev.timeRemaining + 60
    }));
  }, []);

  const subtractTime = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeRemaining: Math.max(60, prev.timeRemaining - 60)
    }));
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (state.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining <= 1) {
            clearTimer();
            
            const isWork = prev.sessionType === SessionType.Work;
            const message = isWork ? 'Time for a break!' : 'Time to work!';
            sendNotification('Coffee Pomodoro', message);

            return {
              ...prev,
              status: 'completed',
              timeRemaining: 0
            };
          }
          
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1
          };
        });
      }, 1000);
    } else {
      clearTimer();
    }

    return () => clearTimer();
  }, [state.status, clearTimer, sendNotification]);

  // Auto-advance after completion
  useEffect(() => {
    if (state.status === 'completed') {
      const timeout = setTimeout(() => {
        skip();
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [state.status, skip]);

  return {
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
  };
}