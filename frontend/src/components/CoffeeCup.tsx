import { useEffect, useState } from 'react';
import { SessionType } from '../types';

interface CoffeeCupProps {
  progress: number; // 0 to 1
  sessionType: SessionType;
  isRunning: boolean;
}

export function CoffeeCup({ progress, sessionType, isRunning }: CoffeeCupProps) {
  const [showSteam, setShowSteam] = useState(false);

  useEffect(() => {
    // Show steam when progress is near completion or during breaks
    setShowSteam(progress > 0.9 || sessionType !== SessionType.Work);
  }, [progress, sessionType]);

  // Color based on session type
  const getCoffeeColor = () => {
    switch (sessionType) {
      case SessionType.Work:
        return {
          liquid: 'from-amber-900 via-amber-800 to-amber-700',
          surface: 'bg-amber-600',
          glow: 'shadow-amber-500/30'
        };
      case SessionType.ShortBreak:
        return {
          liquid: 'from-emerald-700 via-emerald-600 to-emerald-500',
          surface: 'bg-emerald-400',
          glow: 'shadow-emerald-500/30'
        };
      case SessionType.LongBreak:
        return {
          liquid: 'from-sky-700 via-sky-600 to-sky-500',
          surface: 'bg-sky-400',
          glow: 'shadow-sky-500/30'
        };
      default:
        return {
          liquid: 'from-amber-900 via-amber-800 to-amber-700',
          surface: 'bg-amber-600',
          glow: 'shadow-amber-500/30'
        };
    }
  };

  const colors = getCoffeeColor();
  const fillHeight = Math.min(Math.max(progress * 100, 0), 100);

  return (
    <div className="relative w-64 h-80 mx-auto">
      {/* Steam */}
      <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-500 ${showSteam && isRunning ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex gap-2">
          <div className="w-3 h-12 bg-gradient-to-t from-gray-400/40 to-transparent rounded-full animate-steam blur-sm" />
          <div className="w-4 h-16 bg-gradient-to-t from-gray-400/50 to-transparent rounded-full animate-steam-delay blur-sm" />
          <div className="w-3 h-10 bg-gradient-to-t from-gray-400/40 to-transparent rounded-full animate-steam blur-sm" />
        </div>
      </div>

      {/* Cup Container */}
      <div className="relative w-full h-full">
        {/* Handle */}
        <div className="absolute right-0 top-1/3 transform translate-x-6">
          <div className="w-10 h-20 border-4 border-coffee-300 dark:border-coffee-600 rounded-r-full bg-transparent" />
        </div>

        {/* Cup Body */}
        <div className={`relative w-56 h-64 mx-auto mt-8 rounded-b-[40px] bg-gradient-to-b from-coffee-100 to-coffee-200 dark:from-coffee-700 dark:to-coffee-800 shadow-2xl ${colors.glow} overflow-hidden border-4 border-coffee-300 dark:border-coffee-600`}>
          
          {/* Inner Cup Shadow */}
          <div className="absolute inset-2 rounded-b-[36px] bg-gradient-to-b from-coffee-200/50 to-coffee-300/30 dark:from-coffee-800/50 dark:to-coffee-900/30" />
          
          {/* Coffee Liquid Container */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[36px]" style={{ height: '90%' }}>
            {/* Coffee Fill */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${colors.liquid} transition-all duration-300 ease-out`}
              style={{ 
                height: `${fillHeight}%`,
              }}
            >
              {/* Coffee Surface Wave Effect */}
              <div className={`absolute top-0 left-0 right-0 h-4 ${colors.surface} rounded-full transform -translate-y-1/2`}>
                {/* Animated ripple */}
                {isRunning && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse-slow" />
                    <div className="absolute top-1/2 left-1/4 w-2 h-1 bg-white/20 rounded-full" />
                    <div className="absolute top-1/3 right-1/3 w-3 h-1 bg-white/15 rounded-full" />
                  </>
                )}
              </div>

              {/* Crema / Foam at top */}
              {fillHeight > 80 && (
                <div className="absolute top-0 left-0 right-0 h-6">
                  <div className="absolute inset-x-4 top-2 h-3 bg-gradient-to-r from-cream-200/60 via-cream-100/80 to-cream-200/60 rounded-full blur-sm" />
                </div>
              )}
            </div>
          </div>

          {/* Cup Rim Highlight */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg" />
          
          {/* Cup Side Highlight */}
          <div className="absolute top-0 left-2 w-4 h-full bg-gradient-to-r from-white/20 to-transparent rounded-l-lg" />
        </div>

        {/* Saucer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-8">
          <div className="w-full h-full bg-gradient-to-b from-coffee-200 to-coffee-300 dark:from-coffee-600 dark:to-coffee-700 rounded-full shadow-lg border-2 border-coffee-300 dark:border-coffee-500" />
          <div className="absolute top-1 left-4 right-4 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
        </div>
      </div>

      {/* Decorative coffee beans */}
      <div className="absolute -bottom-2 left-8 w-4 h-6 bg-coffee-800 dark:bg-coffee-900 rounded-full transform rotate-45 opacity-60" />
      <div className="absolute -bottom-1 left-14 w-3 h-5 bg-coffee-700 dark:bg-coffee-800 rounded-full transform -rotate-12 opacity-50" />
      <div className="absolute -bottom-3 right-12 w-4 h-6 bg-coffee-800 dark:bg-coffee-900 rounded-full transform rotate-30 opacity-55" />
    </div>
  );
}
