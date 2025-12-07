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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hasHydrated = useRef(false);
  const setCurrency = useUIStore((state) => state.setCurrency);

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

  return <>{children}</>;
}
