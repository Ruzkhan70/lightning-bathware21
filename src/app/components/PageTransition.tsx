import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_ORDER = ["/", "/products", "/categories", "/offers", "/services", "/about", "/contact"];

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);
  const previousPathRef = useRef(location.pathname);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname && !isAnimatingRef.current) {
      isAnimatingRef.current = true;
      setIsTransitioning(true);

      const currentIndex = PAGE_ORDER.indexOf(previousPathRef.current);
      const nextIndex = PAGE_ORDER.indexOf(location.pathname);

      if (currentIndex !== -1 && nextIndex !== -1 && nextIndex < currentIndex) {
        setDirection(-1);
      } else {
        setDirection(1);
      }

      setTimeout(() => {
        setDisplayLocation(location);
        previousPathRef.current = location.pathname;
      }, 50);
    }
  }, [location, displayLocation]);

  const handleAnimationComplete = () => {
    if (isAnimatingRef.current && displayLocation.pathname !== location.pathname) {
      setDisplayLocation(location);
    }
    isAnimatingRef.current = false;
    setIsTransitioning(false);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.35,
        ease: [0.25, 1, 0.5, 1],
      },
    }),
  };

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ 
        backgroundColor: "white",
        minHeight: "100vh"
      }}
    >
      <AnimatePresence 
        mode="wait" 
        custom={direction}
        onExitComplete={() => handleAnimationComplete()}
      >
        <motion.div
          key={displayLocation.pathname}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{
            width: "100%",
            willChange: "transform, opacity",
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
