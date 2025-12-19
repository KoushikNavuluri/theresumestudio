import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
  });

  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
      }));
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [state.isSupported]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!state.isSupported) return null;
    
    if (Notification.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      // Try service worker notification first (works when app is in background)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options,
        });
        return null;
      }
      
      // Fallback to regular notification
      return new Notification(title, {
        icon: '/pwa-192x192.png',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [state.isSupported, requestPermission]);

  // Notify when resume generation is complete
  const notifyResumeComplete = useCallback((resumeTitle?: string) => {
    showNotification('Resume Ready! 🎉', {
      body: resumeTitle 
        ? `Your resume "${resumeTitle}" has been generated successfully.`
        : 'Your optimized resume is ready for download.',
      tag: 'resume-complete',
      requireInteraction: false,
    });
  }, [showNotification]);

  // Notify on errors
  const notifyError = useCallback((message: string) => {
    showNotification('Something went wrong', {
      body: message,
      tag: 'error',
    });
  }, [showNotification]);

  return {
    ...state,
    requestPermission,
    showNotification,
    notifyResumeComplete,
    notifyError,
  };
};

// Static function for use outside React components
export const sendPushNotification = async (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options,
        });
      } else {
        new Notification(title, { icon: '/pwa-192x192.png', ...options });
      }
    } catch (e) {
      console.log('Notification error:', e);
    }
  }
};
