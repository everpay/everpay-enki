import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_BEFORE = 60 * 1000; // Show warning 60s before logout
const WARNING_AT = INACTIVITY_TIMEOUT - WARNING_BEFORE; // 4 minutes

export function useInactivityLogout() {
  const { user, signOut } = useAuth();
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    warningTimerRef.current = null;
    logoutTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setSecondsLeft(60);
    if (!user) return;

    // Warning timer at 4 min
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(60);
      let remaining = 60;
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 1000);

      // Final logout at 5 min
      logoutTimerRef.current = setTimeout(() => {
        signOut();
      }, WARNING_BEFORE);
    }, WARNING_AT);
  }, [user, signOut, clearAllTimers]);

  const handleStayActive = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handler = () => {
      if (!showWarning) resetTimer();
    };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearAllTimers();
    };
  }, [user, resetTimer, clearAllTimers, showWarning]);

  return { showWarning, secondsLeft, handleStayActive };
}
