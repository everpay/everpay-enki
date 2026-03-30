# Tapix Integration

This project integrates with [Tapix](https://developers.tapix.io/documentation) to enrich payment data with merchant, shop, and location information using a unified BFF (Backend-for-Frontend) pattern.

## Architecture

### Unified Edge Function (`tapix-enrich`)

A single edge function handles all Tapix API interactions, implementing the BFF pattern from the Medium article reference. Instead of the frontend making multiple REST calls, one call to `tapix-enrich` chains:

1. **Find shop** — via `/shops/complete/findByCardTransaction` or `/shops/findByBankTransfer/{type}`
2. **Get shop details** — via `/shops/{id}` (address, GPS, URL, tags, category)
3. **Get merchant details** — via `/merchants/{id}` (name, logo)

All results are cached in `tapix_enrichment_cache` to avoid redundant API calls.

### Supported Actions

| Action | Description | Tapix Endpoints |
|--------|-------------|-----------------|
| `enrich_card` | Enrich card payment data | `GET /shops/complete/findByCardTransaction` → `GET /shops/{id}` → `GET /merchants/{id}` |
| `enrich_bank_transfer` | Enrich bank transfer data | `GET /shops/findByBankTransfer/{sepa\|uk\|certis}` → `GET /shops/{id}` → `GET /merchants/{id}` |
| `get_shop` | Get shop details by UID | `GET /shops/{id}` |
| `get_merchant` | Get merchant details by UID | `GET /merchants/{id}` |
| `enrich_full` | BFF: auto-detect type, enrich, and cache | All of the above, with DB caching |

### Database Cache

The `tapix_enrichment_cache` table stores enrichment results per transaction:
- `shop_data` — Full shop JSON (address, GPS, tags, category, URL)
- `merchant_data` — Merchant JSON (name, logo)
- `tapix_handle` — Tapix handle for invalidation tracking
- `shop_uid` / `merchant_uid` — UIDs for direct lookups

RLS ensures merchants can only read their own cached data.

## Configuration

The Tapix JWT token is stored as a secret: `TAPIX_TOKEN`

## Frontend Usage

### Unified Client (`src/lib/tapix.ts`)

```typescript
import { enrichTransaction, enrichCardPayment, enrichBankTransfer, getCachedEnrichments } from '@/lib/tapix';

// BFF pattern: one call enriches everything and caches
const result = await enrichTransaction('txn_id', 'merchant_id');
// result.shopData — shop address, GPS, tags
// result.merchantData — merchant name, logo

// Direct card enrichment
const cardResult = await enrichCardPayment({
  merchantId: '180520001',
  description: 'TESCO PRAHA',
  country: 'CZ',
});

// Direct bank transfer enrichment
const bankResult = await enrichBankTransfer({
  transferType: 'sepa',
  iban: 'NL89INGB0000231412',
  bic: 'INGBNL2A',
  country: 'NL',
});

// Batch read from cache (no API calls)
const cached = await getCachedEnrichments(['txn_1', 'txn_2', 'txn_3']);
```

### React Hooks (`src/hooks/useTapixEnrichment.ts`)

```typescript
import { useTapixCache, useTapixEnrich, getEnrichmentSummary } from '@/hooks/useTapixEnrichment';

// Read cached enrichments for visible transactions
const { data: cache } = useTapixCache(transactionIds);
const summary = getEnrichmentSummary(cache['txn_id']);
// summary.merchantName, summary.merchantLogo, summary.address, etc.

// Trigger enrichment for a single transaction
const enrich = useTapixEnrich();
enrich.mutate({ transactionId: 'txn_id', merchantId: 'merchant_id' });
```

## UI Integration

### Transaction Table
- **Gateway column** shows the payment provider with a ⚡ icon when Tapix enrichment data is available
- **Merchant column** (non-compact mode) shows enriched merchant name and logo

### Transaction Detail Drawer
- **Payment Enrichment section** displays:
  - Merchant name and logo
  - Shop type (bricks/online)
  - Category and tags
  - Physical address with map pin
  - Website URL
  - Enrichment type badge (card/bank_transfer)
- **"Enrich" button** triggers on-demand enrichment for transactions not yet cached

## Tapix API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v6/shops/complete/findByCardTransaction` | GET | Find shop from card transaction data (complete response) |
| `/v6/shops/findByBankTransfer/sepa` | GET | Find shop from SEPA bank transfer |
| `/v6/shops/findByBankTransfer/uk` | GET | Find shop from UK BACS/Faster Payment |
| `/v6/shops/findByBankTransfer/certis` | GET | Find shop from Czech CERTIS transfer |
| `/v6/shops/{id}` | GET | Get full shop details (address, GPS, tags) |
| `/v6/merchants/{id}` | GET | Get merchant name and logo |

## Security

- The `TAPIX_TOKEN` is never exposed to the frontend
- All API calls are proxied through the edge function
- Cache table has RLS policies scoped to merchant ownership
- Service role is used for cache writes in the edge function

## Resources

- [Tapix Developer Documentation](https://developers.tapix.io/documentation)
- [Getting Started Guide](https://developers.tapix.io/guides/getting-started-with-tapix)
- [Card Payment Enrichment](https://developers.tapix.io/guides/enrich-card-payment-data)
- [Bank Transfer Enrichment](https://developers.tapix.io/guides/enrich-bank-transfer-data)
- [Shop & Merchant Info](https://developers.tapix.io/guides/get-shop-and-merchant-information)
