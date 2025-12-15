import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    try {
      const soundPath = import.meta.env.PROD 
        ? '/Coffee-Pomodoro/notification.mp3' 
        : '/notification.mp3';

      if (!audioRef.current) {
        audioRef.current = new Audio(soundPath);
        audioRef.current.volume = 0.5;
      }
      
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return { playSound, setVolume };
}