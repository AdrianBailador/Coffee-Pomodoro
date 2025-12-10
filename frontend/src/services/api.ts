import { supabase } from './supabase';
import type { 
  Task, 
  CreateTaskDto, 
  UpdateTaskDto, 
  UserSettings, 
  UserProfile,
  PomodoroSession,
  StartSessionDto,
  DailyStats,
  WeeklyStats
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    })
  };
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ========== Auth API ==========

export const authApi = {
  syncUser: () => fetchWithAuth<UserProfile>('/auth/sync', { method: 'POST' }),
  getCurrentUser: () => fetchWithAuth<UserProfile>('/auth/me'),
};

// ========== Tasks API ==========

export const tasksApi = {
  getAll: () => fetchWithAuth<Task[]>('/tasks'),
  
  getById: (id: string) => fetchWithAuth<Task>(`/tasks/${id}`),
  
  create: (dto: CreateTaskDto) => 
    fetchWithAuth<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(dto)
    }),
  
  update: (id: string, dto: UpdateTaskDto) =>
    fetchWithAuth<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto)
    }),
  
  delete: (id: string) =>
    fetchWithAuth<void>(`/tasks/${id}`, { method: 'DELETE' }),
  
  incrementPomodoro: (id: string) =>
    fetchWithAuth<Task>(`/tasks/${id}/increment-pomodoro`, { method: 'POST' }),
  
  reorder: (taskIds: string[]) =>
    fetchWithAuth<Task[]>('/tasks/reorder', {
      method: 'POST',
      body: JSON.stringify(taskIds)
    }),
};

// ========== Sessions API ==========

export const sessionsApi = {
  start: (dto: StartSessionDto) =>
    fetchWithAuth<PomodoroSession>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(dto)
    }),
  
  complete: (id: string, wasCompleted: boolean = true) =>
    fetchWithAuth<PomodoroSession>(`/sessions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ wasCompleted })
    }),
  
  getCurrent: () => fetchWithAuth<PomodoroSession | null>('/sessions/current'),
  
  getHistory: (days: number = 7) =>
    fetchWithAuth<PomodoroSession[]>(`/sessions/history?days=${days}`),
  
  getTodayStats: () => fetchWithAuth<DailyStats>('/sessions/stats/today'),
  
  getWeeklyStats: () => fetchWithAuth<WeeklyStats>('/sessions/stats/week'),
};

// ========== Settings API ==========

export const settingsApi = {
  get: () => fetchWithAuth<UserSettings>('/settings'),
  
  update: (dto: Partial<UserSettings>) =>
    fetchWithAuth<UserSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(dto)
    }),
};
