import { useCallback, useRef, useEffect } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-cargar el audio
  useEffect(() => {
    const soundPath = import.meta.env.PROD 
      ? '/Coffee-Pomodoro/notification.mp3' 
      : '/notification.mp3';
    
    audioRef.current = new Audio(soundPath);
    audioRef.current.volume = 0.5;
    
    // Pre-cargar
    audioRef.current.load();
  }, []);

  const playSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.log('Audio play failed:', err);
        });
      }
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    // Reproducir sonido siempre
    playSound();

    // Enviar notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      const iconPath = import.meta.env.PROD 
        ? '/Coffee-Pomodoro/icon-192.png' 
        : '/icon-192.png';

      new Notification(title, {
        body,
        icon: iconPath,
        badge: iconPath,
        tag: 'pomodoro-timer',
        requireInteraction: true
      });
    }
  }, [playSound]);

  return { 
    playSound, 
    sendBrowserNotification, 
    requestNotificationPermission 
  };
}