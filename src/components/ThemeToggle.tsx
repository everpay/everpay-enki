import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  // Always enforce light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('everpay-theme', 'light');
  }, []);

  // Render nothing — light mode is enforced
  return null;
}
