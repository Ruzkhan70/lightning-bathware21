import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "../../lib/logger";

const DEFAULT_TIMEOUT = 2 * 60; // 2 minutes in seconds
const REMEMBER_ME_TIMEOUT = 2 * 60; // 2 minutes in seconds
const WARNING_COUNTDOWN = 10; // 10 seconds countdown after warning

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
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedInRef = useRef(isLoggedIn);
  const warningShownRef = useRef(false);
  const hasLoggedOutRef = useRef(false);
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const setRememberMe = useCallback((value: boolean) => {
    setIsRememberMe(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("adminRememberMe", value.toString());
    }
  }, []);

  const getTimeout = useCallback(() => {
    return isRememberMe ? REMEMBER_ME_TIMEOUT : DEFAULT_TIMEOUT;
  }, [isRememberMe]);

  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
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
    logger.log("Session expired - logging out user");
    onLogoutRef.current();
  }, [clearAllTimers]);

  const tickCountdown = useCallback((deadline: number) => {
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
    
    if (remaining <= 0) {
      countdownTimerRef.current = null;
      logoutNow();
      return;
    }
    
    setCountdownTime(remaining);
    
    countdownTimerRef.current = setTimeout(() => {
      tickCountdown(deadline);
    }, 250);
  }, [logoutNow]);

  const startWarningCountdown = useCallback(() => {
    if (warningShownRef.current) return;
    
    warningShownRef.current = true;
    setShowWarning(true);
    
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    
    const deadline = Date.now() + WARNING_COUNTDOWN * 1000;
    setCountdownTime(WARNING_COUNTDOWN);
    
    countdownTimerRef.current = setTimeout(() => {
      tickCountdown(deadline);
    }, 250);
  }, [tickCountdown]);

  const startInactivityCheck = useCallback(() => {
    const check = () => {
      if (!isLoggedInRef.current || hasLoggedOutRef.current) return;

      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      const timeout = isRememberMe ? REMEMBER_ME_TIMEOUT : DEFAULT_TIMEOUT;
      
      if (elapsed >= timeout && !warningShownRef.current) {
        startWarningCountdown();
        return;
      }
      
      const remaining = timeout - elapsed;
      if (remaining > 0) {
        inactivityTimerRef.current = setTimeout(check, Math.min(remaining * 1000, 5000));
      } else {
        startWarningCountdown();
      }
    };
    
    inactivityTimerRef.current = setTimeout(check, 5000);
  }, [isRememberMe, startWarningCountdown]);

  const resetTimer = useCallback(() => {
    hasLoggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setCountdownTime(WARNING_COUNTDOWN);
    
    clearAllTimers();
    
    if (isLoggedInRef.current) {
      startInactivityCheck();
    }
    
    logger.log("Session timer reset - activity detected");
  }, [clearAllTimers, startInactivityCheck]);

  useEffect(() => {
    if (!isLoggedIn) {
      clearAllTimers();
      return;
    }

    hasLoggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    
    clearAllTimers();
    startInactivityCheck();

    return () => clearAllTimers();
  }, [isLoggedIn, clearAllTimers, startInactivityCheck]);

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
