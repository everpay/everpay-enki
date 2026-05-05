# Enki Admin E2E Smoke Checklist

## Prereqs
1. `ADMIN_JWT=... bun scripts/seed-test-data.ts` (see file header for JWT capture).
2. Login at `/auth` as `richard.r@everpayinc.com` -> redirects to `/enki`.

## Auth & access
- [ ] `/enki` loads admin dashboard (no `/auth` bounce).
- [ ] Non-admin redirected away from `/enki/*`.

## Merchants CRUD
- [ ] `/enki/merchants` lists 3 seeded merchants.
- [ ] Edit display name -> save -> reload -> persisted.
- [ ] Toggle `active` -> reload -> DB row matches.

## Users CRUD
- [ ] `/enki/users` shows users with role badges.
- [ ] Change role via dropdown -> persists across reload.
- [ ] "Sync now" triggers `sync-external-merchants`; new-since badge clears.

## Routing rules editor
- [ ] `/enki/psp-routing` lists rules per merchant.
- [ ] Add rule (merchant=Acme, country=GB, processor=mondo, priority=5) -> appears.
- [ ] Toggle active -> DB `active` flips -> reload preserves state.
- [ ] Delete rule -> removed from list.

## Per-merchant processor toggle (multi-merchant)
- [ ] For each seeded merchant, flip `psp_routes.processor=mondo` to active.
- [ ] After full reload, switch state matches DB for all 3.

## Processors transactions view
- [ ] `/enki/transaction-monitoring` paginates.
- [ ] Filter by provider -> network call body contains the filter.
- [ ] JSON drawer shows full row payload.

## Routing smoke (programmatic)
- [ ] `cd supabase/functions/routing-engine && deno test --allow-net --allow-env --allow-read index_test.ts`
- [ ] All 9 currency cases + idempotency pass.

## Failures
For any unchecked box, attach: screenshot, console output, network entry.
