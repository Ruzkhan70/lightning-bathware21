import { useEffect } from "react";
import { useLocation } from "react-router";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

interface AnalyticsConfig {
  trackingId?: string;
}

export function useAnalytics({ trackingId }: AnalyticsConfig = {}) {
  const location = useLocation();

  useEffect(() => {
    if (!trackingId || typeof window === "undefined") return;

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    }
    window.gtag = gtag;

    // Load gtag script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    // Initialize
    gtag("js", new Date());
    gtag("config", trackingId);

    return () => {
      document.head.removeChild(script);
    };
  }, [trackingId]);

  // Track page views
  useEffect(() => {
    if (!trackingId || typeof window === "undefined") return;
    
    window.gtag?.("config", trackingId, {
      page_path: location.pathname + location.search,
    });
  }, [location, trackingId]);
}

export function Analytics({ trackingId }: { trackingId?: string }) {
  useAnalytics({ trackingId });
  return null;
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

export const analyticsEvents = {
  viewProduct: (productName: string, price: number) => {
    trackEvent("view_item", {
      currency: "LKR",
      value: price,
      items: [{ item_name: productName }],
    });
  },
  
  addToCart: (productName: string, price: number) => {
    trackEvent("add_to_cart", {
      currency: "LKR",
      value: price,
      items: [{ item_name: productName }],
    });
  },
  
  removeFromCart: (productName: string, price: number) => {
    trackEvent("remove_from_cart", {
      currency: "LKR",
      value: price,
      items: [{ item_name: productName }],
    });
  },
  
  beginCheckout: (total: number) => {
    trackEvent("begin_checkout", {
      currency: "LKR",
      value: total,
    });
  },
  
  purchase: (transactionId: string, total: number) => {
    trackEvent("purchase", {
      transaction_id: transactionId,
      currency: "LKR",
      value: total,
    });
  },
  
  search: (searchTerm: string) => {
    trackEvent("search", {
      search_term: searchTerm,
    });
  },
  
  contact: (method: string) => {
    trackEvent("generate_lead", {
      method: method,
    });
  },
};

export default Analytics;
