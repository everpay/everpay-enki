# PostHog Analytics – Advisor Playbook

## Overview
This project uses **PostHog Cloud (US)** for frontend analytics. All custom events are fired via the `posthog-js` SDK and the utilities in `src/lib/posthog-events.ts`.

---

## Custom Events Reference

| Event Name               | Trigger                        | Key Properties                                    |
|--------------------------|--------------------------------|---------------------------------------------------|
| `cta_clicked`            | Any button / role="button"     | `button_text`, `location`, `page_path`            |
| `form_submitted`         | Form submission                | `form_name`, `field_count`, custom extras         |
| `scroll_depth_reached`   | 25 / 50 / 75 / 100 % scroll   | `depth_percent`, `page_path`                      |
| `outbound_link_clicked`  | Click on external `<a>`        | `destination_url`, `link_text`                     |
| `bounce`                 | Page unload within 10 s        | `page_path`, `time_on_page_ms`                     |

---

## How to Use This as an Analytics Advisor

### 1. Pull Real Data
When asked about site performance, query PostHog for the events above. **Never guess.**

```text
PostHog → Activity → Live Events (filter by event name)
PostHog → Insights → New Insight → Trends / Funnels
```

### 2. Key Analyses to Run

| Question                          | PostHog Query                                                      |
|-----------------------------------|--------------------------------------------------------------------|
| Which CTAs get the most clicks?   | Trends → `cta_clicked` → breakdown by `button_text`               |
| Where do users drop off?          | Funnel → pageview → scroll_depth_reached (75%) → cta_clicked      |
| What's the bounce rate per page?  | Trends → `bounce` → breakdown by `page_path`                      |
| Are users reading full pages?     | Trends → `scroll_depth_reached` → breakdown by `depth_percent`    |
| Which outbound links get clicks?  | Trends → `outbound_link_clicked` → breakdown by `destination_url` |
| Form conversion rate?             | Funnel → pageview(/contact) → `form_submitted(contact_form)`      |

### 3. Recommending Changes

For every recommendation, provide:

1. **What to change** — reference actual page elements
2. **Copy-pasteable Lovable prompt** — so the user can implement immediately
3. **What event to watch** — to measure if the change worked

#### Example

> **Finding**: Only 12 % of `/pricing` visitors scroll past 50 %.
>
> **Recommendation**: Move the pricing table above the fold and add a sticky CTA.
>
> **Lovable prompt**:
> ```
> On the Pricing page (src/pages/front/Pricing.tsx), move the pricing
> cards grid to directly below the hero heading. Add a sticky bottom
> bar with a "Start Free Trial" button that appears after 200px scroll.
> ```
>
> **Measure**: Watch `scroll_depth_reached` on `/pricing` — target 50 % → 35 %+ reaching 75 %.

---

## Adding New Event Tracking

### Button / CTA (automatic)
All buttons are tracked automatically via the global click listener. No code changes needed.

### Form Submission (manual)
```tsx
import { trackFormSubmission } from "@/lib/posthog-events";

// Inside your submit handler:
trackFormSubmission('signup_form', 4, { plan: selectedPlan });
```

### Custom Event
```tsx
import { posthog } from "@/lib/posthog";

posthog.capture('pricing_plan_selected', {
  plan_name: 'Pro',
  billing_cycle: 'annual',
});
```

---

## Verification Checklist

1. Open the app in a browser
2. Go to PostHog → Activity → Live Events
3. Perform each action and confirm the event appears:
   - [ ] Click a button → `cta_clicked`
   - [ ] Submit the contact form → `form_submitted`
   - [ ] Scroll to the bottom of a page → `scroll_depth_reached` (25, 50, 75, 100)
   - [ ] Click an external link → `outbound_link_clicked`
   - [ ] Open a page and close the tab within 10 s → `bounce`

---

## Architecture

```
src/lib/posthog.ts            – SDK init + export
src/lib/posthog-events.ts     – All custom tracking helpers + global listeners
src/hooks/usePostHogTracking.ts – React hook mounting all listeners
src/contexts/AuthContext.tsx   – posthog.identify / posthog.reset
src/App.tsx                    – usePostHogTracking() in AppRoutes
```
