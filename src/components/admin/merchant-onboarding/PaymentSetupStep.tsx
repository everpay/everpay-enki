import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export interface PaymentSetupData {
  expectedVolume: string;
  paymentTypes: string[];
  averageTransaction: string;
  primaryUseCase: string;
}

interface Props {
  onNext: (data: PaymentSetupData) => void;
  onBack: () => void;
  initialData?: Partial<PaymentSetupData>;
}

const paymentTypeOptions = [
  { id: 'credit_card', label: 'Credit Cards', description: 'Visa, Mastercard, Amex' },
  { id: 'debit_card', label: 'Debit Cards', description: 'PIN and signature debit' },
  { id: 'ach', label: 'ACH / Bank Transfers', description: 'Direct bank transfers' },
  { id: 'digital_wallet', label: 'Digital Wallets', description: 'Apple Pay, Google Pay' },
  { id: 'mobile_money', label: 'Mobile Money', description: 'M-Pesa, bKash, JazzCash' },
  { id: 'crypto', label: 'Cryptocurrency', description: 'Bitcoin, Ethereum, USDT' },
];

export const PaymentSetupStep = ({ onNext, onBack, initialData }: Props) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PaymentSetupData>({
    expectedVolume: initialData?.expectedVolume || '',
    paymentTypes: initialData?.paymentTypes || [],
    averageTransaction: initialData?.averageTransaction || '',
    primaryUseCase: initialData?.primaryUseCase || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expectedVolume || formData.paymentTypes.length === 0 || !formData.primaryUseCase) {
      toast({ title: "Required fields missing", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }
    onNext(formData);
  };

  const togglePaymentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      paymentTypes: prev.paymentTypes.includes(type)
        ? prev.paymentTypes.filter(t => t !== type)
        : [...prev.paymentTypes, type],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Processing Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Monthly Volume *</Label>
              <Select value={formData.expectedVolume} onValueChange={v => setFormData(p => ({ ...p, expectedVolume: v }))}>
                <SelectTrigger><SelectValue placeholder="Select volume" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-10k">$0 - $10,000</SelectItem>
                  <SelectItem value="10k-50k">$10k - $50k</SelectItem>
                  <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                  <SelectItem value="100k-500k">$100k - $500k</SelectItem>
                  <SelectItem value="500k-1m">$500k - $1M</SelectItem>
                  <SelectItem value="1m+">$1M+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Average Transaction</Label>
              <Select value={formData.averageTransaction} onValueChange={v => setFormData(p => ({ ...p, averageTransaction: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-25">$0 - $25</SelectItem>
                  <SelectItem value="25-100">$25 - $100</SelectItem>
                  <SelectItem value="100-500">$100 - $500</SelectItem>
                  <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="1000+">$1,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Types Needed *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentTypeOptions.map(opt => (
                <div key={opt.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox id={opt.id} checked={formData.paymentTypes.includes(opt.id)} onCheckedChange={() => togglePaymentType(opt.id)} />
                  <div className="flex-1">
                    <Label htmlFor={opt.id} className="font-medium cursor-pointer">{opt.label}</Label>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primary Use Case *</Label>
            <Select value={formData.primaryUseCase} onValueChange={v => setFormData(p => ({ ...p, primaryUseCase: v }))}>
              <SelectTrigger><SelectValue placeholder="Select use case" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ecommerce">E-commerce Website</SelectItem>
                <SelectItem value="retail">In-Person Retail</SelectItem>
                <SelectItem value="mobile_app">Mobile App</SelectItem>
                <SelectItem value="subscription">Subscription / Recurring</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="invoicing">Invoicing / B2B</SelectItem>
                <SelectItem value="donations">Donations / Non-profit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};
