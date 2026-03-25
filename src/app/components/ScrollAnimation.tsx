import { useEffect, useRef, ReactNode } from "react";

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "scaleIn";
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export default function ScrollAnimation({
  children,
  animation = "fadeIn",
  delay = 0,
  duration = 400,
  className = "",
  once = true,
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            element.style.opacity = "1";
            element.style.transform = "translateY(0) translateX(0) scale(1)";
          }, delay);
          
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          element.style.opacity = "0";
          element.style.transform = getInitialTransform(animation);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay, animation, once]);

  const getInitialTransform = (anim: string) => {
    switch (anim) {
      case "slideUp":
        return "translateY(40px)";
      case "slideLeft":
        return "translateX(40px)";
      case "slideRight":
        return "translateX(-40px)";
      case "scaleIn":
        return "scale(0.9)";
      default:
        return "translateY(30px)";
    }
  };

  const animationStyle: React.CSSProperties = {
    opacity: 0,
    transform: getInitialTransform(animation),
    transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
    transitionDelay: `${delay}ms`,
  };

  return (
    <div ref={ref} style={animationStyle} className={className}>
      {children}
    </div>
  );
}
