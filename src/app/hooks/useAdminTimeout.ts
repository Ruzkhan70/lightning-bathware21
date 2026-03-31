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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(isLoggedIn);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const logoutNow = useCallback(() => {
    clearTimer();
    setShowWarning(false);
    setRemainingTime(TOTAL_TIMEOUT);
    onLogout();
  }, [clearTimer, onLogout]);

  const resetTimer = useCallback(() => {
    setRemainingTime(TOTAL_TIMEOUT);
    setShowWarning(false);
    clearTimer();
    
    // Restart the timer
    if (isActiveRef.current) {
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          const newTime = prev - 1;

          if (newTime <= 0) {
            logoutNow();
            return 0;
          }

          if (newTime === WARNING_THRESHOLD) {
            setShowWarning(true);
          }

          return newTime;
        });
      }, 1000);
    }
  }, [clearTimer, logoutNow]);

  // Main timer effect
  useEffect(() => {
    isActiveRef.current = isLoggedIn;
    
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

        if (newTime === WARNING_THRESHOLD) {
          setShowWarning(true);
        }

        return newTime;
      });
    }, 1000);

    return () => clearTimer();
  }, [isLoggedIn, clearTimer, logoutNow]);

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
