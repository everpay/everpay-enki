import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Everpay'

interface Props {
  merchantName?: string
  amount?: string
  currency?: string
  disputeId?: string
  reason?: string
  transactionId?: string
  evidenceDueDate?: string
}

const ChargebackNotificationEmail = ({
  merchantName = 'Merchant',
  amount = '0.00',
  currency = 'USD',
  disputeId = 'N/A',
  reason = 'Unspecified',
  transactionId,
  evidenceDueDate,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>⚠️ Chargeback received — {currency} {amount}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>💳 {SITE_NAME}</Text>
        <Heading style={h1}>Chargeback Alert ⚠️</Heading>
        <Text style={text}>A chargeback has been filed against {merchantName}. Immediate action is required.</Text>
        <Section style={alertBox}>
          <table style={table}>
            <tr><td style={labelCell}>Amount</td><td style={valueCellRed}>{currency} {amount}</td></tr>
            <tr><td style={labelCell}>Dispute ID</td><td style={{...valueCell, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px'}}>{disputeId}</td></tr>
            <tr><td style={labelCell}>Reason</td><td style={valueCell}>{reason}</td></tr>
            {transactionId && <tr><td style={labelCell}>Transaction</td><td style={{...valueCell, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px'}}>{transactionId}</td></tr>}
            {evidenceDueDate && <tr><td style={labelCell}>Evidence Due</td><td style={valueCellRed}>{evidenceDueDate}</td></tr>}
          </table>
        </Section>
        <Text style={text}>Please submit supporting evidence before the due date to contest this chargeback.</Text>
        <Hr style={hr} />
        <Text style={footer}>This is an automated notification from {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ChargebackNotificationEmail,
  subject: (data: Record<string, any>) => `⚠️ Chargeback: ${data.currency || 'USD'} ${data.amount || '0.00'} — ${data.reason || 'dispute filed'}`,
  displayName: 'Chargeback notification',
  previewData: { merchantName: 'Acme Corp', amount: '150.00', currency: 'USD', disputeId: 'dsp_xyz789', reason: 'Fraudulent', transactionId: 'txn_abc123', evidenceDueDate: '2026-04-22' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Manrope', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontFamily: "'Sora', sans-serif", fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(172, 72%, 40%)', margin: '0 0 24px' }
const h1 = { fontFamily: "'Sora', sans-serif", fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '0 0 12px' }
const text = { fontSize: '15px', color: 'hsl(215, 15%, 45%)', lineHeight: '1.6', margin: '0 0 20px' }
const alertBox = { backgroundColor: '#fef2f2', borderRadius: '8px', padding: '20px', margin: '0 0 24px' }
const table = { width: '100%', fontSize: '14px' } as React.CSSProperties
const labelCell = { color: 'hsl(215, 15%, 45%)', padding: '4px 0' }
const valueCell = { textAlign: 'right' as const, fontWeight: 600, color: 'hsl(220, 25%, 10%)' }
const valueCellRed = { textAlign: 'right' as const, fontWeight: 600, color: '#dc2626' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
