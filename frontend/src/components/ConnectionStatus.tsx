import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export function ConnectionStatus() {
  const { isOnline, pendingActions } = useOfflineSync();

  if (isOnline && pendingActions.length === 0) {
    return null; // No mostrar nada si está online y sin pendientes
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
      isOnline 
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' 
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    }`}>
      {isOnline ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Syncing {pendingActions.length} changes...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline mode</span>
          {pendingActions.length > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {pendingActions.length} pending
            </span>
          )}
        </>
      )}
    </div>
  );
}