import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TransactionType } from '@/types';

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

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  
  // User preferences
  currency: string;
  currencySymbol: string;
  locale: string;
  
  // Modals
  isAddModalOpen: boolean;
  addModalType: TransactionType | null;
  isAccountModalOpen: boolean;
  selectedAccountId: string | null;
  
  // Navigation
  activeTab: 'home' | 'accounts' | 'add' | 'insights' | 'settings';
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  
  // Data refresh trigger
  dataRefreshKey: number;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setCurrency: (currency: string, symbol: string) => void;
  setLocale: (locale: string) => void;
  
  openAddModal: (type?: TransactionType) => void;
  closeAddModal: () => void;
  
  openAccountModal: (accountId?: string) => void;
  closeAccountModal: () => void;
  
  setActiveTab: (tab: UIState['activeTab']) => void;
  
  completeOnboarding: () => void;
  
  // Trigger data refresh across app
  triggerDataRefresh: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'light',
      accentColor: '#10B981',
      currency: 'USD',
      currencySymbol: '$',
      locale: 'en-US',
      isAddModalOpen: false,
      addModalType: null,
      isAccountModalOpen: false,
      selectedAccountId: null,
      activeTab: 'home',
      hasCompletedOnboarding: false,
      dataRefreshKey: 0,
      
      // Theme actions
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      
      // Preferences actions
      setCurrency: (currency, currencySymbol) => set({ currency, currencySymbol }),
      setLocale: (locale) => set({ locale }),
      
      // Modal actions
      openAddModal: (type) => set({ 
        isAddModalOpen: true, 
        addModalType: type || 'EXPENSE' 
      }),
      closeAddModal: () => set({ 
        isAddModalOpen: false, 
        addModalType: null 
      }),
      
      openAccountModal: (accountId) => set({
        isAccountModalOpen: true,
        selectedAccountId: accountId || null,
      }),
      closeAccountModal: () => set({
        isAccountModalOpen: false,
        selectedAccountId: null,
      }),
      
      // Navigation actions
      setActiveTab: (activeTab) => set({ activeTab }),
      
      // Onboarding actions
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      // Data refresh
      triggerDataRefresh: () => set((state) => ({ dataRefreshKey: state.dataRefreshKey + 1 })),
    }),
    {
      name: 'trackwise-ui',
      storage: createJSONStorage(() => clientStorage),
      skipHydration: true,
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        currency: state.currency,
        currencySymbol: state.currencySymbol,
        locale: state.locale,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// Helper hook for formatting currency
export const useFormatCurrency = () => {
  const { currency, locale } = useUIStore();
  
  return (amount: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  };
};

// Helper hook for formatting numbers
export const useFormatNumber = () => {
  const { locale } = useUIStore();
  
  return (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      ...options,
    }).format(num);
  };
};
