import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame, Trophy, Coffee, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DayData {
  date: string;
  count: number;
}

export function ProductivityCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessionsData, setSessionsData] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [stats, setStats] = useState({
    currentStreak: 0,
    bestStreak: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  const isGuest = localStorage.getItem('caffe-pomodoro-guest') === 'true';

  // Load data from Supabase
  useEffect(() => {
    if (user) {
      loadSessionsData();
    } else if (isGuest) {
      // Guest mode - use localStorage
      loadLocalData();
    }
  }, [user, currentDate]);

  const loadLocalData = () => {
    const saved = localStorage.getItem('caffe-pomodoro-sessions');
    if (saved) {
      try {
        const sessions = JSON.parse(saved);
        processSessionsData(sessions);
      } catch {
        setSessionsData([]);
      }
    }
    setLoading(false);
  };

  const loadSessionsData = async () => {
    setLoading(true);
    
    // Get first and last day of current month view (plus buffer for streak calculation)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month - 2, 1); // 2 months back for streak
    const lastDay = new Date(year, month + 1, 0);

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('started_at, was_completed')
      .eq('was_completed', true)
      .eq('type', 0) // Only work sessions
      .gte('started_at', firstDay.toISOString())
      .lte('started_at', lastDay.toISOString())
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error loading sessions:', error);
      setLoading(false);
      return;
    }

    processSessionsData(data || []);
    setLoading(false);
  };

  const processSessionsData = (sessions: any[]) => {
    // Group by date
    const grouped: { [key: string]: number } = {};
    sessions.forEach(session => {
      const date = new Date(session.started_at).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    const dayData: DayData[] = Object.entries(grouped).map(([date, count]) => ({
      date,
      count
    }));

    setSessionsData(dayData);
    calculateStats(dayData);
  };

  const calculateStats = (data: DayData[]) => {
    const today = new Date().toISOString().split('T')[0];
    const sortedDates = data.map(d => d.date).sort().reverse();

    // Current streak
    let currentStreak = 0;
    let checkDate = new Date();
    
    // If no sessions today, start checking from yesterday
    if (!sortedDates.includes(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Best streak
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    sortedDates.sort().forEach(dateStr => {
      const date = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
      prevDate = date;
    });

    // This week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const thisWeek = data
      .filter(d => new Date(d.date) >= weekStart)
      .reduce((sum, d) => sum + d.count, 0);

    // This month
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const thisMonth = data
      .filter(d => {
        const date = new Date(d.date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, d) => sum + d.count, 0);

    setStats({ currentStreak, bestStreak, thisWeek, thisMonth });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

    const days: (number | null)[] = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getCountForDay = (day: number): number => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const found = sessionsData.find(d => d.date === dateStr);
    return found?.count || 0;
  };

  const getColorForCount = (count: number): string => {
    if (count === 0) return 'bg-coffee-100 dark:bg-coffee-800';
    if (count <= 2) return 'bg-amber-200 dark:bg-amber-900';
    if (count <= 4) return 'bg-amber-400 dark:bg-amber-700';
    return 'bg-espresso-500 dark:bg-espresso-400';
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = getCountForDay(day);
    setSelectedDay({ date: dateStr, count });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  if (loading) {
    return (
      <div className="bg-white dark:bg-coffee-900 rounded-2xl shadow-lg p-6 border border-coffee-200 dark:border-coffee-700">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-coffee-200 border-t-espresso-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-coffee-900 rounded-2xl shadow-lg overflow-hidden border border-coffee-200 dark:border-coffee-700">
      {/* Header */}
      <div className="p-4 bg-coffee-50 dark:bg-coffee-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-espresso-500" />
          <h2 className="text-lg font-semibold text-coffee-800 dark:text-coffee-100">
            Productivity
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
            <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-800 dark:text-coffee-100">{stats.currentStreak}</p>
              <p className="text-xs text-coffee-500 dark:text-coffee-400">Day streak</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-800 dark:text-coffee-100">{stats.bestStreak}</p>
              <p className="text-xs text-coffee-500 dark:text-coffee-400">Best streak</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-800 dark:text-coffee-100">{stats.thisWeek}</p>
              <p className="text-xs text-coffee-500 dark:text-coffee-400">This week</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl">
            <div className="p-2 bg-sky-100 dark:bg-sky-800 rounded-lg">
              <Coffee className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-800 dark:text-coffee-100">{stats.thisMonth}</p>
              <p className="text-xs text-coffee-500 dark:text-coffee-400">This month</p>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-coffee-100 dark:hover:bg-coffee-800 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-coffee-600 dark:text-coffee-300" />
          </button>
          <h3 className="font-medium text-coffee-800 dark:text-coffee-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-coffee-100 dark:hover:bg-coffee-800 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-coffee-600 dark:text-coffee-300" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-coffee-500 dark:text-coffee-400 py-2">
              {day}
            </div>
          ))}

          {/* Days */}
          {getDaysInMonth().map((day, i) => (
            <div key={i} className="aspect-square">
              {day && (
                <button
                  onClick={() => handleDayClick(day)}
                  className={`w-full h-full rounded-lg flex items-center justify-center text-sm transition-all
                    ${getColorForCount(getCountForDay(day))}
                    ${isToday(day) ? 'ring-2 ring-espresso-500 ring-offset-1' : ''}
                    ${getCountForDay(day) > 0 ? 'text-coffee-800 dark:text-coffee-100 font-medium' : 'text-coffee-400 dark:text-coffee-500'}
                    hover:scale-110 hover:shadow-md
                  `}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 text-xs text-coffee-500 dark:text-coffee-400">
          <span>Less</span>
          <div className="w-4 h-4 rounded bg-coffee-100 dark:bg-coffee-800"></div>
          <div className="w-4 h-4 rounded bg-amber-200 dark:bg-amber-900"></div>
          <div className="w-4 h-4 rounded bg-amber-400 dark:bg-amber-700"></div>
          <div className="w-4 h-4 rounded bg-espresso-500 dark:bg-espresso-400"></div>
          <span>More</span>
        </div>

        {/* Selected Day Detail */}
        {selectedDay && (
          <div className="p-3 bg-coffee-50 dark:bg-coffee-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-coffee-600 dark:text-coffee-300">
                {new Date(selectedDay.date).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </span>
              <div className="flex items-center gap-1">
                <Coffee className="w-4 h-4 text-espresso-500" />
                <span className="font-bold text-coffee-800 dark:text-coffee-100">
                  {selectedDay.count} pomodoro{selectedDay.count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}