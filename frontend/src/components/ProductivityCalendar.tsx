import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Flame, Trophy, Coffee, Lock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

interface DayData {
  date: string;
  count: number;
}

export function ProductivityCalendar() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentStreak: 0,
    bestStreak: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  const isGuest = localStorage.getItem('caffe-pomodoro-guest') === 'true';

  useEffect(() => {
    if (isPremium) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, currentMonth, isPremium]);

  const loadData = async () => {
    if (!user && !isGuest) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    if (user) {
      const { data: sessions, error } = await supabase
        .from('pomodoro_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('was_completed', true)
        .eq('type', 0)
        .gte('completed_at', startOfMonth.toISOString())
        .lte('completed_at', endOfMonth.toISOString());

      if (error) {
        console.error('Error loading sessions:', error);
        setLoading(false);
        return;
      }

      const grouped = groupByDate(sessions || []);
      setData(grouped);
      calculateStats(grouped);
    } else if (isGuest) {
      const saved = localStorage.getItem('caffe-pomodoro-sessions');
      if (saved) {
        try {
          const sessions = JSON.parse(saved);
          const filtered = sessions.filter((s: any) => {
            const date = new Date(s.completed_at);
            return date >= startOfMonth && date <= endOfMonth && s.was_completed && s.type === 0;
          });
          const grouped = groupByDate(filtered);
          setData(grouped);
          calculateStats(grouped);
        } catch {
          setData([]);
        }
      }
    }

    setLoading(false);
  };

  const groupByDate = (sessions: any[]): DayData[] => {
    const counts: { [key: string]: number } = {};

    sessions.forEach(session => {
      const date = new Date(session.completed_at).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  };

  const calculateStats = (dayData: DayData[]) => {
    const today = new Date();
    const sortedDates = dayData
      .map(d => d.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Current streak
    let currentStreak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (currentStreak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (checkDate < new Date(today.getTime() - 86400000)) break;
      } else {
        break;
      }
    }

    // Best streak
    let bestStreak = 0;
    let tempStreak = 0;
    const allDates = [...new Set(sortedDates)].sort();

    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(allDates[i - 1]);
        const curr = new Date(allDates[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    // This week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const thisWeek = dayData
      .filter(d => new Date(d.date) >= weekStart)
      .reduce((sum, d) => sum + d.count, 0);

    // This month
    const thisMonth = dayData.reduce((sum, d) => sum + d.count, 0);

    setStats({ currentStreak, bestStreak, thisWeek, thisMonth });
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-coffee-100 dark:bg-coffee-800';
    if (count <= 2) return 'bg-amber-200 dark:bg-amber-900';
    if (count <= 4) return 'bg-amber-400 dark:bg-amber-700';
    return 'bg-espresso-500 dark:bg-espresso-600';
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Padding for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i).toISOString().split('T')[0];
      const dayData = data.find(d => d.date === date);
      days.push({ date, count: dayData?.count || 0 });
    }

    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Blocked view for free users
  if (!isPremium) {
    return (
      <div className="bg-white dark:bg-coffee-900 rounded-2xl shadow-lg p-6 border border-coffee-200 dark:border-coffee-700 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-espresso-500" />
          <h3 className="font-semibold text-coffee-800 dark:text-coffee-100">Productivity Calendar</h3>
        </div>

        {/* Blurred preview */}
        <div className="filter blur-sm pointer-events-none">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-xs text-center text-coffee-500 py-1">{day}</div>
            ))}
            {Array(35).fill(0).map((_, i) => (
              <div key={i} className={`aspect-square rounded-sm ${i % 5 === 0 ? 'bg-amber-300' : 'bg-coffee-100'}`} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-coffee-50 dark:bg-coffee-800 rounded-lg p-2">
              <div className="text-lg font-bold text-espresso-500">7</div>
              <div className="text-xs text-coffee-500">Day Streak</div>
            </div>
            <div className="bg-coffee-50 dark:bg-coffee-800 rounded-lg p-2">
              <div className="text-lg font-bold text-espresso-500">23</div>
              <div className="text-xs text-coffee-500">This Month</div>
            </div>
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 bg-white/60 dark:bg-coffee-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-coffee-100 dark:bg-coffee-800 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-coffee-500" />
          </div>
          <p className="text-sm font-medium text-coffee-700 dark:text-coffee-200 mb-1">Premium Feature</p>
          <p className="text-xs text-coffee-500 dark:text-coffee-400">Upgrade to track your productivity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-coffee-900 rounded-2xl shadow-lg p-6 border border-coffee-200 dark:border-coffee-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-espresso-500" />
          <h3 className="font-semibold text-coffee-800 dark:text-coffee-100">Productivity Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-1 hover:bg-coffee-100 dark:hover:bg-coffee-800 rounded"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-coffee-700 dark:text-coffee-200 min-w-[100px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-1 hover:bg-coffee-100 dark:hover:bg-coffee-800 rounded"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-coffee-200 border-t-espresso-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-xs text-center text-coffee-500 py-1">{day}</div>
            ))}

            {getDaysInMonth().map((day, i) => {
              // 1. Obtenemos el número del día si existe 'day'
              // Usamos split para evitar problemas de zona horaria con 'new Date'
              const dayNumber = day ? parseInt(day.date.split('-')[2]) : null;

              return (
                <div
                  key={i}
                  className={`
          aspect-square rounded-sm 
          flex items-center justify-center text-[10px] md:text-xs font-medium 
          ${day ? getIntensity(day.count) : 'bg-transparent'}
          ${day ? 'text-coffee-700 dark:text-coffee-100' : ''} 
        `}
                  title={day ? `${day.date}: ${day.count} pomodoros` : ''}
                >
                  {/* 2. Renderizamos el número aquí */}
                  {dayNumber}
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-coffee-50 dark:bg-coffee-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-lg font-bold text-espresso-500">{stats.currentStreak}</span>
              </div>
              <div className="text-xs text-coffee-500">Streak</div>
            </div>
            <div className="bg-coffee-50 dark:bg-coffee-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-lg font-bold text-espresso-500">{stats.bestStreak}</span>
              </div>
              <div className="text-xs text-coffee-500">Best</div>
            </div>
            <div className="bg-coffee-50 dark:bg-coffee-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Coffee className="w-4 h-4 text-espresso-500" />
                <span className="text-lg font-bold text-espresso-500">{stats.thisWeek}</span>
              </div>
              <div className="text-xs text-coffee-500">Week</div>
            </div>
            <div className="bg-coffee-50 dark:bg-coffee-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4 text-espresso-500" />
                <span className="text-lg font-bold text-espresso-500">{stats.thisMonth}</span>
              </div>
              <div className="text-xs text-coffee-500">Month</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}