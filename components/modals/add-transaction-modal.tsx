'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Calendar, Repeat, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useFinanceStore } from '@/stores/finance-store';
import { cn } from '@/lib/utils';
import { createTransaction } from '@/app/actions/transaction';
import { getFinancialAccounts } from '@/app/actions/financial-account';
import { toast } from 'sonner';
import type { TransactionType, Category, FinancialAccount } from '@/types';
import { getCategories } from '@/app/actions/category';

// Backdrop animation
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Modal slide animation
const modalVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 30,
      stiffness: 300,
    }
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: {
      duration: 0.2,
    }
  },
};

export function AddTransactionModal() {
  const { isAddModalOpen, addModalType, closeAddModal, currencySymbol, triggerDataRefresh } = useUIStore();
  const { accounts: storeAccounts, addTransaction, setAccounts } = useFinanceStore();
  
  // Local accounts state (in case store is empty)
  const [localAccounts, setLocalAccounts] = useState<FinancialAccount[]>([]);
  const accounts = storeAccounts.length > 0 ? storeAccounts : localAccounts;
  
  // Form state
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load accounts if store is empty
  useEffect(() => {
    async function loadAccounts() {
      if (storeAccounts.length === 0) {
        const result = await getFinancialAccounts();
        if (result.accounts) {
          setLocalAccounts(result.accounts);
          setAccounts(result.accounts); // Also update store
        }
      }
    }
    if (isAddModalOpen) {
      loadAccounts();
    }
  }, [isAddModalOpen, storeAccounts.length, setAccounts]);

  // Reset form when modal opens
  useEffect(() => {
    if (isAddModalOpen && addModalType) {
      setType(addModalType);
      setAmount('');
      setCategory(null);
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      // Set default account
      const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id);
      }
    }
  }, [isAddModalOpen, addModalType, accounts]);

  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories from server
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories(type);
      if (result.categories) {
        setCategories(result.categories);
      }
    }
    if (isAddModalOpen) {
      loadCategories();
    }
  }, [isAddModalOpen, type]);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For today's date, use current timestamp; for other dates, parse with local timezone
      const today = new Date().toISOString().split('T')[0];
      const transactionDate = date === today 
        ? new Date() // Use current timestamp for today
        : new Date(date + 'T12:00:00'); // Use noon local time for other dates
      
      const result = await createTransaction({
        type: type as 'INCOME' | 'EXPENSE',
        amount: parseFloat(amount),
        description: description || undefined,
        date: transactionDate,
        categoryId: category.id,
        accountId: selectedAccountId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${type === 'INCOME' ? 'Income' : 'Expense'} added successfully!`);
        triggerDataRefresh(); // Refresh dashboard data
        closeAddModal();
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeColors = {
    INCOME: {
      bg: 'bg-[rgb(var(--income))]',
      text: 'text-[rgb(var(--income))]',
      lightBg: 'bg-[rgb(var(--income))]/10',
    },
    EXPENSE: {
      bg: 'bg-[rgb(var(--expense))]',
      text: 'text-[rgb(var(--expense))]',
      lightBg: 'bg-[rgb(var(--expense))]/10',
    },
    TRANSFER: {
      bg: 'bg-[rgb(var(--transfer))]',
      text: 'text-[rgb(var(--transfer))]',
      lightBg: 'bg-[rgb(var(--transfer))]/10',
    },
  };

  const currentColors = typeColors[type];

  return (
    <AnimatePresence>
      {isAddModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeAddModal}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-[rgb(var(--card))] shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-[rgb(var(--border))]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-title">Add Transaction</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={closeAddModal}
                className="p-2 -mr-2 rounded-full hover:bg-[rgb(var(--background-secondary))]"
              >
                <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Type Selector */}
              <div className="flex gap-2 p-1 rounded-2xl bg-[rgb(var(--background-secondary))]">
                {(['INCOME', 'EXPENSE'] as TransactionType[]).map((t) => (
                  <motion.button
                    key={t}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setType(t);
                      setCategory(null);
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium transition-all',
                      type === t
                        ? `${typeColors[t].bg} text-white shadow-lg`
                        : 'text-[rgb(var(--foreground-secondary))]'
                    )}
                  >
                    {t === 'INCOME' ? 'Income' : 'Expense'}
                  </motion.button>
                ))}
              </div>

              {/* Amount Input */}
              <div className="text-center py-6">
                <p className="text-micro mb-2">AMOUNT</p>
                <div className="flex items-center justify-center gap-1">
                  <span className={cn('text-4xl font-bold', currentColors.text)}>
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn(
                      'text-5xl font-bold bg-transparent outline-none w-48 text-center tabular-nums',
                      currentColors.text,
                      'placeholder:text-[rgb(var(--foreground-muted))]'
                    )}
                  />
                </div>
              </div>

              {/* Category Picker */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCategoryPicker(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))]"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg', currentColors.lightBg)}>
                    {category?.icon || '📁'}
                  </div>
                  <span className={cn(
                    'font-medium',
                    category ? 'text-[rgb(var(--foreground))]' : 'text-[rgb(var(--foreground-muted))]'
                  )}>
                    {category?.name || 'Select category'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
              </motion.button>

              {/* Account Picker */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAccountPicker(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary))]/10 flex items-center justify-center">
                    💳
                  </div>
                  <span className={cn(
                    'font-medium',
                    selectedAccount ? 'text-[rgb(var(--foreground))]' : 'text-[rgb(var(--foreground-muted))]'
                  )}>
                    {selectedAccount?.name || 'Select account'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
              </motion.button>

              {/* Description */}
              <div>
                <input
                  type="text"
                  placeholder="Add description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] transition-colors placeholder:text-[rgb(var(--foreground-muted))]"
                />
              </div>

              {/* Date & Recurring Row */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--foreground-muted))]" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 pl-12 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] transition-colors"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={cn(
                    'flex items-center gap-2 px-4 rounded-2xl border transition-colors',
                    isRecurring
                      ? 'bg-[rgb(var(--primary))]/10 border-[rgb(var(--primary))] text-[rgb(var(--primary))]'
                      : 'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border))] text-[rgb(var(--foreground-secondary))]'
                  )}
                >
                  <Repeat className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  'w-full py-4 rounded-2xl font-semibold text-white transition-all',
                  currentColors.bg,
                  isSubmitting && 'opacity-70'
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Adding...</span>
                  </div>
                ) : (
                  `Add ${type === 'INCOME' ? 'Income' : 'Expense'}`
                )}
              </motion.button>
            </div>

            {/* Category Picker Sheet */}
            <CategoryPickerSheet
              isOpen={showCategoryPicker}
              onClose={() => setShowCategoryPicker(false)}
              categories={categories}
              selectedCategory={category}
              onSelect={(cat) => {
                setCategory(cat);
                setShowCategoryPicker(false);
              }}
              type={type}
            />

            {/* Account Picker Sheet */}
            <AccountPickerSheet
              isOpen={showAccountPicker}
              onClose={() => setShowAccountPicker(false)}
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelect={(id) => {
                setSelectedAccountId(id);
                setShowAccountPicker(false);
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Category Picker Sheet Component
function CategoryPickerSheet({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelect,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: Category | null;
  onSelect: (category: Category) => void;
  type: TransactionType;
}) {
  const typeColor = type === 'INCOME' ? 'rgb(var(--income))' : 'rgb(var(--expense))';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute inset-0 bg-[rgb(var(--card))] rounded-t-3xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border))]">
            <h3 className="text-title">Select Category</h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-[rgb(var(--background-secondary))]"
            >
              <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
            </motion.button>
          </div>

          {/* Categories Grid */}
          <div className="p-6 grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(cat)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                  selectedCategory?.id === cat.id
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-transparent bg-[rgb(var(--background-secondary))]'
                )}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-center line-clamp-1">
                  {cat.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Account Picker Sheet Component
function AccountPickerSheet({
  isOpen,
  onClose,
  accounts,
  selectedAccountId,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
  selectedAccountId: string;
  onSelect: (id: string) => void;
}) {
  const { currencySymbol } = useUIStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute inset-0 bg-[rgb(var(--card))] rounded-t-3xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border))]">
            <h3 className="text-title">Select Account</h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-[rgb(var(--background-secondary))]"
            >
              <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
            </motion.button>
          </div>

          {/* Accounts List */}
          <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[rgb(var(--foreground-muted))]">No accounts found</p>
                <p className="text-sm text-[rgb(var(--foreground-muted))] mt-1">
                  Add an account first to track transactions
                </p>
              </div>
            ) : (
              accounts.map((account) => (
                <motion.button
                  key={account.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(account.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
                    selectedAccountId === account.id
                      ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                      : 'border-transparent bg-[rgb(var(--background-secondary))]'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary))]/10 flex items-center justify-center text-xl">
                    💳
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-[rgb(var(--foreground-muted))]">
                      {currencySymbol}{account.balance?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  {account.isDefault && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                      Default
                    </span>
                  )}
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
