'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types';
import Link from 'next/link';

interface RecentTransactionsProps {
  transactions: Transaction[];
  limit?: number;
}

export function RecentTransactions({ transactions, limit = 5 }: RecentTransactionsProps) {
  const displayTransactions = transactions.slice(0, limit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-micro">RECENT ACTIVITY</p>
        <Link href="/dashboard/transactions">
          <motion.button
            whileHover={{ x: 3 }}
            className="text-caption flex items-center gap-1 hover:text-[rgb(var(--primary))] transition-colors"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </div>

      {/* Transaction List */}
      <div className="card overflow-hidden divide-y divide-[rgb(var(--border))]">
        {displayTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          displayTransactions.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              index={index}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

function TransactionRow({
  transaction,
  index,
}: {
  transaction: Transaction;
  index: number;
}) {
  const { currencySymbol } = useUIStore();
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  const getIcon = () => {
    if (isTransfer) return '↔️';
    return transaction.category?.icon || (isIncome ? '💰' : '📦');
  };

  const getAmountColor = () => {
    if (isTransfer) return 'text-[rgb(var(--transfer))]';
    return isIncome ? 'text-[rgb(var(--income))]' : 'text-[rgb(var(--expense))]';
  };

  const getAmountPrefix = () => {
    if (isTransfer) return '';
    return isIncome ? '+' : '-';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ backgroundColor: 'rgb(var(--card-hover))' }}
      className="flex items-center gap-4 p-4 cursor-pointer transition-colors"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-[rgb(var(--background-secondary))] flex items-center justify-center text-lg">
        {getIcon()}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[rgb(var(--foreground))] truncate">
          {transaction.description || transaction.category?.name || 'Transaction'}
        </p>
        <p className="text-xs text-[rgb(var(--foreground-muted))] mt-0.5">
          {transaction.category?.name || 'Uncategorized'} · {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className={cn('font-semibold tabular-nums', getAmountColor())}>
          {getAmountPrefix()}{currencySymbol}{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
              </div>

      {/* Arrow indicator */}
      <div className={cn('p-1', getAmountColor())}>
        {isIncome ? (
          <ArrowDownLeft className="w-4 h-4" />
        ) : (
          <ArrowUpRight className="w-4 h-4" />
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-12 px-6 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--background-secondary))] flex items-center justify-center">
        <span className="text-3xl">📝</span>
      </div>
      <h3 className="font-medium text-[rgb(var(--foreground))] mb-1">
        No transactions yet
      </h3>
      <p className="text-caption">
        Start by adding your first income or expense
      </p>
    </motion.div>
  );
}

// Compact transaction item for smaller spaces
export function TransactionItem({
  transaction,
  onClick,
}: {
  transaction: Transaction;
  onClick?: () => void;
}) {
  const { currencySymbol } = useUIStore();
  const isIncome = transaction.type === 'INCOME';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[rgb(var(--background-secondary))] transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-[rgb(var(--background-secondary))] flex items-center justify-center text-sm">
        {transaction.category?.icon || (isIncome ? '💰' : '📦')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {transaction.description || transaction.category?.name || 'Transaction'}
        </p>
      </div>
      <p className={cn(
        'text-sm font-semibold tabular-nums',
        isIncome ? 'text-[rgb(var(--income))]' : 'text-[rgb(var(--expense))]'
      )}>
        {isIncome ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
      </p>
    </motion.button>
  );
}
