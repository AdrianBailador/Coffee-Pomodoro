import { useState, useEffect, useCallback } from 'react';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const PENDING_ACTIONS_KEY = 'caffe-pomodoro-pending-actions';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PENDING_ACTIONS_KEY);
    if (saved) {
      try {
        setPendingActions(JSON.parse(saved));
      } catch {
        setPendingActions([]);
      }
    }
  }, []);

  // Save pending actions to localStorage
  useEffect(() => {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add a pending action
  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    setPendingActions(prev => [...prev, newAction]);
  }, []);

  // Remove a pending action
  const removePendingAction = useCallback((id: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== id));
  }, []);

  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  return {
    isOnline,
    pendingActions,
    isSyncing,
    setIsSyncing,
    addPendingAction,
    removePendingAction,
    clearPendingActions
  };
}