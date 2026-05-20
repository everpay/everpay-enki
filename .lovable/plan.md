# Routing Maestro — Backend Wiring Plan

The 4 substantial features each need DB schema + edge function + UI wiring. I'll stage them across 4 turns so each is fully shipped, tested, and reviewable before moving on.

## Turn 1 — Dashboard & Performance Live Data (foundation)

**Goal**: Replace any remaining mock/placeholder values on `RoutingDashboard` and `ProcessorPerformance` with real aggregates, plus add the dashboard filters (date range, processor, merchant) that drive every chart.

**Schema**
- New view `routing_metrics_daily` (materialized): per-day per-processor success/failure/volume/latency from `transactions`.
- Index on `transactions (provider, created_at, status)`.

**Edge function**: `routing-metrics` (verify_jwt=true, admin-only)
- Input: `{ from, to, processors?, merchantIds? }`
- Output: `{ processors[], trend[], decisions[], totals }` — single composite payload (BFF pattern, per project memory).

**UI**
- `useRoutingMaestro.ts` → swap `useProcessors`, `usePerformanceHistory`, `useRecentRoutingDecisions` to one `useRoutingMetrics(filters)`.
- Add `RoutingFiltersBar` (period selector + processor multi-select + merchant search) on `RoutingDashboard` and `ProcessorPerformance`.
- Real latency from `transactions.latency_ms` (add column if missing) instead of deterministic placeholder.

## Turn 2 — Routing Preview Form + Simulator API

**Goal**: Parameter form (currency, amount, region, MCC, card brand, processor availability toggles) → real `route-simulate` edge function that runs the production routing logic and returns the expected processor chain with explanations.

**Schema**: none (read-only over `routing_rules` + `psp_routes`).

**Edge function**: `route-simulate` — pure function evaluating rules in priority order against the input; returns ordered chain + which rule matched + why each was skipped.

**UI**: rewrite `RoutingPreview.tsx` with the form and step-by-step explanation panel.

## Turn 3 — Failover & Retry: Save / Activate / Audit Log

**Goal**: Move failover config off `localStorage` into DB; every change written to an audit log shown inline.

**Schema**
- `failover_configs (merchant_id, processor, max_retries, retry_delay_ms, backoff, fallback_chain jsonb, active, updated_by)`.
- `routing_audit_log (id, actor_id, action, entity_type, entity_id, before jsonb, after jsonb, created_at)` — RLS: admins read, service role write.

**Edge function**: `routing-config-write` — validates payload, writes config, inserts audit row in one tx.

**UI**: `FailoverConfig.tsx` save/activate buttons + side-panel audit timeline.

## Turn 4 — Rules Engine Full CRUD + Optimistic UI

**Goal**: Create / update / delete routing rules with schema validation, optimistic updates, conflict detection. Reuses audit log from Turn 3.

**Schema**: extend `routing_rules` with `region_match text[]`, `mcc_match text[]`, `card_brand_match text[]`, `updated_by uuid`, `version int`.

**Edge function**: `routing-rules-write` — Zod-validated CRUD + audit emit + optimistic-lock via `version`.

**UI**: full edit dialog in `RulesEngine.tsx`, optimistic `useMutation` with rollback, inline validation.

## Order & checkpoints

```text
Turn 1 (Dashboard live + filters) ──► verify charts
Turn 2 (Preview simulator)        ──► verify chain output
Turn 3 (Failover save + audit)    ──► verify persistence + log
Turn 4 (Rules CRUD)               ──► verify create/edit/delete + audit
```

After each turn I'll pause for you to spot-check before starting the next. Backend storage reuses existing `routing_rules` + `psp_routes` and adds only `failover_configs`, `routing_audit_log`, and the `routing_metrics_daily` view — matching the "reuse existing" option from the earlier scoping question.

Confirm and I'll start with **Turn 1**.