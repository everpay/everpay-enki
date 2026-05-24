export interface ShieldHubDeclineBanner {
  tone: 'error';
  title: string;
  description: string;
  code?: string;
  txId?: string;
}

export interface ProcessPaymentDeclinePayload {
  decline_message?: string;
  decline_code?: string | number;
  error?: string;
  acquirer_client_id?: string | null;
  providerResponse?: {
    error?: { code?: string | number; message?: string; messsage?: string };
    message?: string;
    acquirer_client_id?: string | null;
  };
  transaction?: { id?: string };
}

export const extractDeclineReason = (d: ProcessPaymentDeclinePayload) =>
  d.decline_message || d.error || d.providerResponse?.error?.message
  || d.providerResponse?.error?.messsage || d.providerResponse?.message
  || 'Transaction declined by processor';

export const extractDeclineCode = (d: ProcessPaymentDeclinePayload) =>
  String(d.decline_code || d.providerResponse?.error?.code || '');

export const extractAcquirerClientId = (d: ProcessPaymentDeclinePayload) => {
  const v = d.acquirer_client_id || d.providerResponse?.acquirer_client_id || '';
  return typeof v === 'string' ? v : '';
};

export const isShieldHub004 = (reason: string, code: string) =>
  String(code) === '004' || /processor not found/i.test(reason);

export function buildDeclineBanner(data: ProcessPaymentDeclinePayload): ShieldHubDeclineBanner {
  const reason = extractDeclineReason(data);
  const code = extractDeclineCode(data);
  const txId = data.transaction?.id;
  if (isShieldHub004(reason, code)) {
    const acquirerClientId = extractAcquirerClientId(data);
    const suffix = acquirerClientId ? ` for client-id ${acquirerClientId}` : '';
    return {
      tone: 'error',
      title: 'Acquirer configuration error',
      description: `ShieldHub rejected the request before reaching the issuer because no processor is enabled for this merchant on the ShieldHub side. Your card was NOT charged. Contact ShieldHub to enable a processor${suffix}, then retry.`,
      code: '004', txId,
    };
  }
  return {
    tone: 'error', title: 'Payment declined',
    description: `${reason}${code ? ` (code ${code})` : ''}`,
    code: code || undefined, txId,
  };
}