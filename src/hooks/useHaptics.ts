// Haptic feedback and notification sounds hook
const NOTIFICATION_SOUNDS = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  click: '/sounds/click.mp3',
  notification: '/sounds/notification.mp3',
};

// Pre-created audio context for better performance
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Generate simple notification sounds using Web Audio API
const playGeneratedSound = (type: 'success' | 'error' | 'click' | 'notification') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'success':
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
      case 'error':
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.setValueAtTime(150, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.setValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
      case 'click':
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.setValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;
      case 'notification':
        oscillator.frequency.setValueAtTime(880, now); // A5
        oscillator.frequency.setValueAtTime(1046.50, now + 0.15); // C6
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.setValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
    }
  } catch (e) {
    console.log('Sound playback not available');
  }
};

export const useHaptics = () => {
  // Haptic feedback using Vibration API
  const vibrate = (pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Light tap feedback
  const lightTap = () => {
    vibrate(10);
  };

  // Medium tap feedback
  const mediumTap = () => {
    vibrate(25);
  };

  // Heavy impact feedback
  const heavyImpact = () => {
    vibrate(50);
  };

  // Success feedback - double vibrate with sound
  const successFeedback = () => {
    vibrate([30, 50, 30]);
    playGeneratedSound('success');
  };

  // Error feedback - long vibrate with sound
  const errorFeedback = () => {
    vibrate([100, 50, 100]);
    playGeneratedSound('error');
  };

  // Click feedback with subtle sound
  const clickFeedback = () => {
    vibrate(10);
    playGeneratedSound('click');
  };

  // Notification feedback
  const notificationFeedback = () => {
    vibrate([50, 100, 50, 100, 50]);
    playGeneratedSound('notification');
  };

  // Selection changed
  const selectionFeedback = () => {
    vibrate(15);
  };

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyImpact,
    successFeedback,
    errorFeedback,
    clickFeedback,
    notificationFeedback,
    selectionFeedback,
  };
};

// Static functions for use outside React components
export const haptics = {
  vibrate: (pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  },
  lightTap: () => haptics.vibrate(10),
  mediumTap: () => haptics.vibrate(25),
  heavyImpact: () => haptics.vibrate(50),
  successFeedback: () => {
    haptics.vibrate([30, 50, 30]);
    playGeneratedSound('success');
  },
  errorFeedback: () => {
    haptics.vibrate([100, 50, 100]);
    playGeneratedSound('error');
  },
  clickFeedback: () => {
    haptics.vibrate(10);
    playGeneratedSound('click');
  },
  notificationFeedback: () => {
    haptics.vibrate([50, 100, 50, 100, 50]);
    playGeneratedSound('notification');
  },
};
