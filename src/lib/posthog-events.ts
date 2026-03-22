import { posthog } from './posthog';

// ── Button click tracking ──────────────────────────────────────────
export function trackButtonClick(buttonText: string, location: string, extra?: Record<string, any>) {
  posthog.capture('cta_clicked', {
    button_text: buttonText,
    location,
    ...extra,
  });
}

// ── Form submission tracking ───────────────────────────────────────
export function trackFormSubmission(formName: string, fieldCount: number, extra?: Record<string, any>) {
  posthog.capture('form_submitted', {
    form_name: formName,
    field_count: fieldCount,
    ...extra,
  });
}

// ── Outbound link tracking ─────────────────────────────────────────
export function trackOutboundLink(url: string, linkText?: string) {
  posthog.capture('outbound_link_clicked', {
    destination_url: url,
    link_text: linkText ?? '',
  });
}

// ── Scroll depth tracking ──────────────────────────────────────────
const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

export function initScrollDepthTracking() {
  const fired = new Set<number>();
  const pagePath = window.location.pathname;

  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    for (const threshold of SCROLL_THRESHOLDS) {
      if (pct >= threshold && !fired.has(threshold)) {
        fired.add(threshold);
        posthog.capture('scroll_depth_reached', {
          depth_percent: threshold,
          page_path: pagePath,
        });
      }
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}

// ── Bounce tracking (leaves within 10 s) ───────────────────────────
export function initBounceTracking() {
  const landedAt = Date.now();
  const pagePath = window.location.pathname;

  const handler = () => {
    const elapsed = Date.now() - landedAt;
    if (elapsed <= 10_000) {
      posthog.capture('bounce', {
        page_path: pagePath,
        time_on_page_ms: elapsed,
      });
    }
  };

  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}

// ── Global outbound link listener ──────────────────────────────────
export function initOutboundLinkTracking() {
  const handler = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    const href = anchor.href;
    if (href && anchor.hostname !== window.location.hostname) {
      trackOutboundLink(href, anchor.textContent?.trim());
    }
  };

  document.addEventListener('click', handler, true);
  return () => document.removeEventListener('click', handler, true);
}

// ── Global button click listener ───────────────────────────────────
export function initButtonClickTracking() {
  const handler = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest('button, [role="button"], a.btn, a[class*="button"]');
    if (!btn) return;
    // Skip if it's an outbound link (handled separately)
    if (btn.tagName === 'A' && (btn as HTMLAnchorElement).hostname !== window.location.hostname) return;

    const text = btn.textContent?.trim().substring(0, 100) ?? 'unknown';
    const section =
      btn.closest('section')?.id ||
      btn.closest('[data-section]')?.getAttribute('data-section') ||
      btn.closest('header')?.tagName.toLowerCase() ||
      btn.closest('footer')?.tagName.toLowerCase() ||
      btn.closest('nav')?.tagName.toLowerCase() ||
      'unknown';

    trackButtonClick(text, section, {
      page_path: window.location.pathname,
      element_tag: btn.tagName.toLowerCase(),
    });
  };

  document.addEventListener('click', handler, true);
  return () => document.removeEventListener('click', handler, true);
}
