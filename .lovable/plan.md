

# Merchant Pricing & Billing Engine

## Summary
Add a complete SaaS monetization layer to Everpay Enki: configurable per-merchant pricing models, automated fee calculation on every transaction, monthly billing invoice generation, and reseller revenue sharing — with three new admin pages and an edge function for fee computation.

## What Exists Today
- **`transaction_fees`** table: processor-level fee configs (percentage, fixed, chargeback, refund) with per-method/region granularity
- **`platform_fee_markups`** table: processor-level markup percentages and flat fees, optionally per-merchant
- **`processor_fee_profiles`** table: per-merchant provider fee profiles (percentage, fixed, settlement days)
- **`invoices`** table: basic merchant invoices (amount, currency, status, items jsonb, due_date)
- **Reseller Portal** (`/reseller`): hardcoded 0.125% commission calculation, no stored splits
- **AdminTransactionFees** page: CRUD for `transaction_fees` table
- **AdminFeeEngine** page: read-only view of `processor_fee_profiles` and `platform_fee_markups`
- **No** `merchant_pricing`, `fee_breakdowns`, or `reseller_splits` tables exist

## Database Changes (Migration)

### New Tables

```text
merchant_pricing
├── id (uuid PK)
├── merchant_id (uuid FK → merchants)
├── model_type (text: 'percentage', 'fixed', 'tiered', 'blended')
├── percentage_fee (numeric, default 2.9)
├── fixed_fee (numeric, default 0.30)
├── currency (text, default 'USD')
├── tiers (jsonb, nullable — volume-based tiers)
├── sponsor_fee_pct (numeric, default 0)
├── active (boolean, default true)
├── created_at / updated_at
└── UNIQUE(merchant_id, currency)

fee_breakdowns
├── id (uuid PK)
├── transaction_id (uuid FK → transactions, UNIQUE)
├── merchant_id (uuid FK → merchants)
├── transaction_amount (numeric)
├── processor_fee (numeric)
├── sponsor_fee (numeric)
├── everpay_fee (numeric)
├── total_fee (numeric)
├── net_amount (numeric)
├── pricing_model (text)
├── pricing_snapshot (jsonb — frozen pricing at calculation time)
└── created_at

reseller_splits
├── id (uuid PK)
├── reseller_id (uuid FK → profiles.user_id)
├── merchant_id (uuid FK → merchants)
├── revenue_share_pct (numeric, default 12.5 — basis points)
├── active (boolean, default true)
├── created_at / updated_at
└── UNIQUE(reseller_id, merchant_id)

billing_periods
├── id (uuid PK)
├── merchant_id (uuid FK → merchants)
├── period_start (timestamptz)
├── period_end (timestamptz)
├── total_transactions (integer)
├── total_volume (numeric)
├── total_fees (numeric)
├── total_processor_fees (numeric)
├── total_sponsor_fees (numeric)
├── total_everpay_fees (numeric)
├── invoice_id (uuid FK → invoices, nullable)
├── status (text: 'open', 'closed', 'invoiced')
└── created_at
```

### RLS Policies
- `merchant_pricing`: admin full access; merchants SELECT own rows
- `fee_breakdowns`: admin full access; merchants SELECT own rows
- `reseller_splits`: admin full CRUD; resellers SELECT own rows
- `billing_periods`: admin full access; merchants SELECT own rows

### Realtime
- Enable realtime on `fee_breakdowns` for live fee tracking

## Edge Functions

### 1. `calculate-fees` (new)
Called after transaction creation (from `process-payment` or `payment-state-machine`).

Logic:
1. Look up `merchant_pricing` for the merchant + currency
2. If tiered model, find applicable tier based on monthly volume
3. Calculate: `processor_fee` (from `processor_fee_profiles`), `sponsor_fee` (from pricing), `everpay_fee` (markup)
4. Insert into `fee_breakdowns`
5. Create corresponding ledger entries (debit merchant, credit platform fee account)

### 2. `generate-billing` (new)
Triggered monthly (cron) or manually by admin.

Logic:
1. For each merchant with `billing_periods.status = 'open'`, aggregate `fee_breakdowns` for the period
2. Create an `invoices` row with line items (processor fees, platform fees, sponsor fees)
3. Update `billing_periods.status = 'invoiced'` and link `invoice_id`
4. Optionally enqueue a transactional email (invoice-created template)

## Frontend — New Admin Pages

### 1. `/enki/pricing` — Merchant Pricing Management
- Table of all merchants with their active pricing model
- Create/edit pricing modal: model type selector, fee inputs, tiered pricing JSON editor
- Bulk pricing assignment
- Per-merchant override indicator

### 2. `/enki/revenue` — Revenue Dashboard
- Summary cards: Total Platform Revenue, Processor Costs, Net Margin, Reseller Payouts
- Monthly revenue chart (stacked: processor + sponsor + everpay)
- Per-merchant revenue breakdown table
- Reseller revenue sharing table with split percentages and earned amounts

### 3. `/enki/billing` — Billing Management
- List of billing periods per merchant with status badges
- Generate invoice button (calls `generate-billing`)
- Link to existing invoice detail view
- Period-level fee aggregation summary

## Hooks (new files)

- `useMerchantPricing()` — CRUD for `merchant_pricing`
- `useFeeBreakdowns(merchantId?)` — query `fee_breakdowns` with filters
- `useResellerSplits()` — CRUD for `reseller_splits`
- `useBillingPeriods(merchantId?)` — query and manage `billing_periods`
- `useRevenueAnalytics()` — aggregated revenue stats from `fee_breakdowns`

## Sidebar Navigation
Add under the existing Enki admin nav sections:
- **Pricing** → `/enki/pricing` (DollarSign icon)
- **Revenue** → `/enki/revenue` (TrendingUp icon)
- **Billing** → `/enki/billing` (Receipt icon)

## Integration Points
- **process-payment**: After successful transaction, invoke `calculate-fees`
- **Ledger**: Fee breakdown amounts added as ledger entries
- **Reseller Portal**: Replace hardcoded 0.125% with actual `reseller_splits` data
- **Settlement engine**: Net settlement = gross - total_fee from `fee_breakdowns`

## File Summary

| Action | File |
|--------|------|
| Migration | `supabase/migrations/xxx_pricing_billing_engine.sql` |
| New edge fn | `supabase/functions/calculate-fees/index.ts` |
| New edge fn | `supabase/functions/generate-billing/index.ts` |
| New hook | `src/hooks/useMerchantPricing.ts` |
| New hook | `src/hooks/useFeeBreakdowns.ts` |
| New hook | `src/hooks/useResellerSplits.ts` |
| New hook | `src/hooks/useBillingPeriods.ts` |
| New hook | `src/hooks/useRevenueAnalytics.ts` |
| New page | `src/pages/admin/AdminPricing.tsx` |
| New page | `src/pages/admin/AdminRevenue.tsx` |
| New page | `src/pages/admin/AdminBilling.tsx` |
| Edit | `src/App.tsx` — add 3 routes |
| Edit | `src/components/AppSidebar.tsx` — add 3 nav items |
| Edit | `src/pages/ResellerPortal.tsx` — use `reseller_splits` |
| Edit | `supabase/config.toml` — register new functions |

