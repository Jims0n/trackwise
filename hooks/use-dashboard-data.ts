'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFinanceStore } from '@/stores/finance-store';
import type { MonthlyCashFlow, NetWorth, Transaction, FinancialAccount } from '@/types';

interface DashboardData {
  netWorth: NetWorth | null;
  monthlyFlow: MonthlyCashFlow | null;
  recentTransactions: Transaction[];
  accounts: FinancialAccount[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const {
    accounts,
    transactions,
    netWorth,
    currentMonthCashFlow,
    setAccounts,
    setTransactions,
    computeNetWorth,
    computeCurrentMonthCashFlow,
    isLoading,
    setLoading,
  } = useFinanceStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch accounts
      const accountsRes = await fetch('/api/accounts');
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.accounts) {
          const mappedAccounts = accountsData.accounts.map((acc: any) => ({
            id: acc.id,
            name: acc.name,
            type: 'bank' as const, // Default type
            balance: Number(acc.balance),
            currency: 'USD',
            isDefault: acc.isDefault,
            lastUpdated: new Date(acc.updatedAt),
            createdAt: new Date(acc.createdAt),
          }));
          setAccounts(mappedAccounts);
        }
      }

      // Fetch transactions
      const transactionsRes = await fetch('/api/transactions');
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        if (transactionsData.transactions) {
          const mappedTransactions = transactionsData.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            description: t.description,
            date: new Date(t.date),
            category: t.category,
            categoryIcon: getCategoryIcon(t.category),
            accountId: t.accountId,
            accountName: t.account?.name,
            isRecurring: t.isRecurring,
            recurringInterval: t.recurringInterval,
            status: t.status,
            createdAt: new Date(t.createdAt),
          }));
          setTransactions(mappedTransactions);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [setAccounts, setTransactions, setLoading]);

  // Initial fetch
  useEffect(() => {
    if (!isInitialized) {
      fetchData();
    }
  }, [isInitialized, fetchData]);

  // Compute derived data when base data changes
  useEffect(() => {
    if (accounts.length > 0) {
      computeNetWorth();
    }
  }, [accounts, computeNetWorth]);

  useEffect(() => {
    if (transactions.length > 0) {
      computeCurrentMonthCashFlow();
    }
  }, [transactions, computeCurrentMonthCashFlow]);

  // Get recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    netWorth,
    monthlyFlow: currentMonthCashFlow,
    recentTransactions,
    accounts,
    isLoading,
    refresh: fetchData,
  };
}

// Helper to get category icons
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Salary': '💼',
    'Freelance': '💻',
    'Investments': '📈',
    'Gifts': '🎁',
    'Food & Dining': '🍔',
    'Transport': '🚗',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Bills & Utilities': '📱',
    'Health': '💊',
    'Education': '📚',
    'Travel': '✈️',
    'Groceries': '🛒',
    'Subscriptions': '📺',
  };
  return icons[category] || '📦';
}

// Hook to use demo data for development
export function useDemoData(): DashboardData {
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const demoNetWorth: NetWorth = {
    total: 12450.00,
    change: 245.50,
    changePercentage: 2.4,
    byAccount: [
      { accountId: '1', accountName: 'Main Checking', accountType: 'bank', balance: 5200, color: '#10B981' },
      { accountId: '2', accountName: 'Savings', accountType: 'bank', balance: 4500, color: '#3B82F6' },
      { accountId: '3', accountName: 'Cash', accountType: 'cash', balance: 750, color: '#F59E0B' },
      { accountId: '4', accountName: 'Crypto', accountType: 'crypto', balance: 2000, color: '#8B5CF6' },
    ],
  };

  const demoMonthlyFlow: MonthlyCashFlow = {
    month: monthName,
    year: now.getFullYear(),
    income: 4200,
    expenses: 2800,
    savings: 1400,
    savingsRate: 33.3,
    byCategory: [
      { category: 'Food & Dining', icon: '🍔', color: '#F59E0B', amount: 650, percentage: 23.2, transactions: 24 },
      { category: 'Transport', icon: '🚗', color: '#3B82F6', amount: 450, percentage: 16.1, transactions: 8 },
      { category: 'Shopping', icon: '🛍️', color: '#EC4899', amount: 380, percentage: 13.6, transactions: 12 },
      { category: 'Bills & Utilities', icon: '📱', color: '#EF4444', amount: 520, percentage: 18.6, transactions: 5 },
      { category: 'Entertainment', icon: '🎬', color: '#8B5CF6', amount: 280, percentage: 10.0, transactions: 6 },
    ],
  };

  const demoTransactions: Transaction[] = [
    {
      id: '1',
      type: 'EXPENSE',
      amount: 45.20,
      description: 'Grocery Store',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      category: 'Groceries',
      categoryIcon: '🛒',
      accountId: '1',
      accountName: 'Main Checking',
      isRecurring: false,
      status: 'COMPLETED',
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'INCOME',
      amount: 3200.00,
      description: 'Monthly Salary',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      category: 'Salary',
      categoryIcon: '💼',
      accountId: '1',
      accountName: 'Main Checking',
      isRecurring: true,
      recurringInterval: 'MONTHLY',
      status: 'COMPLETED',
      createdAt: new Date(),
    },
    {
      id: '3',
      type: 'EXPENSE',
      amount: 4.50,
      description: 'Coffee Shop',
      date: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      category: 'Food & Dining',
      categoryIcon: '☕',
      accountId: '1',
      accountName: 'Main Checking',
      isRecurring: false,
      status: 'COMPLETED',
      createdAt: new Date(),
    },
    {
      id: '4',
      type: 'EXPENSE',
      amount: 120.00,
      description: 'Electric Bill',
      date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      category: 'Bills & Utilities',
      categoryIcon: '⚡',
      accountId: '1',
      accountName: 'Main Checking',
      isRecurring: true,
      recurringInterval: 'MONTHLY',
      status: 'COMPLETED',
      createdAt: new Date(),
    },
    {
      id: '5',
      type: 'EXPENSE',
      amount: 35.99,
      description: 'Netflix Subscription',
      date: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
      category: 'Subscriptions',
      categoryIcon: '📺',
      accountId: '1',
      accountName: 'Main Checking',
      isRecurring: true,
      recurringInterval: 'MONTHLY',
      status: 'COMPLETED',
      createdAt: new Date(),
    },
  ];

  return {
    netWorth: demoNetWorth,
    monthlyFlow: demoMonthlyFlow,
    recentTransactions: demoTransactions,
    accounts: demoNetWorth.byAccount.map(a => ({
      id: a.accountId,
      name: a.accountName,
      type: a.accountType,
      balance: a.balance,
      currency: 'USD',
      isDefault: a.accountId === '1',
      lastUpdated: new Date(),
      createdAt: new Date(),
    })),
    isLoading: false,
    refresh: async () => {},
  };
}
