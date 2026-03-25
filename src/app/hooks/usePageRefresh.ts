import { useState, useEffect } from "react";

export function usePageRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    // Detect page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible - check if it's a refresh
        const timeSinceHidden = Date.now() - hiddenTime;
        if (timeSinceHidden < 10000 && timeSinceHidden > 100) {
          // Page was hidden for less than 10 seconds, likely a refresh
          setIsRefreshing(true);
          setPageKey(prev => prev + 1);
        }
      }
    };

    let hiddenTime = Date.now();

    const handleVisibilityChangeInternal = () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else {
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChangeInternal);

    // Also detect beforeunload as backup
    const handleBeforeUnload = () => {
      sessionStorage.setItem('pageRefresh', Date.now().toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check on mount if we just refreshed
    const lastRefresh = sessionStorage.getItem('pageRefresh');
    if (lastRefresh) {
      const timeSinceRefresh = Date.now() - parseInt(lastRefresh);
      if (timeSinceRefresh < 5000) {
        setIsRefreshing(true);
        sessionStorage.removeItem('pageRefresh');
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChangeInternal);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-hide loading after data is loaded
  const hideLoading = () => {
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return { isRefreshing, pageKey, hideLoading };
}

export default usePageRefresh;
