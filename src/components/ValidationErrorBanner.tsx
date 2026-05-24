import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ZodFieldErrors = { fieldErrors: Record<string, string[] | string | unknown>; formErrors?: string[] | string | unknown };
type ProcessorFieldErrors = { fieldErrors: Array<{ field?: string; message?: string } | string> };

export interface ValidationPayload {
  code?: string;
  error?: string;
  error_code?: string;
  provider?: string;
  validation?: ZodFieldErrors | ProcessorFieldErrors;
}

export function isValidationError(data: unknown): data is ValidationPayload {
  if (!data || typeof data !== "object") return false;
  const d = data as ValidationPayload;
  return (d.code === "processor_validation_error" || d.error_code === "processor_validation_error") && !!d.validation;
}

function normalize(p: ValidationPayload) {
  const v = p.validation;
  if (!v) return [] as { field: string; messages: string[] }[];
  const fe = (v as any).fieldErrors;
  if (Array.isArray(fe)) {
    const grouped = new Map<string, string[]>();
    for (const e of fe) {
      const field = typeof e === "object" && e ? String((e as any).field || "form") : "form";
      const message = typeof e === "object" && e ? String((e as any).message || (e as any).error || "Invalid value") : String(e);
      const arr = grouped.get(field) ?? [];
      arr.push(message);
      grouped.set(field, arr);
    }
    return Array.from(grouped, ([field, messages]) => ({ field, messages }));
  }
  if (fe && typeof fe === "object") {
    return Object.entries(fe).map(([field, messages]) => ({
      field,
      messages: Array.isArray(messages) ? messages.map(String) : [String(messages)],
    }));
  }
  return [];
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount", currency: "Currency", paymentMethod: "Payment method",
  customerEmail: "Customer email", cardDetails: "Card details",
  "cardDetails.number": "Card number", "cardDetails.expMonth": "Exp. month",
  "cardDetails.expYear": "Exp. year", "cardDetails.cvc": "CVV",
  "billingDetails.country": "Billing country",
};

export function ValidationErrorBanner({ data }: { data: ValidationPayload }) {
  const rows = normalize(data);
  const fe = (data.validation as ZodFieldErrors)?.formErrors;
  const formErrors = !fe ? [] : Array.isArray(fe) ? fe.map(String) : [String(fe)];
  return (
    <Alert variant="destructive" className="border-destructive/40">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{data.provider ? `${data.provider}: ` : ""}Please correct the following</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1.5 text-sm">
          {formErrors.map((m, i) => (
            <li key={`form-${i}`} className="flex gap-2"><span className="font-medium">•</span><span>{m}</span></li>
          ))}
          {rows.map(({ field, messages }) => (
            <li key={field} className="flex flex-wrap gap-x-2">
              <span className="font-mono text-xs font-semibold rounded bg-destructive/10 px-1.5 py-0.5">{FIELD_LABELS[field] ?? field}</span>
              <span className="text-muted-foreground">{messages.join("; ")}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}