'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useFinanceStore } from '@/stores/finance-store';

// Currency data for lookup
const CURRENCY_DATA: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
};

// Apply theme to document
function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// Apply accent color to CSS variables
function applyAccentColor(color: string) {
  const root = document.documentElement;
  // Convert hex to RGB for CSS variable
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  root.style.setProperty('--primary', `${r} ${g} ${b}`);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hasHydrated = useRef(false);
  const setCurrency = useUIStore((state) => state.setCurrency);
  const theme = useUIStore((state) => state.theme);
  const accentColor = useUIStore((state) => state.accentColor);

  // Initial hydration
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    // Manually hydrate stores from localStorage
    useUIStore.persist.rehydrate();
    useFinanceStore.persist.rehydrate();

    // Sync currency from cookie to Zustand store
    const syncCurrencyFromCookie = () => {
      const cookies = document.cookie.split(';');
      const currencyCookie = cookies.find(c => c.trim().startsWith('userCurrency='));
      
      if (currencyCookie) {
        const currencyCode = currencyCookie.split('=')[1]?.trim();
        const currencyData = CURRENCY_DATA[currencyCode];
        
        if (currencyCode && currencyData) {
          setCurrency(currencyCode, currencyData.symbol);
        }
      }
    };

    syncCurrencyFromCookie();
  }, [setCurrency]);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
    
    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Apply accent color whenever it changes
  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  return <>{children}</>;
}
