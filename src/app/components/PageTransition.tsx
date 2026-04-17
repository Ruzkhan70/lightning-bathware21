import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useOutlet } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_ORDER = ["/", "/products", "/categories", "/offers", "/services", "/about", "/contact"];

export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [displayPage, setDisplayPage] = useState<{ pathname: string; content: React.ReactNode } | null>(null);
  const directionRef = useRef(1);
  const isFirstRender = useRef(true);

  const currentPage = useMemo(() => ({
    pathname: location.pathname,
    content: outlet,
  }), [location.pathname, outlet]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayPage(currentPage);
      return;
    }

    const currentIndex = PAGE_ORDER.indexOf(location.pathname);
    const prevIndex = PAGE_ORDER.indexOf(displayPage?.pathname || "");

    if (prevIndex !== -1 && currentIndex !== -1 && currentIndex < prevIndex) {
      directionRef.current = -1;
    } else {
      directionRef.current = 1;
    }

    setDisplayPage(currentPage);
  }, [location.pathname]);

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

  if (!displayPage) {
    return (
      <div 
        className="relative w-full overflow-hidden"
        style={{ backgroundColor: "white", minHeight: "100vh" }}
      >
        {currentPage.content}
      </div>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ 
        backgroundColor: "white",
        minHeight: "100vh"
      }}
    >
      <AnimatePresence initial={false} custom={directionRef.current}>
        <motion.div
          key={displayPage.pathname}
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
          {displayPage.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
