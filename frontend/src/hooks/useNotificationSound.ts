import { useCallback, useRef, useEffect, useState } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Pre-cargar el audio
  useEffect(() => {
    const soundPath = import.meta.env.PROD 
      ? '/Coffee-Pomodoro/notification.mp3' 
      : '/notification.mp3';
    
    audioRef.current = new Audio(soundPath);
    audioRef.current.volume = 0.7;
    audioRef.current.load();

    // Verificar si ya estaba desbloqueado
    const unlocked = localStorage.getItem('audio-unlocked') === 'true';
    setIsAudioUnlocked(unlocked);
  }, []);

  // Desbloquear audio con interacción del usuario (necesario en móviles)
  const unlockAudio = useCallback(async () => {
    if (isAudioUnlocked) return true;

    try {
      if (audioRef.current) {
        // Reproducir silenciosamente para desbloquear
        audioRef.current.volume = 0;
        audioRef.current.muted = true;
        
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Restaurar volumen
        audioRef.current.volume = 0.7;
        audioRef.current.muted = false;
        
        setIsAudioUnlocked(true);
        localStorage.setItem('audio-unlocked', 'true');
        
        console.log('Audio unlocked successfully');
        return true;
      }
    } catch (error) {
      console.log('Audio unlock failed:', error);
      return false;
    }
    return false;
  }, [isAudioUnlocked]);

  const playSound = useCallback(async () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.7;
        audioRef.current.muted = false;
        
        await audioRef.current.play();
      }
    } catch (error) {
      console.log('Audio play failed:', error);
      
      // Intentar desbloquear y reproducir de nuevo
      if (!isAudioUnlocked) {
        console.log('Attempting to unlock audio...');
      }
    }
  }, [isAudioUnlocked]);

  const requestNotificationPermission = useCallback(async () => {
    // Desbloquear audio al mismo tiempo
    await unlockAudio();

    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, [unlockAudio]);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    // Reproducir sonido
    playSound();

    // Enviar notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      const iconPath = import.meta.env.PROD 
        ? '/Coffee-Pomodoro/icon-192.png' 
        : '/icon-192.png';

      try {
        new Notification(title, {
          body,
          icon: iconPath,
          badge: iconPath,
          tag: 'pomodoro-timer',
          requireInteraction: true
        });
      } catch (error) {
        console.log('Notification failed:', error);
      }
    }
  }, [playSound]);

  return { 
    playSound, 
    sendBrowserNotification, 
    requestNotificationPermission,
    unlockAudio,
    isAudioUnlocked
  };
}