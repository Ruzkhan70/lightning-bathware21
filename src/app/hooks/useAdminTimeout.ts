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
  const hasLoggedOutRef = useRef(false);

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

  const logoutNow = useCallback(() => {
    // Prevent multiple logout calls
    if (hasLoggedOutRef.current) return;
    hasLoggedOutRef.current = true;
    
    clearAllTimers();
    setShowWarning(false);
    setCountdownTime(0);
    warningShownRef.current = false;
    console.log("Session expired - logging out user");
    onLogout();
  }, [clearAllTimers, onLogout]);

  const resetTimer = useCallback(() => {
    hasLoggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setCountdownTime(WARNING_COUNTDOWN);
    
    // Also clear the countdown timer since resetTimer can be called during warning
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    
    // Restart inactivity timer
    inactivityTimerRef.current = setInterval(() => {
      if (!isLoggedInRef.current || hasLoggedOutRef.current) return;

      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      
      if (elapsed >= INACTIVITY_TIMEOUT && !warningShownRef.current) {
        startWarningCountdown();
      }
    }, 1000);
    
    console.log("Session timer reset - activity detected");
  }, [startWarningCountdown]);

  const startWarningCountdown = useCallback(() => {
    // Prevent multiple warning countdowns
    if (warningShownRef.current) return;
    
    warningShownRef.current = true;
    setShowWarning(true);
    setCountdownTime(WARNING_COUNTDOWN);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
          // Clear interval immediately before calling logout
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
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

    // Reset logout flag when logging in
    hasLoggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // Inactivity timer - checks every second
    inactivityTimerRef.current = setInterval(() => {
      if (!isLoggedInRef.current || hasLoggedOutRef.current) return;

      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      
      // If 2 minutes have passed and warning not shown yet
      if (elapsed >= INACTIVITY_TIMEOUT && !warningShownRef.current) {
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
