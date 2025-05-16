import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { getUserCurrency, CURRENCY_SYMBOLS } from './currency';

export function formatCurrency(amount: number): string {
  // Get the user's selected currency or use USD as fallback
  const currency = typeof window !== 'undefined' ? getUserCurrency() : 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace(currency, symbol);
}
