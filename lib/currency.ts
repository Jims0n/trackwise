/**
 * Currency utility functions for the Trackwise application
 */

// Default currency if none is selected
const DEFAULT_CURRENCY = "NGN";

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};

/**
 * Get the user's selected currency from cookies
 * @returns The currency code (e.g., "NGN", "USD")
 */
export function getUserCurrency(): string {
  if (typeof document === "undefined") return DEFAULT_CURRENCY;
  
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "userCurrency") {
      return value;
    }
  }
  
  return DEFAULT_CURRENCY;
}

/**
 * Format a number as currency based on the user's selected currency
 * @param amount The amount to format
 * @param currencyCode Optional currency code to override the user's selection
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode?: string): string {
  const currency = currencyCode || getUserCurrency();
  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS[DEFAULT_CURRENCY];
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  }).format(amount).replace(currency, symbol);
}

/**
 * Get all available currencies for selection
 * @returns Array of currency objects with code, name, and symbol
 */
export function getAvailableCurrencies() {
  return [
    { code: "NGN", name: "Nigerian Naira", symbol: CURRENCY_SYMBOLS.NGN },
    { code: "USD", name: "US Dollar", symbol: CURRENCY_SYMBOLS.USD },
    { code: "EUR", name: "Euro", symbol: CURRENCY_SYMBOLS.EUR },
    { code: "GBP", name: "British Pound", symbol: CURRENCY_SYMBOLS.GBP },
    { code: "GHS", name: "Ghanaian Cedi", symbol: CURRENCY_SYMBOLS.GHS },
    { code: "KES", name: "Kenyan Shilling", symbol: CURRENCY_SYMBOLS.KES },
    { code: "ZAR", name: "South African Rand", symbol: CURRENCY_SYMBOLS.ZAR },
  ];
}
