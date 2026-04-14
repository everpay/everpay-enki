import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export interface BusinessAddressData {
  streetAddress: string;
  unitNumber: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Props {
  onNext: (data: BusinessAddressData) => void;
  onBack: () => void;
  initialData?: Partial<BusinessAddressData>;
}

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'KE', label: 'Kenya' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
];

export const BusinessAddressStep = ({ onNext, onBack, initialData }: Props) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BusinessAddressData>({
    streetAddress: initialData?.streetAddress || '',
    unitNumber: initialData?.unitNumber || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'US',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.streetAddress || !formData.city || !formData.postalCode) {
      toast({ title: "Required fields missing", description: "Please fill in the address fields.", variant: "destructive" });
      return;
    }
    onNext(formData);
  };

  const update = (field: keyof BusinessAddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label>Street Address *</Label>
          <Input value={formData.streetAddress} onChange={e => update('streetAddress', e.target.value)} placeholder="123 Main Street" required />
        </div>
        <div className="space-y-2">
          <Label>Unit/Suite</Label>
          <Input value={formData.unitNumber} onChange={e => update('unitNumber', e.target.value)} placeholder="Suite 100" />
        </div>
        <div className="space-y-2">
          <Label>City *</Label>
          <Input value={formData.city} onChange={e => update('city', e.target.value)} placeholder="New York" required />
        </div>
        <div className="space-y-2">
          <Label>State / Province</Label>
          <Input value={formData.state} onChange={e => update('state', e.target.value)} placeholder="NY" />
        </div>
        <div className="space-y-2">
          <Label>ZIP / Postal Code *</Label>
          <Input value={formData.postalCode} onChange={e => update('postalCode', e.target.value)} placeholder="10001" required />
        </div>
        <div className="space-y-2">
          <Label>Country *</Label>
          <Select value={formData.country} onValueChange={v => update('country', v)}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {countries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};
