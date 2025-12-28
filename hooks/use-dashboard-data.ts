'use client';

import { useEffect, useState, useCallback } from 'react';
import type { 
  MonthlyCashFlow, 
  NetWorth, 
  Transaction, 
  FinancialAccount,
  AccountType,
  CategorySummary
} from '@/types';
import { useFinanceStore } from '@/stores/finance-store';
import { useUIStore } from '@/stores/ui-store';

// Simple in-memory store for dashboard data
interface DashboardData {
  netWorth: NetWorth | null;
  monthlyFlow: MonthlyCashFlow | null;
  recentTransactions: Transaction[];
  accounts: FinancialAccount[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [accounts, setAccountsLocal] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactionsLocal] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get store actions to sync data globally
  const { setAccounts: setStoreAccounts, setTransactions: setStoreTransactions } = useFinanceStore();
  
  // Watch for data refresh triggers
  const { dataRefreshKey } = useUIStore();

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch accounts
      const accountsRes = await fetch('/api/accounts');
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.accounts) {
          setAccountsLocal(accountsData.accounts);
          setStoreAccounts(accountsData.accounts); // Sync to global store
        }
      }

      // Fetch transactions
      const transactionsRes = await fetch('/api/transactions');
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        if (transactionsData.transactions) {
          setTransactionsLocal(transactionsData.transactions);
          setStoreTransactions(transactionsData.transactions); // Sync to global store
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [setStoreAccounts, setStoreTransactions]);

  // Initial fetch and refresh when dataRefreshKey changes
  useEffect(() => {
    fetchData();
  }, [fetchData, dataRefreshKey]);

  // Compute net worth from accounts
  const netWorth: NetWorth | null = accounts.length > 0 ? computeNetWorth(accounts) : null;

  // Compute monthly flow from transactions
  const monthlyFlow: MonthlyCashFlow | null = transactions.length > 0 
    ? computeMonthlyFlow(transactions) 
    : null;

  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    netWorth,
    monthlyFlow,
    recentTransactions,
    accounts,
    isLoading,
    refresh: fetchData,
  };
}

// Compute net worth from accounts
function computeNetWorth(accounts: FinancialAccount[]): NetWorth {
  const liabilityTypes: AccountType[] = ['CREDIT_CARD', 'LOAN'];
  
  let assets = 0;
  let liabilities = 0;
  
  const byAccount = accounts.map(acc => {
    const isLiability = liabilityTypes.includes(acc.type);
    if (isLiability) {
      liabilities += acc.balance;
    } else {
      assets += acc.balance;
    }
    return {
      accountId: acc.id,
      accountName: acc.name,
      accountType: acc.type,
      balance: acc.balance,
      currency: acc.currency,
      color: acc.color,
    };
  });

  const total = assets - liabilities;

  return {
    total,
    change: 0, // Would need historical data
    changePercentage: 0,
    assets,
    liabilities,
    byAccount,
  };
}

// Compute monthly cash flow from transactions
function computeMonthlyFlow(transactions: Transaction[]): MonthlyCashFlow {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Filter to current month
  const monthTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= monthStart;
  });

  let income = 0;
  let expenses = 0;
  const categoryTotals: Record<string, { amount: number; icon: string; color: string; count: number }> = {};

  for (const tx of monthTransactions) {
    if (tx.type === 'INCOME') {
      income += tx.amount;
    } else if (tx.type === 'EXPENSE') {
      expenses += tx.amount;
      
      const catName = tx.category?.name || 'Other';
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = {
          amount: 0,
          icon: tx.category?.icon || '📦',
          color: tx.category?.color || '#6B7280',
          count: 0,
        };
      }
      categoryTotals[catName].amount += tx.amount;
      categoryTotals[catName].count++;
    }
  }

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const byCategory: CategorySummary[] = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      categoryId: category,
      category,
      icon: data.icon,
      color: data.color,
      amount: data.amount,
      percentage: expenses > 0 ? (data.amount / expenses) * 100 : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    month: monthName,
    year: now.getFullYear(),
    income,
    expenses,
    savings,
    savingsRate,
    byCategory,
  };
}

// Hook to use demo data for development/empty states
export function useDemoData(): DashboardData {
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const demoAccounts: FinancialAccount[] = [
    {
      id: '1',
      userId: 'demo',
      name: 'Main Checking',
      type: 'CHECKING',
      balance: 5200,
      currency: 'USD',
      icon: '🏦',
      color: '#10B981',
      status: 'ACTIVE',
      isDefault: true,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'demo',
      name: 'Savings',
      type: 'SAVINGS',
      balance: 4500,
      currency: 'USD',
      icon: '🐷',
      color: '#3B82F6',
      status: 'ACTIVE',
      isDefault: false,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      userId: 'demo',
      name: 'Cash',
      type: 'CASH',
      balance: 750,
      currency: 'USD',
      icon: '💵',
      color: '#F59E0B',
      status: 'ACTIVE',
      isDefault: false,
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const demoNetWorth: NetWorth = {
    total: 10450.00,
    change: 245.50,
    changePercentage: 2.4,
    assets: 10450,
    liabilities: 0,
    byAccount: demoAccounts.map(a => ({
      accountId: a.id,
      accountName: a.name,
      accountType: a.type,
      balance: a.balance,
      currency: a.currency,
      color: a.color,
    })),
  };

  const demoMonthlyFlow: MonthlyCashFlow = {
    month: monthName,
    year: now.getFullYear(),
    income: 4200,
    expenses: 2800,
    savings: 1400,
    savingsRate: 33.3,
    byCategory: [
      { categoryId: '1', category: 'Food & Dining', icon: '🍔', color: '#F59E0B', amount: 650, percentage: 23.2, transactionCount: 24 },
      { categoryId: '2', category: 'Transport', icon: '🚗', color: '#3B82F6', amount: 450, percentage: 16.1, transactionCount: 8 },
      { categoryId: '3', category: 'Shopping', icon: '🛍️', color: '#EC4899', amount: 380, percentage: 13.6, transactionCount: 12 },
      { categoryId: '4', category: 'Bills & Utilities', icon: '📱', color: '#EF4444', amount: 520, percentage: 18.6, transactionCount: 5 },
      { categoryId: '5', category: 'Entertainment', icon: '🎬', color: '#8B5CF6', amount: 280, percentage: 10.0, transactionCount: 6 },
    ],
  };

  const demoTransactions: Transaction[] = [
    {
      id: '1',
      userId: 'demo',
      accountId: '1',
      type: 'EXPENSE',
      status: 'COMPLETED',
      amount: 45.20,
      currency: 'USD',
      description: 'Grocery Store',
      categoryId: 'groceries',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'demo',
      accountId: '1',
      type: 'INCOME',
      status: 'COMPLETED',
      amount: 3200.00,
      currency: 'USD',
      description: 'Monthly Salary',
      categoryId: 'salary',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      userId: 'demo',
      accountId: '1',
      type: 'EXPENSE',
      status: 'COMPLETED',
      amount: 4.50,
      currency: 'USD',
      description: 'Coffee Shop',
      categoryId: 'food',
      date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      userId: 'demo',
      accountId: '1',
      type: 'EXPENSE',
      status: 'COMPLETED',
      amount: 120.00,
      currency: 'USD',
      description: 'Electric Bill',
      categoryId: 'bills',
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
      userId: 'demo',
      accountId: '1',
      type: 'EXPENSE',
      status: 'COMPLETED',
      amount: 35.99,
      currency: 'USD',
      description: 'Netflix Subscription',
      categoryId: 'subscriptions',
      date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    netWorth: demoNetWorth,
    monthlyFlow: demoMonthlyFlow,
    recentTransactions: demoTransactions,
    accounts: demoAccounts,
    isLoading: false,
    refresh: async () => {},
  };
}
