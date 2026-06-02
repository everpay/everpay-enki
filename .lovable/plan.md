## Goal

Refactor the attached "Payouts & Settlements" mock into a per-merchant drill-down view inside the Enki admin panel, styled with the Everpay design system (Sora/Manrope, #1aa478 primary, rounded-2xl cards, semantic tokens — no hardcoded cyan/dark theme from the mock).

## Where it lives

- Refactor existing route `/enki/strategy/merchant-view` (`src/pages/admin/AdminMerchantView.tsx`) — currently a fee dashboard. Expand it into a Settlements & Payouts drill view per merchant. The current merchant picker stays at the top; everything below becomes the new layout.
- Keep using `AppLayout` and existing semantic tokens (`bg-card`, `text-foreground`, `text-primary`, etc.) — no `cyan-*`, no custom dark palette.

## Page structure (per selected merchant)

```text
[ Merchant picker + search ]           (kept from current page)

[ Header: Merchant name | region | status | Next Settlement countdown ]

[ KPI row — 3 cards ]
  Pending Payouts ($, batch count)
  Total Settled (24h)  (+/- vs yesterday)
  Settlement Strategy  (Daily / Weekly / Custom selector)

[ Financial Reconciliation card (2/3) ]   [ Liquidity & Reserve (1/3) ]
  Donut: Net Margin %                       Liquidity reserve bar
  Rows: Gross Settlement                    Risk exposure bar
        Processing Fees (%)                 Current Reserve Balance
        FX Cost (spread bps)                Withdraw to Vault (disabled stub)
        FX Spread Earned (Everpay)
        Network/Gas Fees (crypto)
        Crypto Spread Earned
        Reserve Hold-back (%)
        Commissions Earned (Everpay total)
  Expected Net (highlighted)

[ Payout History table ]
  Columns: Transaction ID · Date · Method (Fiat / Crypto+asset chip) ·
           Amount · FX Rate · Fees · Spread · Net · Status · Actions
  Filter chip row: All / Fiat / Crypto / Stablecoin
  Export CSV button (reuses existing `ExportButton`)
```

## Data sources (reuse, no schema changes)

- Merchants list: `useStrategyMerchants` (already in file)
- Fee + spread data: `useFeeBreakdowns(merchantId)` — gives `processor_fee`, `everpay_fee`, `sponsor_fee`, `total_fee`, `transaction_amount`
- FX cost: `useTransactions` filtered by `merchant_id`, using `fx_rate`, `settlement_currency`, `settlement_amount`
- Crypto / gas / stablecoin: `useElektropayPayments`, `useElektropayWithdrawals`, `useCryptoCommissions` (merchant-scoped)
- Revenue aggregates: `useRevenueAnalytics` merchant breakdown for the donut + totals
- Reserves: existing reserves hook used in `AdminReservesDashboard` (reuse, do not duplicate logic)

Compute derived rows client-side:
- `fxSpreadEarned = sum(settlement_amount - amount * fx_rate)` (when both present)
- `gasFees = sum(elektropay_withdrawal.network_fee)` (fallback 0)
- `cryptoSpread = sum(crypto_commission.fee_percent * amount + fee_fixed)`
- `commissionsEarned = sum(fee_breakdowns.everpay_fee) + cryptoSpread + fxSpreadEarned`
- `netMargin = commissionsEarned / grossSettlement`

## Method classification (table)

For each row, derive a `method` chip:
- `fiat` if `provider` ∈ fiat processors (shieldhub, mondo, matrix, paygate10, makapay, payok, stripe, prometeo)
- `crypto` / `stablecoin` if source is `elektropay_*` or asset symbol is in stablecoin set (USDT, USDC, DAI, etc.)
Render with existing `CardBrandBadge` for fiat and a small asset pill (uses `/public/logos/crypto.svg`) for crypto.

## Styling rules

- All colors via tokens. Donut uses `hsl(var(--primary))` + `hsl(var(--muted))`.
- Card shells: `rounded-2xl border bg-card p-5`.
- Numbers: `font-mono`. Status chips reuse existing pattern from current file (no new color palette).
- Heading: `font-display` (Sora) if available, otherwise current `font-bold` — match existing admin pages, do not introduce Paylyfe blue/cyan.
- Motion: keep `framer-motion` entry animations consistent with rest of file.

## Out of scope

- No new tables, edge functions, or backend logic.
- No changes to the merchant edit modal, reconciliation job, or auth.
- No new dependencies.
- No changes to the public-facing pages.

## Files touched

- `src/pages/admin/AdminMerchantView.tsx` — full refactor (single file).
- Possibly extract small subcomponents inline in the same file to keep it readable; only split into separate files if it exceeds ~400 lines.
