import { useState, useEffect, useCallback, useRef } from "react";

const TOTAL_TIMEOUT = 120; // 2 minutes in seconds
const WARNING_THRESHOLD = 30; // Show warning when 30 seconds remaining

interface UseAdminTimeoutReturn {
  showWarning: boolean;
  remainingTime: number;
  resetTimer: () => void;
  logoutNow: () => void;
}

export function useAdminTimeout(
  isLoggedIn: boolean,
  onLogout: () => void
): UseAdminTimeoutReturn {
  const [remainingTime, setRemainingTime] = useState(TOTAL_TIMEOUT);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggedInRef = useRef(isLoggedIn);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingTime(TOTAL_TIMEOUT);
    setShowWarning(false);
    console.log("Session timer reset - user chose to stay logged in");
  }, []);

  const logoutNow = useCallback(() => {
    clearTimer();
    setShowWarning(false);
    console.log("Session expired - logging out user");
    onLogout();
  }, [clearTimer, onLogout]);

  useEffect(() => {
    if (!isLoggedIn) {
      setRemainingTime(TOTAL_TIMEOUT);
      setShowWarning(false);
      clearTimer();
      lastActivityRef.current = Date.now();
      return;
    }

    lastActivityRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (!isLoggedInRef.current) return;

      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, TOTAL_TIMEOUT - elapsed);
      
      setRemainingTime(remaining);

      if (remaining <= WARNING_THRESHOLD && remaining > 0) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        logoutNow();
      }
    }, 1000);

    return () => clearTimer();
  }, [isLoggedIn, clearTimer, logoutNow]);

  useEffect(() => {
    if (!isLoggedIn || showWarning) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    let lastCall = 0;
    const throttleMs = 500;

    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastCall >= throttleMs) {
        lastCall = now;
        handleActivity();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
    };
  }, [isLoggedIn, showWarning]);

  return {
    showWarning,
    remainingTime,
    resetTimer,
    logoutNow,
  };
}

export default useAdminTimeout;
