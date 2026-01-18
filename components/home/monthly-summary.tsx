'use client';

import { motion, useInView } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MonthlySummaryProps {
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export function MonthlySummary({
  month,
  year,
  income,
  expenses,
  savings,
  savingsRate,
}: MonthlySummaryProps) {
  const { currencySymbol } = useUIStore();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(1)}k`;
    }
    return `${currencySymbol}${amount.toFixed(0)}`;
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-micro">{month.toUpperCase()} {year}</p>
          <h2 className="text-title mt-1">Cash Flow</h2>
        </div>
        <Link href="/dashboard/insights">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-caption flex items-center gap-1 hover:text-[rgb(var(--primary))] transition-colors"
          >
            Details
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </div>

      {/* Waterfall Visualization */}
      <div className="relative h-32 mb-6">
        <WaterfallChart
          income={income}
          expenses={expenses}
          savings={savings}
          isInView={isInView}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatBlock
          label="Income"
          value={income}
          color="income"
          delay={0.3}
          isInView={isInView}
        />
        <StatBlock
          label="Expenses"
          value={expenses}
          color="expense"
          delay={0.4}
          isInView={isInView}
        />
        <StatBlock
          label="Saved"
          value={savings}
          color={savings >= 0 ? 'savings' : 'expense'}
          delay={0.5}
          isInView={isInView}
        />
      </div>

      {/* Savings Rate Bar */}
      <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption">Savings Rate</span>
          <span className={cn(
            'text-title tabular-nums',
            savingsRate >= 20 ? 'text-[rgb(var(--income))]' :
              savingsRate >= 0 ? 'text-[rgb(var(--foreground))]' :
                'text-[rgb(var(--expense))]'
          )}>
            {savingsRate.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-[rgb(var(--background-secondary))] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: `${Math.min(Math.max(savingsRate, 0), 100)}%` } : { width: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              savingsRate >= 20 ? 'bg-[rgb(var(--income))]' :
                savingsRate >= 0 ? 'bg-[rgb(var(--savings))]' :
                  'bg-[rgb(var(--expense))]'
            )}
          />
        </div>
        {savingsRate >= 20 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1 }}
            className="text-xs text-[rgb(var(--income))] mt-2 flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Great job! You're saving more than 20%
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

// Waterfall Chart Component
function WaterfallChart({
  income,
  expenses,
  savings,
  isInView,
}: {
  income: number;
  expenses: number;
  savings: number;
  isInView: boolean;
}) {
  const { currencySymbol } = useUIStore();
  const maxValue = Math.max(income, expenses, Math.abs(savings));
  const scale = maxValue > 0 ? 100 / maxValue : 1;

  const incomeHeight = income * scale;
  const expenseHeight = expenses * scale;
  const savingsHeight = Math.abs(savings) * scale;

  const formatAmount = (amount: number) => {
    if (Math.abs(amount) >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(1)}k`;
    }
    return `${currencySymbol}${amount.toFixed(0)}`;
  };

  return (
    <div className="flex items-end justify-between h-full px-4">
      {/* Income Bar */}
      <div className="flex flex-col items-center flex-1">
        <motion.div
          className="w-16 bg-[rgb(var(--income))] rounded-t-xl relative"
          initial={{ height: 0 }}
          animate={isInView ? { height: `${incomeHeight}%` } : { height: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-semibold text-[rgb(var(--income))] whitespace-nowrap"
          >
            {formatAmount(income)}
          </motion.span>
        </motion.div>
        <span className="text-micro mt-2">IN</span>
      </div>

      {/* Flow Arrow 1 */}
      <div className="flex items-center px-2 pb-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <ArrowRight className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
        </motion.div>
      </div>

      {/* Expenses Bar */}
      <div className="flex flex-col items-center flex-1">
        <motion.div
          className="w-16 bg-[rgb(var(--expense))] rounded-t-xl relative"
          initial={{ height: 0 }}
          animate={isInView ? { height: `${expenseHeight}%` } : { height: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-semibold text-[rgb(var(--expense))] whitespace-nowrap"
          >
            {formatAmount(expenses)}
          </motion.span>
        </motion.div>
        <span className="text-micro mt-2">OUT</span>
      </div>

      {/* Flow Arrow 2 */}
      <div className="flex items-center px-2 pb-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <ArrowRight className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
        </motion.div>
      </div>

      {/* Savings Bar */}
      <div className="flex flex-col items-center flex-1">
        <motion.div
          className={cn(
            'w-16 rounded-t-xl relative',
            savings >= 0 ? 'bg-[rgb(var(--savings))]' : 'bg-[rgb(var(--expense))]'
          )}
          initial={{ height: 0 }}
          animate={isInView ? { height: `${savingsHeight}%` } : { height: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className={cn(
              'absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-semibold whitespace-nowrap',
              savings >= 0 ? 'text-[rgb(var(--savings))]' : 'text-[rgb(var(--expense))]'
            )}
          >
            {savings >= 0 ? '+' : ''}{formatAmount(savings)}
          </motion.span>
        </motion.div>
        <span className="text-micro mt-2">SAVED</span>
      </div>
    </div>
  );
}

// Stat Block Component
function StatBlock({
  label,
  value,
  color,
  delay,
  isInView,
}: {
  label: string;
  value: number;
  color: 'income' | 'expense' | 'savings';
  delay: number;
  isInView: boolean;
}) {
  const { currencySymbol } = useUIStore();

  const colorClasses = {
    income: 'text-[rgb(var(--income))]',
    expense: 'text-[rgb(var(--expense))]',
    savings: 'text-[rgb(var(--savings))]',
  };

  const bgClasses = {
    income: 'bg-[rgb(var(--income))]/10',
    expense: 'bg-[rgb(var(--expense))]/10',
    savings: 'bg-[rgb(var(--savings))]/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('rounded-xl p-3 text-center', bgClasses[color])}
    >
      <p className="text-micro mb-1">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums', colorClasses[color])}>
        {currencySymbol}{value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </p>
    </motion.div>
  );
}
