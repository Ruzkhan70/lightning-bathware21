import { useState, useEffect, useCallback, useRef } from "react";

const TOTAL_TIMEOUT = 1800; // 30 minutes in seconds
const WARNING_THRESHOLD = 60; // Show warning when 60 seconds remaining

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    setRemainingTime(TOTAL_TIMEOUT);
    setShowWarning(false);
  }, []);

  const logoutNow = useCallback(() => {
    clearTimer();
    setShowWarning(false);
    onLogout();
  }, [clearTimer, onLogout]);

  // Main timer effect
  useEffect(() => {
    if (!isLoggedIn) {
      setRemainingTime(TOTAL_TIMEOUT);
      setShowWarning(false);
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;

        if (newTime <= 0) {
          logoutNow();
          return 0;
        }

        // Show warning when reaching threshold
        if (newTime === WARNING_THRESHOLD) {
          setShowWarning(true);
        }

        return newTime;
      });
    }, 1000);

    return () => clearTimer();
  }, [isLoggedIn, clearTimer, logoutNow]);

  // Activity tracking - reset timer on user activity
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => {
      if (!showWarning) {
        setRemainingTime(TOTAL_TIMEOUT);
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const throttledHandler = throttle(handleActivity, 5000); // Throttle to 5 seconds

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

// Throttle helper function
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle = false;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  } as T;
}

export default useAdminTimeout;
