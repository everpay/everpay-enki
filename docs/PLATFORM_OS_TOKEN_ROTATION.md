# Platform OS Admin Token Rotation

`PLATFORM_OS_ADMIN_TOKEN` is the single credential the Enki admin proxy
uses to read merchants/users/transactions/etc. from the Everpay Platform
OS gateway. Rotating it revokes Enki's access in one step — **no code
change or redeploy is required**.

## When to rotate
- Suspected leak (logs, screenshots, support tickets, repo).
- Quarterly hygiene rotation.
- Anytime an Enki admin or contractor with secret-read access offboards.

## Procedure (zero-downtime)

1. **Mint a new token** in the Platform OS project (Edge Function settings)
   and keep the old one active for the moment.
2. **Update the secret** in Enki:
   Lovable → Cloud → Secrets → `PLATFORM_OS_ADMIN_TOKEN` → *Update*.
   Edge functions read `Deno.env` per-invocation, so the new value is live
   on the next request.
3. **Verify** in the admin UI by calling the proxy with
   `{ action: "token_status" }` (the “Backend health” panel does this for
   you). Confirm:
   - `token_configured: true`
   - `gateway_reachable: true`
   - `token_fingerprint` matches the fingerprint shown in the Platform OS
     project for the new token.
4. **Revoke the old token** in the Platform OS project once the
   fingerprint matches and admin pages load.

## Logging & response rules

The proxy redacts the token (and other secrets) from every log line and
every JSON response. See `redact()` in
`supabase/functions/admin-data-proxy/index.ts`:

- `console.log` / `console.error` go through `logInfo` / `logError`
  which run `redact()` first.
- All responses go through `jsonResponse()` which scrubs the serialized
  payload before sending.
- Gateway transport errors return the static string `"gateway_error"`
  rather than the underlying `err.message`, so a stack trace can never
  leak the bearer token.
- The unhandled-error path returns `"Internal error"` for the same
  reason; the real message is only logged (after redaction).

## Validation

`validatePlatformToken()` runs on every gateway call and rejects:
- empty / unset values (`missing`)
- values shorter than 16 chars (`too_short`)
- values containing whitespace (`contains_whitespace`)

These short-circuit before any outbound `fetch`, so a malformed rotation
never hits the network and never produces a leaky 401 from the gateway.