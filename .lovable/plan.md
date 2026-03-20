

## Plan: Fix Error-Level Security Issues and Route Signup/Login Links

### Error-Level Findings

There are **4 error-level** findings across all scanners:

1. **SUPA_rls_disabled_in_public** — 25 tables in the `public` schema have RLS disabled (both test and production). The previous migration file exists but was never applied.
2. **SUPA_sensitive_columns_exposed** — Tables with sensitive columns (PII, credentials, financial data) are exposed without RLS. Resolved by fixing #1.
3. **rls_disabled_live_db** (agent) — Same root cause as #1; pending publish.
4. **shopify_oauth_tokens** (agent) — Shopify tokens exposed; resolved by #1 plus the already-applied frontend fix.

**Root cause**: The migration `20260320220751` was created but never executed against the database. A new migration must be created to actually enable RLS on all 25 tables.

### Signup/Login Link Fix

Currently, 7 front pages link to `https://app.everpayinc.com/sign-up` instead of the project's own `/auth` route. The Auth page accepts a query param or defaults to login mode. We'll add `/login` and `/signup` route aliases and update all external links.

---

### Implementation Steps

#### Step 1: New Database Migration — Enable RLS on All 25 Tables

Create a fresh migration that enables RLS and applies appropriate policies on all 25 tables that currently show `rowsecurity = false`:

- **Merchant-scoped tables** (have `merchant_id`): `payments`, `merchant_accounts`, `api_request_logs`, `behavioral_profiles`, `ledger_accounts`, `settlement_instructions`, `webhook_events`
- **Shopify tables** (scoped via `store_id` → `shopify_stores` → `merchants`): `shopify_stores`, `shopify_orders`, `shopify_products`
- **Transaction-scoped**: `margin_records`
- **Internal/deny-all tables** (no user access needed): `bins`, `device_reputation`, `event_logs`, `fraud_edges`, `fraud_graph_edges`, `fraud_graph_nodes`, `fraud_nodes`, `liquidity_pools`, `plans`, `processor_metrics`, `routing_stats`, `settlement_runs`, `treasury_accounts`, `treasury_transfers`

Each table gets `ENABLE ROW LEVEL SECURITY` plus a `DROP POLICY IF EXISTS` → `CREATE POLICY` pattern to be idempotent.

#### Step 2: Update Auth Page to Support `/login` and `/signup` Routes

- Modify `Auth.tsx` to read the current path and default to signup mode when the path is `/signup`.
- Add `/login` and `/signup` routes in `App.tsx` pointing to the Auth component wrapped in `AuthRoute`.

#### Step 3: Replace All External `app.everpayinc.com` Links

Update these 7 files to use internal `<Link to="/signup">` instead of external `<a href="https://app.everpayinc.com/sign-up">`:

- `src/pages/front/About.tsx`
- `src/pages/front/OnlinePayments.tsx`
- `src/pages/front/Payments.tsx`
- `src/pages/front/Commerce.tsx`
- `src/pages/front/Partners.tsx`
- `src/pages/front/FraudPrevention.tsx`
- `src/pages/front/Pricing.tsx`

#### Step 4: Update SiteHeader Links

- Change the mobile "Sign up" button link from `/auth` to `/signup`
- Change the mobile "Log in" button link from `/auth` to `/login`
- Change the desktop "Login" link from `/auth` to `/login`

#### Step 5: Update Security Registry

Mark `rls_disabled_live_db`, `shopify_oauth_tokens`, `SUPA_rls_disabled_in_public`, and `SUPA_sensitive_columns_exposed` as remediated with notes.

---

### Technical Details

**Migration SQL pattern for merchant-scoped tables:**
```sql
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = payments.merchant_id
      AND merchants.user_id = auth.uid()
  ));
```

**Migration SQL pattern for internal tables:**
```sql
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_all ON public.bins;
CREATE POLICY deny_all ON public.bins
  FOR ALL TO public USING (false) WITH CHECK (false);
```

**Auth route detection:**
```typescript
const location = useLocation();
const [isLogin, setIsLogin] = useState(location.pathname !== '/signup');
```

**Files changed:** ~10 frontend files + 1 database migration

