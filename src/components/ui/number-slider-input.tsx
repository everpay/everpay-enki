import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Slider } from './slider';

interface NumberSliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function NumberSliderInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  prefix,
  suffix,
  minLabel,
  maxLabel,
  disabled,
  className,
}: NumberSliderInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'font-mono text-lg',
            prefix && 'pl-8',
            suffix && 'pr-12'
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minLabel || min}</span>
          <span>{maxLabel || max}</span>
        </div>
      )}
    </div>
  );
}
