

# Everpay Platform OS — FastAPI Integration & Operations Extension

## Summary
Extend the existing merchant and admin dashboards with FastAPI orchestration layer integration, adaptive rate limiting UI, risk signal dashboards, and real API call patterns — without overwriting existing pages.

---

## What Already Exists (No Rebuild Needed)

| Feature | Current Page | Status |
|---------|-------------|--------|
| Merchant Overview | `/dashboard` (Index.tsx) | Has balances, transactions, success rate |
| Payments/Charges | `/transactions` | Full transaction list with filters |
| Payouts | `/payouts` | Request + history + balance validation |
| Settings (API keys, webhooks, profile) | `/settings` | Comprehensive settings page |
| Admin Overview | `/enki` (AdminDashboard) | Volume, merchants, health |
| Admin Merchant Management | `/enki/merchants` | List + details |
| Admin Fee Engine | `/enki/strategy/fees` | Fee markups |
| Treasury/Liquidity | `/treasury`, `/merchant-treasury` | Multi-currency, FX |
| Risk/Fraud | `/chargebacks`, `/fraud-graph` | Disputes, fraud intelligence |

---

## What's New (To Build)

### Phase 1: Database Schema (Migration)

New tables required:

1. **`merchant_endpoint_rate_limits`** — per-merchant, per-endpoint rate limits
   - `merchant_id`, `endpoint_type` (payments/payouts/api), `requests_per_minute`, `burst_limit`, `created_at`, `updated_at`

2. **`merchant_risk_profiles`** — adaptive risk engine state
   - `merchant_id`, `risk_score`, `adaptive_multiplier`, `success_rate`, `chargeback_rate`, `fraud_score`, `velocity_score`, `locked` (boolean), `updated_at`

3. **`merchant_risk_signals`** — historical risk signal log
   - `merchant_id`, `signal_type`, `value`, `recorded_at`

RLS: merchant-scoped SELECT for merchants; admin full access.

### Phase 2: FastAPI Integration Layer

Create `src/lib/fastapi-client.ts` — a typed HTTP client that routes sensitive operations through FastAPI instead of direct Supabase calls.

```text
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│ Frontend │────►│ FastAPI  │────►│ Supabase  │     │ Ruby AM  │
│ (React)  │     │ Orchestr.│────►│ (DB/Auth) │     │ Engine   │
└──────────┘     └──────────┘     └───────────┘     └──────────┘
                      │                                  ▲
                      └──────────────────────────────────┘
```

- Configurable base URL via `VITE_FASTAPI_URL` env var (falls back to edge functions when not set)
- Endpoints: `/payments/charge`, `/payments/refund`, `/payouts/create`, `/merchants/{id}/summary`, `/treasury/liquidity`, `/config/rate-limit/{merchant_id}/{endpoint_type}`, `/adaptive-rate-limit/{merchant_id}`
- Bearer token passthrough from Supabase session
- Typed request/response interfaces

### Phase 3: New Merchant Pages

**A. Rate Limits Page (`/rate-limits`)**
- Displays per-endpoint rate limits (payments, payouts, api)
- Shows base limit, adaptive multiplier, effective limit
- Real-time usage bar charts (polling from FastAPI)
- Read-only for merchants

**B. Risk Profile Page (`/risk-profile`)**
- Current risk score with gauge visualization
- Adaptive multiplier display
- Underlying signals breakdown (success rate, chargeback rate, fraud score, velocity)
- Historical signal chart

**C. Enhanced Dashboard (`/dashboard`)**
- Add rate limit summary widget and risk score indicator to existing Index.tsx
- Add pending vs available balance breakdown (already partially exists in accounts table)

### Phase 4: New Admin Pages

**A. Risk & Adaptive Engine (`/enki/risk-engine`)**
- Table of all merchants with risk scores, multipliers, signals
- Inline edit for manual multiplier override
- Lock/unlock rate limits per merchant
- Signal detail drill-down

**B. Rate Limits Configuration (`/enki/rate-limits`)**
- Per-merchant, per-endpoint rate limit editor
- Editable `requests_per_minute` and `burst_limit`
- Saves to `merchant_endpoint_rate_limits` table
- Bulk actions (apply template to multiple merchants)

**C. Enhanced Admin Treasury (`/enki/fx-treasury`)**
- Add payout obligations view and liquidity risk highlighting to existing page

### Phase 5: Shared Components & Hooks

- `useRateLimits(merchantId)` — fetches rate limits via FastAPI
- `useRiskProfile(merchantId)` — fetches risk profile via FastAPI
- `useFastAPI()` — core hook wrapping the FastAPI client with auth token
- `RateLimitGauge` — visual component showing usage vs limit
- `RiskScoreGauge` — circular gauge for risk score display
- `AdaptiveMultiplierBadge` — shows current multiplier

### Phase 6: Routing & Navigation

- Add `/rate-limits` and `/risk-profile` to merchant sidebar under new "Operations" section
- Add `/enki/risk-engine` and `/enki/rate-limits` to admin sidebar under "Routing & Controls"
- All new pages wrapped in `ProtectedRoute` / `RoleProtectedRoute`

---

## Technical Details

- **FastAPI client pattern**: All calls go through `src/lib/fastapi-client.ts` which checks for `VITE_FASTAPI_URL`. If not set, falls back to equivalent Supabase edge function calls (graceful degradation).
- **Polling**: Rate limit usage and risk signals use 30-second polling via `refetchInterval` in React Query.
- **No mock data**: All components render empty states when no data is available; real queries only.
- **Security**: Merchant pages filter by authenticated user's merchant ID; admin pages require `admin`/`super_admin` role via `RoleProtectedRoute`.
- **Mobile responsive**: All new pages use the existing `AppLayout` wrapper with responsive grid patterns.

---

## Files to Create/Edit

| Action | File |
|--------|------|
| Create | `src/lib/fastapi-client.ts` |
| Create | `src/hooks/useRateLimits.ts` |
| Create | `src/hooks/useRiskProfile.ts` |
| Create | `src/pages/RateLimits.tsx` |
| Create | `src/pages/RiskProfile.tsx` |
| Create | `src/pages/admin/AdminRiskEngine.tsx` |
| Create | `src/pages/admin/AdminRateLimits.tsx` |
| Create | `src/components/RateLimitGauge.tsx` |
| Create | `src/components/RiskScoreGauge.tsx` |
| Edit | `src/pages/Index.tsx` — add rate limit + risk widgets |
| Edit | `src/App.tsx` — add new routes |
| Edit | `src/components/AppSidebar.tsx` — add nav items |
| Migration | New tables: `merchant_endpoint_rate_limits`, `merchant_risk_profiles`, `merchant_risk_signals` |

