import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRY_CATEGORIES, BUSINESS_TYPES } from '@/data/business-categories';

interface IndustrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function IndustrySelect({ value, onValueChange, placeholder = 'Select industry...' }: IndustrySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {INDUSTRY_CATEGORIES.map(cat => (
          <SelectGroup key={cat.value}>
            <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</SelectLabel>
            {cat.subcategories && cat.subcategories.length > 0 ? (
              cat.subcategories.map(sub => (
                <SelectItem key={sub.value} value={sub.value}>
                  <span className="flex items-center gap-2">
                    <span>{sub.label}</span>
                    {sub.mcc && <span className="text-muted-foreground text-xs">MCC {sub.mcc}</span>}
                  </span>
                </SelectItem>
              ))
            ) : (
              <SelectItem value={cat.value}>{cat.label}</SelectItem>
            )}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

interface BusinessTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BusinessTypeSelect({ value, onValueChange, placeholder = 'Select business type...' }: BusinessTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {BUSINESS_TYPES.map(t => (
          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
