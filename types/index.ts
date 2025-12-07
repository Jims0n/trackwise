

// Account Types
export type AccountType = 'cash' | 'bank' | 'credit' | 'crypto' | 'investment';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  lastUpdated: Date;
  createdAt: Date;
}

// Transaction Types
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type RecurringInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date: Date;
  category: string;
  categoryIcon?: string;
  accountId: string;
  accountName?: string;
  toAccountId?: string; // For transfers
  receiptUrl?: string;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  status: TransactionStatus;
  createdAt: Date;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  budget?: number;
}

// Cash Flow Types
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
  category: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactions: number;
}

// Net Worth Types
export interface NetWorth {
  total: number;
  change: number;
  changePercentage: number;
  byAccount: AccountBalance[];
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  color: string;
}

// Budget Types
export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

// Savings Goal Types
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  icon: string;
  progress: number;
  projectedCompletion?: Date;
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  currency: string;
  locale: string;
  isAddModalOpen: boolean;
  addModalType: TransactionType | null;
}

// Filter Types
export interface TransactionFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  accounts: string[];
  categories: string[];
  types: TransactionType[];
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

// Chart Data Types
export interface WaterfallData {
  label: string;
  value: number;
  type: 'income' | 'expense' | 'savings' | 'total';
  color: string;
}

export interface TrendData {
  date: string;
  income: number;
  expenses: number;
  savings: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Default Categories
export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: '💼', color: '#10B981', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#6366F1', type: 'income' },
  { id: 'investments', name: 'Investments', icon: '📈', color: '#3B82F6', type: 'income' },
  { id: 'gifts', name: 'Gifts', icon: '🎁', color: '#EC4899', type: 'income' },
  { id: 'other-income', name: 'Other', icon: '💰', color: '#8B5CF6', type: 'income' },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#F59E0B', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#3B82F6', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#EC4899', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8B5CF6', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: '📱', color: '#EF4444', type: 'expense' },
  { id: 'health', name: 'Health', icon: '💊', color: '#10B981', type: 'expense' },
  { id: 'education', name: 'Education', icon: '📚', color: '#6366F1', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#14B8A6', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84CC16', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📺', color: '#F97316', type: 'expense' },
  { id: 'other-expense', name: 'Other', icon: '📦', color: '#71717A', type: 'expense' },
];

export const ALL_CATEGORIES = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
