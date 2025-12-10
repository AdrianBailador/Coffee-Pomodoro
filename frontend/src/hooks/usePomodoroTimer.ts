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

  const intervalRef = useRef<number | null>(null);
  const taskIdRef = useRef<string | undefined>(undefined);

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

  // Save session to Supabase
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
      console.error('Error saving session start:', error);
      return null;
    }

    return data?.id || null;
  };

  // Complete session in Supabase
  const completeSession = async (sessionId: string, wasCompleted: boolean) => {
    const { error } = await supabase
      .from('pomodoro_sessions')
      .update({
        was_completed: wasCompleted,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing session:', error);
    }
  };

  // Increment task pomodoro count
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

    setState(prev => ({
      ...prev,
      status: 'running',
      currentSessionId: sessionId
    }));
  }, [requestNotificationPermission, state.sessionType, settings]);

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

  const reset = useCallback(async () => {
    clearTimer();
    
    // Mark current session as not completed
    if (state.currentSessionId) {
      await completeSession(state.currentSessionId, false);
    }

    setState(prev => ({
      ...prev,
      status: 'idle',
      timeRemaining: getDuration(prev.sessionType),
      currentSessionId: null
    }));
  }, [clearTimer, getDuration, state.currentSessionId]);

  const skip = useCallback(async () => {
    clearTimer();

    // Mark current session as not completed
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
  }, [clearTimer, getDuration, settings.sessionsBeforeLongBreak, state.currentSessionId]);

  const setSessionType = useCallback((type: SessionType) => {
    clearTimer();
    setState(prev => ({
      ...prev,
      status: 'idle',
      sessionType: type,
      timeRemaining: getDuration(type),
      currentSessionId: null
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
            sendNotification('Caffè Pomodoro', message);

            // Mark session as completed
            if (prev.currentSessionId) {
              completeSession(prev.currentSessionId, true);
              
              // Increment task pomodoro if it was a work session
              if (isWork && taskIdRef.current) {
                incrementTaskPomodoro(taskIdRef.current);
              }
            }

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