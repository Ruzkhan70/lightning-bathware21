import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_TIMEOUT = 30 * 60; // 30 minutes in seconds
const REMEMBER_ME_TIMEOUT = 24 * 60 * 60; // 24 hours in seconds
const WARNING_COUNTDOWN = 30; // 30 seconds countdown after warning

interface UseAdminTimeoutReturn {
  showWarning: boolean;
  remainingTime: number;
  resetTimer: () => void;
  logoutNow: () => void;
  isRememberMe: boolean;
  setRememberMe: (value: boolean) => void;
}

export function useAdminTimeout(
  isLoggedIn: boolean,
  onLogout: () => void
): UseAdminTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [countdownTime, setCountdownTime] = useState(WARNING_COUNTDOWN);
  const [isRememberMe, setIsRememberMe] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminRememberMe") === "true";
    }
    return false;
  });
  
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoggedInRef = useRef(isLoggedIn);
  const warningShownRef = useRef(false);
  const hasLoggedOutRef = useRef(false);
  const sessionStartRef = useRef<number>(Date.now());

  const getTimeout = useCallback(() => {
    return isRememberMe ? REMEMBER_ME_TIMEOUT : DEFAULT_TIMEOUT;
  }, [isRememberMe]);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
    if (isLoggedIn) {
      sessionStartRef.current = Date.now();
    }
  }, [isLoggedIn]);

  const setRememberMe = useCallback((value: boolean) => {
    setIsRememberMe(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("adminRememberMe", value.toString());
    }
  }, []);

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
    if (hasLoggedOutRef.current) return;
    hasLoggedOutRef.current = true;
    
    clearAllTimers();
    setShowWarning(false);
    setCountdownTime(0);
    warningShownRef.current = false;
    console.log("Session expired - logging out user");
    onLogout();
  }, [clearAllTimers, onLogout]);

  const startWarningCountdown = useCallback(() => {
    if (warningShownRef.current) return;
    
    warningShownRef.current = true;
    setShowWarning(true);
    setCountdownTime(WARNING_COUNTDOWN);
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    countdownTimerRef.current = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
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

  const resetTimer = useCallback(() => {
    hasLoggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    sessionStartRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setCountdownTime(WARNING_COUNTDOWN);
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    console.log("Session timer reset - activity detected");
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      clearAllTimers();
      return;
    }

    hasLoggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    sessionStartRef.current = Date.now();
    warningShownRef.current = false;
    
    clearAllTimers();
    
    inactivityTimerRef.current = setInterval(() => {
      if (!isLoggedInRef.current || hasLoggedOutRef.current) return; 

      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      
      if (elapsed >= getTimeout() && !warningShownRef.current) {
        startWarningCountdown();
      }
    }, 1000);

    return () => clearAllTimers();
  }, [isLoggedIn, clearAllTimers, startWarningCountdown, getTimeout]);

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
    isRememberMe,
    setRememberMe,
  };
}

export default useAdminTimeout;
