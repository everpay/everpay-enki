# Everpay OS – LLM.md (Production System Spec)

## SYSTEM IDENTITY
Everpay OS is a full-stack financial operating system designed for:
- Payment orchestration
- Multi-processor routing
- Treasury & liquidity optimization
- Double-entry accounting
- Risk & fraud intelligence
- Plugin ecosystem (Shopify, WooCommerce, etc.)

---

# 1. CORE ARCHITECTURE

## Event-Driven Flow

Payment Created
→ Routing Engine
→ Processor Execution
→ Payment State Machine
→ Ledger Entries
→ Treasury Updates
→ Reconciliation
→ Webhooks

---

# 2. PAYMENT STATE MACHINE

States:
- created
- authorized
- captured
- settled
- refunded
- chargeback

Rules:
- Strict transitions enforced
- No invalid state movement allowed
- All changes emit events

---

# 3. DATABASE SCHEMA (FINAL)

## payment_intents
Primary orchestration layer

Fields:
- id (UUID)
- merchant_id
- amount
- currency
- status
- processor_id
- payment_method
- metadata
- created_at

---

## Existing Tables (Integrated)
- kb_payments → execution layer
- payment_transactions → processor records
- payment_attempts → retries

---

## Webhooks
- webhooks
- webhook_logs

---

## Treasury
- liquidity_pools
- fx_rates

---

## Ledger
- ledger_entries
- ledger_accounts

---

## Reconciliation
- reconciliation_reports

---

# 4. FASTAPI MODULE STRUCTURE

/app/modules/

payments/
webhooks/
router/
treasury/
ledger/
events/

---

# 5. ROUTING ENGINE

Factors:
- approval_rate
- margin
- liquidity
- region
- payment method

Supports:
- Cards
- PIX (Brazil)
- SPEI (Mexico)
- PSE (Colombia)
- ACH (US)
- Mobile Money (Africa)
- Stablecoins (USDC/USDT)

---

# 6. LEDGER SYSTEM

Double-entry accounting:

Capture:
Debit: Cash
Credit: Revenue

Refund:
Debit: Revenue
Credit: Cash

Rules:
- Immutable entries
- Idempotent writes
- Reference-based linking

---

# 7. TREASURY SYSTEM

Features:
- Liquidity pools per currency/region
- FX rate management
- Rebalancing engine

---

# 8. WEBHOOK ENGINE

Features:
- HMAC SHA256 signing
- Retry with backoff
- Logging (webhook_logs)
- Async dispatch

---

# 9. EVENT BUS

Triggers:
- routing
- ledger
- treasury
- reconciliation
- webhooks

Future:
- Kafka / Redis queue

---

# 10. RECONCILIATION ENGINE

Matches:
- internal ledger
- processor reports
- bank settlements

Outputs:
- reconciliation_reports

---

# 11. RISK & FRAUD (SIGGY)

Features:
- device fingerprinting
- fraud graph detection
- ML scoring
- chargeback prediction

---

# 12. PLUGIN SYSTEM

Supports:
- Shopify
- WooCommerce
- Magento
- BigCommerce

Uses unified SDK + Payment Elements

---

# 13. PAYMENT ELEMENTS

Frontend checkout system:
- card capture
- customer data
- tokenization
- secure submission

---

# 14. DEPLOYMENT

Backend:
- FastAPI

Frontend:
- Next.js (Admin + Merchant)

Infra:
- Supabase (DB)
- Cloudflare Workers / Fly.io (API)
- Vercel (frontend)

---

# 15. CRITICAL SAFETY RULES

- Never mutate ledger entries
- Always enforce idempotency
- Use migrations (never manual edits)
- Validate state transitions
- Log everything (audit_logs)

---

# 16. FUTURE UPGRADES

- Distributed queue (Kafka)
- Real-time analytics pipeline
- Advanced treasury optimization
- Institutional reporting layer

---

# SUMMARY

Everpay OS is now:

- Payment processor orchestration layer
- Financial ledger system
- Treasury & liquidity engine
- Risk & fraud platform
- Plugin-enabled checkout infrastructure

This system is designed to scale into a global financial infrastructure platform.
