import { useEffect } from "react"

/**
 * Suppresses the benign ResizeObserver loop error that occurs with CSS animations.
 * This is a known browser issue and doesn't affect functionality.
 * @see https://github.com/WICG/resize-observer/issues/38
 */
export function ResizeObserverSuppressor() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop")) {
        event.stopImmediatePropagation()
        event.preventDefault()
        return true
      }
    }

    window.addEventListener("error", handler)
    return () => window.removeEventListener("error", handler)
  }, [])

  return null
}
