import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_ORDER = ["/", "/products", "/categories", "/offers", "/services", "/about", "/contact"];

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);
  const previousPathRef = useRef(location.pathname);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname && !isAnimatingRef.current) {
      isAnimatingRef.current = true;
      setTransitioning(true);

      const currentIndex = PAGE_ORDER.indexOf(previousPathRef.current);
      const nextIndex = PAGE_ORDER.indexOf(location.pathname);

      if (currentIndex !== -1 && nextIndex !== -1 && nextIndex < currentIndex) {
        setDirection(-1);
      } else {
        setDirection(1);
      }

      previousPathRef.current = location.pathname;
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitioning) {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitioning(false);
        isAnimatingRef.current = false;
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [transitioning, location]);

  const variants = {
    initial: {
      opacity: 0,
      x: direction * 100,
      scale: 0.98,
    },
    enter: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: {
      opacity: 0,
      x: direction * -100,
      scale: 0.98,
      transition: {
        duration: 0.35,
        ease: [0.25, 1, 0.5, 1],
      },
    },
  };

  return (
    <div className="relative overflow-hidden w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayLocation.pathname}
          variants={variants}
          initial="initial"
          animate="enter"
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
