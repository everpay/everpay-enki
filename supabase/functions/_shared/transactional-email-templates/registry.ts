/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as paymentConfirmation } from './payment-confirmation.tsx'
import { template as invoiceCreated } from './invoice-created.tsx'
import { template as invoicePaid } from './invoice-paid.tsx'
import { template as merchantOnboarding } from './merchant-onboarding.tsx'
import { template as chargebackNotification } from './chargeback-notification.tsx'
import { template as refundNotification } from './refund-notification.tsx'
import { template as payoutNotification } from './payout-notification.tsx'
import { template as transferNotification } from './transfer-notification.tsx'
import { template as depositNotification } from './deposit-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'payment-confirmation': paymentConfirmation,
  'invoice-created': invoiceCreated,
  'invoice-paid': invoicePaid,
  'merchant-onboarding': merchantOnboarding,
  'chargeback-notification': chargebackNotification,
  'refund-notification': refundNotification,
  'payout-notification': payoutNotification,
  'transfer-notification': transferNotification,
  'deposit-notification': depositNotification,
}
