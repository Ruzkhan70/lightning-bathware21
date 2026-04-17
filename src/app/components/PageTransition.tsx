import { useEffect, useState } from "react";
import { useLocation, useOutlet } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [key, setKey] = useState(location.pathname);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const mainPages = ["/", "/about", "/contact"];
    
    if (mainPages.includes(location.pathname)) {
      setDirection(-1);
    } else {
      setDirection(1);
    }

    setKey(location.pathname);
  }, [location.pathname]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.3,
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
          key={key}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ width: "100%" }}
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
