import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsAnimating(true);
      
      // Determine direction: going TO Home = slide right, going FROM Home = slide left
      const goingToHome = location.pathname === "/";
      const comingFromHome = previousPathRef.current === "/";
      
      if (goingToHome) {
        setDirection("right");
      } else if (comingFromHome) {
        setDirection("left");
      } else {
        // For non-Home transitions, determine direction based on path depth or use left as default
        setDirection("left");
      }
      
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        previousPathRef.current = location.pathname;
        setIsAnimating(false);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`transition-container ${isAnimating ? "page-transitioning" : ""}`}>
      <div
        className={`page-content ${
          isAnimating 
            ? direction === "left" ? "slide-out-left" : "slide-out-right"
            : direction === "left" ? "slide-in-right" : "slide-in-left"
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
        
        /* Slide LEFT animations (going from Home) */
        .page-transitioning .page-content.slide-out-left {
          animation: slideOutLeft 250ms ease-in-out forwards;
        }
        .page-content.slide-in-left {
          animation: slideInLeft 250ms ease-out forwards;
        }
        
        /* Slide RIGHT animations (going to Home) */
        .page-transitioning .page-content.slide-out-right {
          animation: slideOutRight 250ms ease-in-out forwards;
        }
        .page-content.slide-in-right {
          animation: slideInRight 250ms ease-out forwards;
        }
        
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(40px); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
