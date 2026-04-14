import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building, Globe, Hash, Users } from 'lucide-react';

export interface BusinessInfoData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  businessCategory: string;
  businessDescription: string;
  website: string;
  taxId: string;
  employeeCount: string;
  annualRevenue: string;
}

interface Props {
  onNext: (data: BusinessInfoData) => void;
  initialData?: Partial<BusinessInfoData>;
}

export const BusinessInfoStep = ({ onNext, initialData }: Props) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BusinessInfoData>({
    businessName: initialData?.businessName || '',
    contactName: initialData?.contactName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    businessType: initialData?.businessType || '',
    businessCategory: initialData?.businessCategory || '',
    businessDescription: initialData?.businessDescription || '',
    website: initialData?.website || '',
    taxId: initialData?.taxId || '',
    employeeCount: initialData?.employeeCount || '',
    annualRevenue: initialData?.annualRevenue || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.contactName || !formData.email || !formData.phone || !formData.businessType || !formData.businessCategory) {
      toast({ title: "Required fields missing", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    onNext(formData);
  };

  const update = (field: keyof BusinessInfoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Business Name *</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={formData.businessName} onChange={e => update('businessName', e.target.value)} placeholder="Acme Corp" className="pl-9" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Contact Person *</Label>
          <Input value={formData.contactName} onChange={e => update('contactName', e.target.value)} placeholder="John Doe" required />
        </div>
        <div className="space-y-2">
          <Label>Contact Email *</Label>
          <Input type="email" value={formData.email} onChange={e => update('email', e.target.value)} placeholder="john@acme.com" required />
        </div>
        <div className="space-y-2">
          <Label>Contact Phone *</Label>
          <Input type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 123-4567" required />
        </div>
        <div className="space-y-2">
          <Label>Business Type *</Label>
          <Select value={formData.businessType} onValueChange={v => update('businessType', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="llc">LLC</SelectItem>
              <SelectItem value="corporation">Corporation</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
              <SelectItem value="nonprofit">Non-Profit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Business Category *</Label>
          <Select value={formData.businessCategory} onValueChange={v => update('businessCategory', v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="professional_services">Professional Services</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="hospitality">Hospitality</SelectItem>
              <SelectItem value="food_beverage">Food & Beverage</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input type="url" value={formData.website} onChange={e => update('website', e.target.value)} placeholder="https://example.com" className="pl-9" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tax ID / EIN</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={formData.taxId} onChange={e => update('taxId', e.target.value)} placeholder="XX-XXXXXXX" className="pl-9" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Employee Count</Label>
          <Select value={formData.employeeCount} onValueChange={v => update('employeeCount', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 (Just me)</SelectItem>
              <SelectItem value="2-10">2-10</SelectItem>
              <SelectItem value="11-50">11-50</SelectItem>
              <SelectItem value="51-200">51-200</SelectItem>
              <SelectItem value="201-500">201-500</SelectItem>
              <SelectItem value="500+">500+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Annual Revenue</Label>
          <Select value={formData.annualRevenue} onValueChange={v => update('annualRevenue', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0-50k">$0 - $50,000</SelectItem>
              <SelectItem value="50k-100k">$50k - $100k</SelectItem>
              <SelectItem value="100k-500k">$100k - $500k</SelectItem>
              <SelectItem value="500k-1m">$500k - $1M</SelectItem>
              <SelectItem value="1m-5m">$1M - $5M</SelectItem>
              <SelectItem value="5m+">$5M+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Business Description</Label>
        <Textarea value={formData.businessDescription} onChange={e => update('businessDescription', e.target.value)} placeholder="Briefly describe what the business does..." rows={3} />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};
