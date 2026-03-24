import { useEffect, useRef, useCallback } from "react";

interface UseTypedSequenceOptions {
  targetSequence: string;
  onMatch: () => void;
  timeout?: number;
  enabled?: boolean;
  caseSensitive?: boolean;
  ignoredTags?: string[];
}

export function useTypedSequence({
  targetSequence,
  onMatch,
  timeout = 2000,
  enabled = true,
  caseSensitive = false,
  ignoredTags = ["INPUT", "TEXTAREA", "SELECT"],
}: UseTypedSequenceOptions) {
  const bufferRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetBuffer = useCallback(() => {
    bufferRef.current = "";
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const checkMatch = useCallback(() => {
    const normalizedBuffer = caseSensitive
      ? bufferRef.current
      : bufferRef.current.toLowerCase();
    const normalizedTarget = caseSensitive
      ? targetSequence
      : targetSequence.toLowerCase();

    if (normalizedBuffer === normalizedTarget) {
      onMatch();
      resetBuffer();
      return true;
    }

    const partialMatch = normalizedTarget.startsWith(normalizedBuffer);
    if (!partialMatch) {
      resetBuffer();
    }

    return false;
  }, [targetSequence, onMatch, caseSensitive, resetBuffer]);

  useEffect(() => {
    if (!enabled || !targetSequence) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName;

      if (ignoredTags.includes(tagName)) {
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      if (e.key === "Escape") {
        resetBuffer();
        return;
      }

      if (e.key === "Backspace") {
        bufferRef.current = bufferRef.current.slice(0, -1);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (bufferRef.current.length > 0) {
          timeoutRef.current = setTimeout(resetBuffer, timeout);
        }
        return;
      }

      if (e.key.length !== 1) {
        return;
      }

      bufferRef.current += e.key;

      const maxLength = targetSequence.length;
      if (bufferRef.current.length > maxLength) {
        bufferRef.current = bufferRef.current.slice(-maxLength);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(resetBuffer, timeout);

      checkMatch();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [targetSequence, enabled, timeout, ignoredTags, checkMatch, resetBuffer]);
}
