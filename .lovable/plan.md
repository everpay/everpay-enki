

## Remove "Ready to get started?" CTA from Footer

The screenshot shows a redundant "Ready to get started?" section in the footer (with "Start now", "See what you'll pay", "Start building" columns). This sits right below the main "Ready to grow your business?" CTA, creating visual clutter.

### What will change

**File: `src/components/front/SiteFooter.tsx`**
- Remove the entire "Ready to get started?" CTA block (lines 60-104) — the three-column grid with "Start now" button, "See what you'll pay", and "Start building"
- Keep the rest of the footer intact (link columns, security badges, copyright)
- Remove the now-unused `ArrowRight` icon import and `Button` import if no longer needed

This is a single-file change. The `CTASection` component ("Ready to grow your business?") remains on all front pages as-is.

