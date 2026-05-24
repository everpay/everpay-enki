import { buildDeclineBanner, type ProcessPaymentDeclinePayload, type ShieldHubDeclineBanner } from '@/lib/shieldhub-decline';
import { PaymentResultBanner, type PaymentResultBannerData } from '@/components/PaymentResultBanner';

interface Props {
  data?: ProcessPaymentDeclinePayload | null;
  banner?: ShieldHubDeclineBanner | PaymentResultBannerData | null;
  onDismiss?: () => void;
}

export function DeclineBanner({ data, banner, onDismiss }: Props) {
  const resolved: PaymentResultBannerData | null = banner
    ? (banner as PaymentResultBannerData)
    : data ? (buildDeclineBanner(data) as PaymentResultBannerData) : null;
  if (!resolved) return null;
  return <PaymentResultBanner banner={resolved} onDismiss={onDismiss} />;
}
export default DeclineBanner;