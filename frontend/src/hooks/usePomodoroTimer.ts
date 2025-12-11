import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionType } from '../types';
import { supabase } from '../services/supabase';

interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  sessionType: SessionType;
  timeRemaining: number;
  completedSessions: number;
  currentSessionId: string | null;
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
  const workerRef = useRef<Worker | null>(null);
  const taskIdRef = useRef<string | undefined>(undefined);

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
    completedSessions: 0,
    currentSessionId: null
  });

  const progress = 1 - state.timeRemaining / getDuration(state.sessionType);

  const formattedTime = `${Math.floor(state.timeRemaining / 60)
    .toString()
    .padStart(2, '0')}:${(state.timeRemaining % 60).toString().padStart(2, '0')}`;

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/Coffee-Pomodoro/icon-192.png' });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Inicializar Web Worker
  useEffect(() => {
    const workerPath = import.meta.env.PROD 
      ? '/Coffee-Pomodoro/timer-worker.js' 
      : '/timer-worker.js';
    
    workerRef.current = new Worker(workerPath);

    workerRef.current.onmessage = (e) => {
      const { type, remaining } = e.data;

      if (type === 'tick') {
        setState(prev => ({
          ...prev,
          timeRemaining: remaining
        }));
      }

      if (type === 'complete') {
        setState(prev => {
          const isWork = prev.sessionType === SessionType.Work;
          const message = isWork ? 'Time for a break!' : 'Time to work!';
          sendNotification('Coffee Pomodoro', message);

          // Completar sesión en Supabase
          if (prev.currentSessionId) {
            completeSession(prev.currentSessionId, true);
            if (isWork && taskIdRef.current) {
              incrementTaskPomodoro(taskIdRef.current);
            }
          }

          return {
            ...prev,
            status: 'completed',
            timeRemaining: 0
          };
        });
      }
    };

    // Sincronizar cuando la pestaña vuelve a estar activa
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && workerRef.current) {
        workerRef.current.postMessage({ action: 'sync' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      workerRef.current?.terminate();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendNotification]);

  // Supabase functions
  const saveSessionStart = async (type: SessionType, taskId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const duration = type === SessionType.Work 
      ? settings.workDuration 
      : type === SessionType.ShortBreak 
        ? settings.shortBreak 
        : settings.longBreak;

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        task_id: taskId || null,
        type: type,
        duration_minutes: duration,
        was_completed: false,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving session:', error);
      return null;
    }
    return data?.id || null;
  };

  const completeSession = async (sessionId: string, wasCompleted: boolean) => {
    await supabase
      .from('pomodoro_sessions')
      .update({
        was_completed: wasCompleted,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  };

  const incrementTaskPomodoro = async (taskId: string) => {
    const { data: task } = await supabase
      .from('todo_tasks')
      .select('completed_pomodoros')
      .eq('id', taskId)
      .single();

    if (task) {
      await supabase
        .from('todo_tasks')
        .update({ completed_pomodoros: task.completed_pomodoros + 1 })
        .eq('id', taskId);
    }
  };

  const start = useCallback(async (taskId?: string) => {
    requestNotificationPermission();
    taskIdRef.current = taskId;

    const sessionId = await saveSessionStart(state.sessionType, taskId);

    workerRef.current?.postMessage({ 
      action: 'start', 
      duration: state.timeRemaining 
    });

    setState(prev => ({
      ...prev,
      status: 'running',
      currentSessionId: sessionId
    }));
  }, [requestNotificationPermission, state.sessionType, state.timeRemaining]);

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ action: 'pause' });
    setState(prev => ({
      ...prev,
      status: 'paused'
    }));
  }, []);

  const resume = useCallback(() => {
    workerRef.current?.postMessage({ 
      action: 'resume', 
      remaining: state.timeRemaining 
    });
    setState(prev => ({
      ...prev,
      status: 'running'
    }));
  }, [state.timeRemaining]);

  const reset = useCallback(async () => {
    workerRef.current?.postMessage({ action: 'stop' });

    if (state.currentSessionId) {
      await completeSession(state.currentSessionId, false);
    }

    setState(prev => ({
      ...prev,
      status: 'idle',
      timeRemaining: getDuration(prev.sessionType),
      currentSessionId: null
    }));
  }, [getDuration, state.currentSessionId]);

  const skip = useCallback(async () => {
    workerRef.current?.postMessage({ action: 'stop' });

    if (state.currentSessionId) {
      await completeSession(state.currentSessionId, false);
    }

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
        completedSessions: newCompletedSessions,
        currentSessionId: null
      };
    });
  }, [getDuration, settings.sessionsBeforeLongBreak, state.currentSessionId]);

  const setSessionType = useCallback((type: SessionType) => {
    workerRef.current?.postMessage({ action: 'stop' });
    setState(prev => ({
      ...prev,
      status: 'idle',
      sessionType: type,
      timeRemaining: getDuration(type),
      currentSessionId: null
    }));
  }, [getDuration]);

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

  // Auto-advance after completion
  useEffect(() => {
    if (state.status === 'completed') {
      const timeout = setTimeout(() => {
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
            completedSessions: newCompletedSessions,
            currentSessionId: null
          };
        });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [state.status, getDuration, settings.sessionsBeforeLongBreak]);

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