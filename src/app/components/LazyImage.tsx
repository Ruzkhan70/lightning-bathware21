import { useState, useRef, useEffect, memo, useCallback } from "react";
import { cn } from "../../lib/utils";
import { isUnsplashUrl, generateSrcSet, getOptimizedSrc } from "../../lib/imageOptimizer";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  sizes?: string;
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
}

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='14'%3ELoading...%3C/text%3E%3C/svg%3E";

const BLUR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23e5e7eb' width='1' height='1'/%3E%3C/svg%3E";

const LazyImageComponent = memo(function LazyImageComponent({
  src,
  alt,
  className,
  fallbackSrc = FALLBACK,
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
      {(error || (!isInView && !isLoaded)) && (
        <img
          src={fallbackSrc}
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
});

export default LazyImageComponent;
