

## Plan: Reorder Transaction Table Columns & Add Flowbite-style Input Components

### What changes

**1. Transaction Table -- Move "Method" column next to "Amount"**

Reorder the table columns in `src/components/TransactionTable.tsx`:
- Current order: ID | Customer | Amount | Currency | Status | Provider | Method | ...
- New order: ID | Customer | Amount | Method | Currency | Status | Provider | ...

Update the payment method display to use real card brand SVG logos from `public/logos/` (visa.svg, mastercard.svg, american-express.svg, discover.svg, apple-pay.svg, google-pay.svg, paypal.svg) instead of Lucide icons. Show a small 20px logo image beside the label text.

**2. Create Flowbite-style reusable input components**

Create `src/components/ui/currency-input.tsx` -- a compound input with:
- Currency dropdown (with flag emojis) on the left/right side
- Number input field with currency symbol prefix
- Supports all project currencies (USD, EUR, GBP, BRL, MXN, COP, CAD, BDT, PKR)
- Follows the Flowbite screenshot pattern (flag + code dropdown + amount field)

Create `src/components/ui/number-slider-input.tsx` -- a combined number input + range slider:
- Number input synced with a slider below it
- Configurable min/max/step
- Currency prefix option
- Uses existing `Slider` and `Input` primitives

Create `src/components/ui/card-number-input.tsx` -- a card entry form component:
- Card number field with auto-formatting (4-digit groups) and brand logo detection
- Expiry (MM/YY) and CVV side-by-side
- Auto-detects Visa/MC/Amex/Discover and shows the corresponding SVG from `public/logos/`

Create `src/components/ui/currency-converter.tsx` -- dual currency converter widget:
- Two currency+amount inputs with a swap button between them
- Fiat currencies + BTC/ETH crypto options
- "Last updated" timestamp and refresh button

**3. Adopt new components in existing pages**

Replace raw `<Input type="number">` + `<Select>` currency pairs in:
- `src/pages/NewPayment.tsx` -- use `CurrencyInput`
- `src/pages/Payouts.tsx` -- use `CurrencyInput` for payout amount fields
- `src/pages/Invoices.tsx` -- use `CurrencyInput` for invoice amount
- `src/pages/MassPayouts.tsx` -- use `CurrencyInput` for manual payout entry
- `src/pages/PaymentWidget.tsx` -- use `CardNumberInput` in the widget preview

### Technical details

- Payment method logos: `<img src="/logos/visa.svg" className="h-5 w-auto" />` mapped from brand detection
- `getPaymentMethodInfo` updated to return a `logoSrc` string alongside the label
- `CurrencyInput` props: `value`, `onChange`, `currency`, `onCurrencyChange`, `currencies[]`, `disabled`, `min`, `max`, `placeholder`
- `NumberSliderInput` props: `value`, `onChange`, `min`, `max`, `step`, `prefix`, `minLabel`, `maxLabel`
- `CardNumberInput` props: `onCardChange(cardNumber, expiry, cvv, brand)`, card brand auto-detect using first-6 BIN logic already in codebase
- All components use existing UI primitives (`Input`, `Select`, `Slider`) and Tailwind styling consistent with the project

### Files to create
- `src/components/ui/currency-input.tsx`
- `src/components/ui/number-slider-input.tsx`
- `src/components/ui/card-number-input.tsx`
- `src/components/ui/currency-converter.tsx`

### Files to modify
- `src/components/TransactionTable.tsx` -- column reorder + logo images
- `src/pages/NewPayment.tsx` -- adopt CurrencyInput
- `src/pages/Payouts.tsx` -- adopt CurrencyInput
- `src/pages/Invoices.tsx` -- adopt CurrencyInput
- `src/pages/MassPayouts.tsx` -- adopt CurrencyInput

