import { useEffect, useState } from "react";
import { useLocation } from "react-router";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsAnimating(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`transition-container ${isAnimating ? "page-transitioning" : ""}`}>
      <div
        className={`page-content ${
          isAnimating ? "slide-out" : "slide-in"
        }`}
        key={displayLocation.pathname}
      >
        {children}
      </div>
      
      <style>{`
        .transition-container {
          position: relative;
          min-height: 100vh;
        }
        
        .page-content {
          animation-fill-mode: both;
        }
        
        .page-transitioning .page-content.slide-out {
          animation: slideOut 200ms ease-in-out forwards;
        }
        .page-content.slide-in {
          animation: slideIn 200ms ease-out forwards;
        }
        
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-30px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
