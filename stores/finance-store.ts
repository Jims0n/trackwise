import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  FinancialAccount, 
  Transaction, 
  MonthlyCashFlow,
  NetWorth,
  TransactionFilters,
  CategorySummary,
} from '@/types';

// Custom storage that checks for window availability
const clientStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

interface FinanceState {
  // Data
  accounts: FinancialAccount[];
  transactions: Transaction[];
  
  // Computed (cached)
  netWorth: NetWorth | null;
  currentMonthCashFlow: MonthlyCashFlow | null;
  
  // Filters
  filters: TransactionFilters;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Actions - Accounts
  setAccounts: (accounts: FinancialAccount[]) => void;
  addAccount: (account: FinancialAccount) => void;
  updateAccount: (id: string, updates: Partial<FinancialAccount>) => void;
  deleteAccount: (id: string) => void;
  
  // Actions - Transactions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Actions - Computed
  computeNetWorth: () => void;
  computeCurrentMonthCashFlow: () => void;
  
  // Actions - Filters
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  
  // Actions - Loading
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

const defaultFilters: TransactionFilters = {
  dateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  },
  accounts: [],
  categories: [],
  types: [],
  statuses: [],
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      // Initial state
      accounts: [],
      transactions: [],
      netWorth: null,
      currentMonthCashFlow: null,
      filters: defaultFilters,
      isLoading: false,
      isRefreshing: false,
      
      // Account actions
      setAccounts: (accounts) => {
        set({ accounts });
        get().computeNetWorth();
      },
      
      addAccount: (account) => {
        set((state) => ({ accounts: [...state.accounts, account] }));
        get().computeNetWorth();
      },
      
      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
        get().computeNetWorth();
      },
      
      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }));
        get().computeNetWorth();
      },
      
      // Transaction actions
      setTransactions: (transactions) => {
        set({ transactions });
        get().computeCurrentMonthCashFlow();
      },
      
      addTransaction: (transaction) => {
        set((state) => ({ 
          transactions: [transaction, ...state.transactions] 
        }));
        get().computeCurrentMonthCashFlow();
        get().computeNetWorth();
      },
      
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
        get().computeCurrentMonthCashFlow();
      },
      
      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
        get().computeCurrentMonthCashFlow();
        get().computeNetWorth();
      },
      
      // Compute net worth from accounts
      computeNetWorth: () => {
        const { accounts } = get();
        const liabilityTypes = ['CREDIT_CARD', 'LOAN'];
        
        let assets = 0;
        let liabilities = 0;
        
        accounts.forEach(acc => {
          if (liabilityTypes.includes(acc.type)) {
            liabilities += acc.balance;
          } else {
            assets += acc.balance;
          }
        });
        
        const total = assets - liabilities;
        
        // For now, we'll calculate change based on stored previous value
        // In production, this would come from historical data
        const previousTotal = total * 0.98; // Placeholder
        const change = total - previousTotal;
        const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;
        
        const byAccount = accounts.map((acc) => ({
          accountId: acc.id,
          accountName: acc.name,
          accountType: acc.type,
          balance: acc.balance,
          currency: acc.currency,
          color: acc.color,
        }));
        
        set({
          netWorth: {
            total,
            change,
            changePercentage,
            assets,
            liabilities,
            byAccount,
          },
        });
      },
      
      // Compute current month cash flow
      computeCurrentMonthCashFlow: () => {
        const { transactions } = get();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const monthTransactions = transactions.filter((t) => {
          const date = new Date(t.date);
          return date >= monthStart && date <= monthEnd;
        });
        
        const income = monthTransactions
          .filter((t) => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const expenses = monthTransactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const savings = income - expenses;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        
        // Calculate by category
        const categoryMap = new Map<string, { id: string; amount: number; count: number; icon: string; color: string }>();
        
        monthTransactions
          .filter((t) => t.type === 'EXPENSE')
          .forEach((t) => {
            const catId = t.categoryId || 'other';
            const catName = t.category?.name || 'Other';
            const existing = categoryMap.get(catName) || { 
              id: catId,
              amount: 0, 
              count: 0,
              icon: t.category?.icon || '📦',
              color: t.category?.color || '#71717A'
            };
            categoryMap.set(catName, {
              id: existing.id,
              amount: existing.amount + t.amount,
              count: existing.count + 1,
              icon: existing.icon,
              color: existing.color,
            });
          });
        
        const byCategory: CategorySummary[] = Array.from(categoryMap.entries())
          .map(([category, data]) => ({
            categoryId: data.id,
            category,
            icon: data.icon,
            color: data.color,
            amount: data.amount,
            percentage: expenses > 0 ? (data.amount / expenses) * 100 : 0,
            transactionCount: data.count,
          }))
          .sort((a, b) => b.amount - a.amount);
        
        set({
          currentMonthCashFlow: {
            month: now.toLocaleString('default', { month: 'long' }),
            year: now.getFullYear(),
            income,
            expenses,
            savings,
            savingsRate,
            byCategory,
          },
        });
      },
      
      // Filter actions
      setFilters: (filters) => {
        set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        }));
      },
      
      resetFilters: () => set({ filters: defaultFilters }),
      
      // Loading actions
      setLoading: (loading) => set({ isLoading: loading }),
      setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
    }),
    {
      name: 'trackwise-finance',
      storage: createJSONStorage(() => clientStorage),
      skipHydration: true,
      partialize: (state) => ({
        // Only persist these fields
        accounts: state.accounts,
        transactions: state.transactions,
      }),
    }
  )
);
