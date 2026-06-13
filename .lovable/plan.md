
## Phase 1 — Verify-first (new pages from prior turns)

Use the in-preview browser to click through and check console/network for each new route. Fix any blockers before any visual work.

Routes to verify (logged in as admin):
- `/enki/3ds-acs` — ActiveServer 3DS admin
- `/enki/kyb-review` — KYB Review Queue
- `/enki/itspaid` — ItsPaid ACH/Zelle
- `/enki/card-issuing` — Virtual card issuing
- `/enki/processors` — Carespay row + pricing
- `/enki/merchants` — Merchant table rendering (per screenshot from earlier turn)

For each route I'll capture: page renders ✓ / console errors / failed network calls / RLS denials, and fix in-place. Edge functions get a smoke `curl` (`activeserver-3ds`, `itspaid-ach`, `carespay`, `cybersource`, `dwolla-transfers`, `kycaid-form`, `ofapay`, `smartfastpay-checkout`) with a no-op `action` to confirm they boot and auth-gate properly.

## Phase 2 — Wise structural pass (token-preserving)

Hard rules carried from `skill/wise-design-style`:
- **DO NOT** change color tokens (`--primary` stays #1aa478, all semantic tokens preserved).
- **DO NOT** swap fonts (Sora/Manrope stay).
- Only structural/typographic moves.

Moves to apply where they fit:
1. Pill buttons (`rounded-full h-12 px-6 font-semibold`) — primary actions only, not table row buttons.
2. `rounded-3xl` cards with `p-8 md:p-10` on **marketing/auth/checkout** surfaces; keep `rounded-2xl p-6` for admin data cards to preserve density.
3. Display headings (`text-5xl md:text-7xl tracking-tight leading-[0.95]`) on Landing, About, Pricing, Solutions, Auth.
4. Eyebrow labels (`text-sm uppercase tracking-[0.18em] text-muted-foreground`) above section headings.
5. `tabular-nums font-semibold` on every amount/KPI/balance/FX rate display.
6. Alternating `bg-background` / `bg-muted/40` full-bleed sections (`py-20 md:py-32`) on marketing pages only.
7. Circular tinted icon tiles (`h-12 w-12 rounded-2xl bg-primary/10`) replace square icon backgrounds on feature lists.
8. Data list rows: left label / right value, `border-b border-border/60`, `py-4` — applied to settings, treasury, FX, balances.
9. Sidebar refinement: tighter section labels (`text-[10px] uppercase tracking-[0.12em]` — already there), keep current density, add `mt-6` between groups (currently `mt-5`), no rebuild.
10. Framer Motion fade-up on scroll, 24px translate, 600ms ease-out, stagger 80ms — marketing pages only (admin pages stay snappy).

### Scope tiers (so admin density isn't destroyed)

**Tier A — Full Wise (airy, large)**: `src/pages/front/*`, `Landing`, `Auth`, `Checkout`, `PayInvoice`, `ResetPassword`, `Docs`, developer portal landing.

**Tier B — Light Wise (typography + tabular-nums + eyebrow labels, keep density)**: Merchant dashboard (`Dashboard`, `Transactions`, `Invoices`, `Balances`, `Settings`, `Wallets`, `Payouts`, `Subscriptions`, `Customers`), KPI cards, settings pages.

**Tier C — Sidebar + numerals only**: All `/enki/*` admin pages. Apply `tabular-nums` to amounts and eyebrow labels to section titles. **Do not** inflate paddings, **do not** swap to `rounded-3xl`, **do not** add `py-20+` sections. Keep dense ops tables intact.

## Phase 3 — Verification after visual pass
- Re-walk one representative page per tier in the preview at desktop + mobile viewports.
- Confirm no token drift (`rg "#[0-9a-f]{6}" src/pages src/components` should not grow).
- Confirm `>Everpay<` / `everpay-logo` clean greps still pass.

## Technical notes
- Use `framer-motion` (already installed) for marketing fade-ups; lazy-import.
- Add a small `<Eyebrow>` and `<DisplayHeading>` presentational helper in `src/components/wise/` instead of repeating Tailwind chains.
- No migrations. No edge function changes (except bug fixes found in Phase 1).
- No new dependencies.

## What I will NOT do
- Touch `src/index.css` color tokens or `tailwind.config.ts` color extensions.
- Change `--primary`, accent hues, or font families.
- Restructure admin tables, drawers, or routing editors.
- Add new sidebar sections or rename existing ones (sidebar is already correct).
