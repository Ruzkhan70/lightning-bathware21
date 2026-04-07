import { useState, useEffect, useCallback, useRef } from "react";

const INACTIVITY_TIMEOUT = 120; // 2 minutes in seconds
const WARNING_COUNTDOWN = 30; // 30 seconds countdown after warning

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
  const [showWarning, setShowWarning] = useState(false);
  const [countdownTime, setCountdownTime] = useState(WARNING_COUNTDOWN);
  
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggedInRef = useRef(isLoggedIn);
  const warningShownRef = useRef(false);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setCountdownTime(WARNING_COUNTDOWN);
    clearAllTimers();
    console.log("Session timer reset - activity detected");
  }, [clearAllTimers]);

  const logoutNow = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    warningShownRef.current = false;
    console.log("Session expired - logging out user");
    onLogout();
  }, [clearAllTimers, onLogout]);

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true);
    setCountdownTime(WARNING_COUNTDOWN);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
          logoutNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logoutNow]);

  useEffect(() => {
    if (!isLoggedIn) {
      resetTimer();
      return;
    }

    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // Inactivity timer - checks every second
    inactivityTimerRef.current = setInterval(() => {
      if (!isLoggedInRef.current) return;

      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      
      // If 2 minutes have passed and warning not shown yet
      if (elapsed >= INACTIVITY_TIMEOUT && !warningShownRef.current) {
        warningShownRef.current = true;
        startWarningCountdown();
      }
    }, 1000);

    return () => clearAllTimers();
  }, [isLoggedIn, clearAllTimers, resetTimer, startWarningCountdown]);

  // Activity listener - only active when not showing warning
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
    remainingTime: countdownTime,
    resetTimer,
    logoutNow,
  };
}

export default useAdminTimeout;
