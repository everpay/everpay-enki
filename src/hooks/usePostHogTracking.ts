import { useEffect } from 'react';
import {
  initScrollDepthTracking,
  initBounceTracking,
  initOutboundLinkTracking,
  initButtonClickTracking,
} from '@/lib/posthog-events';

/**
 * Initialises all passive PostHog event listeners.
 * Mount once at the app root (e.g. App.tsx).
 */
export function usePostHogTracking() {
  useEffect(() => {
    const cleanups = [
      initScrollDepthTracking(),
      initBounceTracking(),
      initOutboundLinkTracking(),
      initButtonClickTracking(),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, []);
}
