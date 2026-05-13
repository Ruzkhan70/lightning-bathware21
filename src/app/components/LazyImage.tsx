import { useState, useRef, useEffect, memo, useCallback } from "react";
import { cn } from "../../lib/utils";
import { isUnsplashUrl, generateSrcSet, getOptimizedSrc } from "../../lib/imageOptimizer";
import { ImageOff } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  sizes?: string;
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
}

const BLUR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23e5e7eb' width='1' height='1'/%3E%3C/svg%3E";

const LazyImageComponent = memo(function LazyImageComponent({
  src,
  alt,
  className,
  sizes,
  fetchPriority = "auto",
  width,
  height,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  const optimizedSrc = getOptimizedSrc(src);

  const srcSet = isUnsplashUrl(src) ? generateSrcSet(src, [400, 600, 800, 1200]) : undefined;

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        !isLoaded && "animate-pulse",
        className
      )}
      style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
    >
      {isInView && !error && (
        <img
          src={optimizedSrc}
          alt={alt}
          srcSet={srcSet}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          fetchPriority={fetchPriority}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {!isLoaded && !error && (
        <img
          src={BLUR_PLACEHOLDER}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground gap-1.5 p-4">
          <ImageOff className="w-6 h-6 shrink-0" />
          <span className="text-xs text-center leading-tight">Image not available</span>
        </div>
      )}
      {!isInView && !isLoaded && !error && (
        <div className="absolute inset-0 bg-muted" />
      )}
    </div>
  );
});

export default LazyImageComponent;
