const UNSPLASH_REGEX = /^https?:\/\/(?:images\.unsplash\.com|plus\.unsplash\.com)\//;
const IMGBB_REGEX = /^https?:\/\/(?:i\.ibb\.co|i\.ibb\.co\.com)\//;

export function isUnsplashUrl(url: string): boolean {
  return UNSPLASH_REGEX.test(url);
}

export function isImgbbUrl(url: string): boolean {
  return IMGBB_REGEX.test(url);
}

export function isExternalCdnUrl(url: string): boolean {
  return isUnsplashUrl(url) || isImgbbUrl(url);
}

export function optimizeUnsplashUrl(url: string, width: number, quality = 75): string {
  if (!isUnsplashUrl(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&q=${quality}&fit=crop&auto=format`;
}

export function generateSrcSet(url: string, widths: number[], quality?: number): string {
  if (!isUnsplashUrl(url)) return '';
  return widths
    .map(w => `${optimizeUnsplashUrl(url, w, quality)} ${w}w`)
    .join(', ');
}

export function generateSizes(sizes: { width: number; media?: string }[]): string {
  return sizes
    .map(s => {
      const width = `${Math.ceil(s.width * 4)}px`;
      return s.media ? `(max-width: ${s.media}) ${width}` : width;
    })
    .join(', ');
}

export function getOptimizedSrc(url: string, width = 600): string {
  if (isUnsplashUrl(url)) {
    return optimizeUnsplashUrl(url, width);
  }
  return url;
}
