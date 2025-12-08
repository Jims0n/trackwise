// TrackWise Type Definitions v2.0
// Aligned with Prisma schema - uses minor units for money

// ============================================
// ENUMS (mirrored from Prisma)
// ============================================

export type AccountType = 
  | 'CHECKING' 
  | 'SAVINGS' 
  | 'CREDIT_CARD' 
  | 'CASH' 
  | 'INVESTMENT' 
  | 'CRYPTO' 
  | 'LOAN' 
  | 'OTHER';

export type AccountStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export type RecurringFrequency = 
  | 'DAILY' 
  | 'WEEKLY' 
  | 'BIWEEKLY' 
  | 'MONTHLY' 
  | 'QUARTERLY' 
  | 'YEARLY';

export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type BudgetPeriod = 
  | 'WEEKLY' 
  | 'BIWEEKLY' 
  | 'MONTHLY' 
  | 'QUARTERLY' 
  | 'YEARLY' 
  | 'CUSTOM';

// ============================================
// CORE MODELS (Client-side representations)
// ============================================

export interface FinancialAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  institution?: string;
  balance: number; // Display amount (converted from minor units)
  currency: string;
  icon?: string;
  color?: string;
  status: AccountStatus;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  icon: string;
  color?: string;
  type: TransactionType;
  parentId?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number; // Display amount (converted from minor units)
  currency: string;
  description?: string;
  categoryId: string;
  category?: Category;
  notes?: string;
  date: string;
  postedDate?: string;
  receiptUrl?: string;
  recurringRuleId?: string;
  transferPairId?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  account?: FinancialAccount;
}

export interface RecurringRule {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  amount: number; // Display amount
  currency: string;
  description?: string;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  interval: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  occurrenceCount: number;
  nextOccurrence?: string;
  lastOccurrence?: string;
  status: RecurringStatus;
  autoPost: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId?: string;
  category?: Category;
  name: string;
  amount: number; // Display amount
  currency: string;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  spent: number; // Display amount
  lastCalculatedAt: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed
  remaining?: number;
  percentage?: number;
}

export interface UserPreferences {
  id: string;
  userId: string;
  defaultCurrency: string;
  locale: string;
  timezone: string;
  theme: string;
  accentColor: string;
  emailNotifications: boolean;
  budgetAlerts: boolean;
  weeklyDigest: boolean;
  hasCompletedOnboarding: boolean;
}

export interface NetWorthSnapshot {
  id: string;
  userId: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
  accountBreakdown?: Record<string, number>;
}

// ============================================
// DERIVED/UI TYPES
// ============================================

export interface MonthlyCashFlow {
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  byCategory: CategorySummary[];
}

export interface CategorySummary {
  categoryId: string;
  category: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface NetWorth {
  total: number;
  change: number;
  changePercentage: number;
  assets: number;
  liabilities: number;
  byAccount: AccountBalance[];
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  color?: string;
}

export interface TransactionFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  accounts: string[];
  categories: string[];
  types: TransactionType[];
  statuses: TransactionStatus[];
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number; // User enters display amount, converted to minor units in action
  description?: string;
  date: Date;
  categoryId: string;
  accountId: string;
  toAccountId?: string; // For transfers
  notes?: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  institution?: string;
  balance: number; // Initial balance (display amount)
  currency: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface CreateBudgetInput {
  name: string;
  categoryId?: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
  alertThreshold?: number;
}

export interface CreateRecurringRuleInput {
  name: string;
  type: TransactionType;
  amount: number;
  description?: string;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  interval?: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  autoPost?: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert display amount to minor units (cents)
 * @example toMinorUnits(10.50) => 1050
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert minor units to display amount
 * @example fromMinorUnits(1050) => 10.50
 */
export function fromMinorUnits(minorUnits: number | bigint): number {
  return Number(minorUnits) / 100;
}

/**
 * Format amount for display with currency symbol
 */
export function formatMoney(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// CONSTANTS
// ============================================

export const CURRENCY_CONFIG: Record<string, { symbol: string; name: string; decimals: number }> = {
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  NGN: { symbol: '₦', name: 'Nigerian Naira', decimals: 2 },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi', decimals: 2 },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', decimals: 2 },
  ZAR: { symbol: 'R', name: 'South African Rand', decimals: 2 },
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
};

export const ACCOUNT_TYPE_CONFIG: Record<AccountType, { label: string; icon: string; color: string }> = {
  CHECKING: { label: 'Checking', icon: '🏦', color: '#3B82F6' },
  SAVINGS: { label: 'Savings', icon: '🐷', color: '#10B981' },
  CREDIT_CARD: { label: 'Credit Card', icon: '💳', color: '#EF4444' },
  CASH: { label: 'Cash', icon: '💵', color: '#84CC16' },
  INVESTMENT: { label: 'Investment', icon: '📈', color: '#8B5CF6' },
  CRYPTO: { label: 'Crypto', icon: '₿', color: '#F59E0B' },
  LOAN: { label: 'Loan', icon: '🏠', color: '#EC4899' },
  OTHER: { label: 'Other', icon: '📁', color: '#6B7280' },
};
