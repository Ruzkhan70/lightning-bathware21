import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_ORDER = ["/", "/products", "/categories", "/offers", "/services", "/about", "/contact"];

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location.pathname);
  const directionRef = useRef(1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayLocation(location.pathname);
      return;
    }

    if (location.pathname !== displayLocation) {
      const currentIndex = PAGE_ORDER.indexOf(displayLocation);
      const nextIndex = PAGE_ORDER.indexOf(location.pathname);

      if (currentIndex !== -1 && nextIndex !== -1 && nextIndex < currentIndex) {
        directionRef.current = -1;
      } else {
        directionRef.current = 1;
      }

      setDisplayLocation(location.pathname);
    }
  }, [location.pathname, displayLocation]);

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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={displayLocation}
          custom={directionRef.current}
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
