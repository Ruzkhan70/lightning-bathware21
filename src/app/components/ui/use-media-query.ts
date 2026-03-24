import * as React from "react"
import { useEffect, useState } from "react"

export function useMediaQuery(query: string, callback: (matches: boolean) => void) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handler = (event: MediaQueryListEvent) => {
      callback(event.matches)
      setMatches(event.matches)
    }

    setMatches(mediaQuery.matches)
    callback(mediaQuery.matches)

    mediaQuery.addEventListener("change", handler)

    return () => {
      mediaQuery.removeEventListener("change", handler)
    }
  }, [query, callback])

  return matches
}
