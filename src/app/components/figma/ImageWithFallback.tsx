import { useState } from "react";

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className="flex items-center justify-center bg-muted text-muted-foreground"
        style={{ minHeight: props.height || 200 }}
      >
        <span>Image not available</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      onError={() => setHasError(true)}
    />
  );
}
