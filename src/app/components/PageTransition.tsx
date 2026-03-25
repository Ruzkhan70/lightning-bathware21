import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router";

const PAGE_ORDER = ["/", "/products", "/categories", "/offers", "/services", "/about", "/contact"];

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [animationClass, setAnimationClass] = useState("");
  const previousPathRef = useRef(location.pathname);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname && !isAnimatingRef.current) {
      isAnimatingRef.current = true;
      
      const currentIndex = PAGE_ORDER.indexOf(previousPathRef.current);
      const nextIndex = PAGE_ORDER.indexOf(location.pathname);
      
      let direction = "forward";
      if (currentIndex !== -1 && nextIndex !== -1) {
        if (nextIndex < currentIndex) {
          direction = "backward";
        }
      }
      
      const enterClass = direction === "forward" ? "slide-in-from-right" : "slide-in-from-left";
      const exitClass = direction === "forward" ? "slide-out-to-left" : "slide-out-to-right";
      
      setAnimationClass(exitClass);
      
      setTimeout(() => {
        setDisplayLocation(location);
        setAnimationClass(enterClass);
        
        setTimeout(() => {
          setAnimationClass("");
          isAnimatingRef.current = false;
          previousPathRef.current = location.pathname;
        }, 350);
      }, 50);
    }
  }, [location, displayLocation]);

  return (
    <div className={`transition-container ${animationClass}`}>
      <div className={`page-content ${animationClass}`} key={displayLocation.pathname}>
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
        
        /* Forward: Enter from right, Exit to left */
        .slide-out-to-left {
          animation: slideOutLeft 300ms ease-in-out forwards;
        }
        .slide-in-from-right {
          animation: slideInRight 350ms ease-out forwards;
        }
        
        /* Backward: Enter from left, Exit to right */
        .slide-out-to-right {
          animation: slideOutRight 300ms ease-in-out forwards;
        }
        .slide-in-from-left {
          animation: slideInLeft 350ms ease-out forwards;
        }
        
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-100%); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
