import { useState } from "react"
import { useMediaQuery } from "./use-media-query"

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  
  useMediaQuery(`(min-width: ${breakpoint}px)`, (matches) => {
    setIsMobile(!matches)
  })

  return isMobile
}
