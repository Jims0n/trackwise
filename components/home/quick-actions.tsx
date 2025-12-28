'use client';

import { motion } from 'framer-motion';
import { Plus, Minus, ArrowLeftRight, Receipt, Target, CreditCard } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Plus;
  color: 'income' | 'expense' | 'transfer' | 'neutral';
  action: () => void;
}

export function QuickActions() {
  const { openAddModal } = useUIStore();

  const actions: QuickAction[] = [
    {
      id: 'income',
      label: 'Income',
      icon: Plus,
      color: 'income',
      action: () => openAddModal('INCOME'),
    },
    {
      id: 'expense',
      label: 'Expense',
      icon: Minus,
      color: 'expense',
      action: () => openAddModal('EXPENSE'),
    },
  ];

  const colorClasses = {
    income: {
      bg: 'bg-[rgb(var(--income))]/10',
      text: 'text-[rgb(var(--income))]',
      border: 'border-[rgb(var(--income))]/20',
      hover: 'hover:bg-[rgb(var(--income))]/20',
    },
    expense: {
      bg: 'bg-[rgb(var(--expense))]/10',
      text: 'text-[rgb(var(--expense))]',
      border: 'border-[rgb(var(--expense))]/20',
      hover: 'hover:bg-[rgb(var(--expense))]/20',
    },
    transfer: {
      bg: 'bg-[rgb(var(--transfer))]/10',
      text: 'text-[rgb(var(--transfer))]',
      border: 'border-[rgb(var(--transfer))]/20',
      hover: 'hover:bg-[rgb(var(--transfer))]/20',
    },
    neutral: {
      bg: 'bg-[rgb(var(--background-secondary))]',
      text: 'text-[rgb(var(--foreground))]',
      border: 'border-[rgb(var(--border))]',
      hover: 'hover:bg-[rgb(var(--background-secondary))]',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="py-4"
    >
      <p className="text-micro mb-3">QUICK ACTIONS</p>
      
      <div className="flex gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colors = colorClasses[action.color];

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border transition-colors',
                colors.bg,
                colors.border,
                colors.hover
              )}
            >
              <div className={cn('p-2 rounded-xl', colors.bg)}>
                <Icon className={cn('w-5 h-5', colors.text)} strokeWidth={2.5} />
              </div>
              <span className={cn('text-sm font-medium', colors.text)}>
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Horizontal scrollable quick actions (alternative layout)
export function QuickActionsScroll() {
  const { openAddModal } = useUIStore();

  const actions = [
    { id: 'income', label: 'Add Income', icon: Plus, color: 'income' as const },
    { id: 'expense', label: 'Add Expense', icon: Minus, color: 'expense' as const },
    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'transfer' as const },
    { id: 'receipt', label: 'Scan Receipt', icon: Receipt, color: 'neutral' as const },
    { id: 'goal', label: 'New Goal', icon: Target, color: 'neutral' as const },
    { id: 'card', label: 'Add Card', icon: CreditCard, color: 'neutral' as const },
  ];

  const handleAction = (id: string) => {
    switch (id) {
      case 'income':
        openAddModal('INCOME');
        break;
      case 'expense':
        openAddModal('EXPENSE');
        break;
      case 'transfer':
        openAddModal('TRANSFER');
        break;
      // Add other actions as needed
    }
  };

  const colorClasses = {
    income: 'bg-[rgb(var(--income))]/10 text-[rgb(var(--income))]',
    expense: 'bg-[rgb(var(--expense))]/10 text-[rgb(var(--expense))]',
    transfer: 'bg-[rgb(var(--transfer))]/10 text-[rgb(var(--transfer))]',
    neutral: 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--foreground-secondary))]',
  };

  return (
    <div className="py-4 -mx-4">
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(action.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all',
                colorClasses[action.color],
                'hover:opacity-80 active:scale-95'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
