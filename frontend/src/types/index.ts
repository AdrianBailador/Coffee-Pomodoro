// ========== User Types ==========

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface UserSettings {
  workDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  darkMode: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  settings: UserSettings;
}

// ========== Task Types ==========

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  priority: TaskPriority;
  createdAt: string;
  completedAt?: string;
  displayOrder: number;
}

export enum TaskPriority {
  Normal = 0,
  High = 1,
  Urgent = 2
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  estimatedPomodoros?: number;
  priority?: TaskPriority;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  estimatedPomodoros?: number;
  priority?: TaskPriority;
  displayOrder?: number;
}

// ========== Session Types ==========

export enum SessionType {
  Work = 0,
  ShortBreak = 1,
  LongBreak = 2
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  type: SessionType;
  durationMinutes: number;
  startedAt: string;
  completedAt?: string;
  wasCompleted: boolean;
}

export interface StartSessionDto {
  type: SessionType;
  taskId?: string;
  durationMinutes?: number;
}

// ========== Stats Types ==========

export interface DailyStats {
  date: string;
  totalSessions: number;
  completedSessions: number;
  totalMinutes: number;
  tasksCompleted: number;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  totalMinutes: number;
  tasksCompleted: number;
  dailyBreakdown: DailyStats[];
}

// ========== Timer State ==========

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerState {
  status: TimerStatus;
  sessionType: SessionType;
  totalSeconds: number;
  remainingSeconds: number;
  completedSessions: number;
  currentTaskId?: string;
}
