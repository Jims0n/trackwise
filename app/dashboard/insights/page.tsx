"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useDemoData } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";

type TimeRange = 'week' | 'month' | 'year';

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { currencySymbol } = useUIStore();
  const { monthlyFlow, recentTransactions } = useDemoData();

  // Calculate spending by category
  const categorySpending = monthlyFlow?.byCategory || [];
  const totalExpenses = monthlyFlow?.expenses || 0;
  const totalIncome = monthlyFlow?.income || 0;
  const savingsRate = monthlyFlow?.savingsRate || 0;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader 
        title="Insights" 
        subtitle="Understand your spending habits"
      />

      {/* Time Range Selector */}
      <div className="flex gap-2 p-1 rounded-2xl bg-[rgb(var(--background-secondary))] mb-6">
        {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
          <motion.button
            key={range}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTimeRange(range)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all',
              timeRange === range
                ? 'bg-[rgb(var(--card))] shadow-sm text-[rgb(var(--foreground))]'
                : 'text-[rgb(var(--foreground-muted))]'
            )}
          >
            {range}
          </motion.button>
        ))}
      </div>

      <StaggerContainer className="space-y-6">
        {/* Summary Cards */}
        <StaggerItem>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              title="Income"
              amount={totalIncome}
              icon={<TrendingUp className="w-4 h-4" />}
              color="income"
              currencySymbol={currencySymbol}
            />
            <SummaryCard
              title="Expenses"
              amount={totalExpenses}
              icon={<TrendingDown className="w-4 h-4" />}
              color="expense"
              currencySymbol={currencySymbol}
            />
          </div>
        </StaggerItem>

        {/* Savings Rate Card */}
        <StaggerItem>
          <motion.div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-micro">SAVINGS RATE</p>
              <span className={cn(
                'text-2xl font-bold tabular-nums',
                savingsRate >= 20 ? 'text-[rgb(var(--income))]' : 
                savingsRate >= 0 ? 'text-[rgb(var(--foreground))]' : 
                'text-[rgb(var(--expense))]'
              )}>
                {savingsRate.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-[rgb(var(--background-secondary))] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  savingsRate >= 20 ? 'bg-[rgb(var(--income))]' : 
                  savingsRate >= 0 ? 'bg-[rgb(var(--savings))]' : 
                  'bg-[rgb(var(--expense))]'
                )}
              />
            </div>
            <p className="text-caption mt-3">
              {savingsRate >= 20 
                ? "🎉 Great job! You're saving more than the recommended 20%"
                : savingsRate >= 0 
                ? "💡 Try to save at least 20% of your income"
                : "⚠️ You're spending more than you earn this month"
              }
            </p>
          </motion.div>
        </StaggerItem>

        {/* Spending by Category */}
        <StaggerItem>
          <motion.div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-[rgb(var(--primary))]" />
              <h3 className="text-title">Spending by Category</h3>
            </div>

            {categorySpending.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-caption">No spending data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categorySpending.map((cat, index) => (
                  <CategoryBar
                    key={cat.category}
                    category={cat.category}
                    icon={cat.icon}
                    amount={cat.amount}
                    percentage={cat.percentage}
                    transactions={cat.transactionCount}
                    currencySymbol={currencySymbol}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </StaggerItem>

        {/* Monthly Comparison */}
        <StaggerItem>
          <motion.div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[rgb(var(--secondary))]" />
              <h3 className="text-title">This Month vs Last Month</h3>
            </div>

            <div className="space-y-4">
              <ComparisonRow
                label="Income"
                current={totalIncome}
                previous={totalIncome * 0.95}
                color="income"
                currencySymbol={currencySymbol}
              />
              <ComparisonRow
                label="Expenses"
                current={totalExpenses}
                previous={totalExpenses * 1.1}
                color="expense"
                currencySymbol={currencySymbol}
                invertChange
              />
            </div>
          </motion.div>
        </StaggerItem>

        {/* Top Merchants (placeholder) */}
        <StaggerItem>
          <motion.div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title">Top Merchants</h3>
              <span className="text-caption">This month</span>
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'Grocery Store', amount: 245.50, count: 8 },
                { name: 'Amazon', amount: 189.99, count: 5 },
                { name: 'Coffee Shop', amount: 67.80, count: 14 },
                { name: 'Gas Station', amount: 156.00, count: 4 },
              ].map((merchant, index) => (
                <div key={merchant.name} className="flex items-center gap-3">
                  <span className="text-micro w-6">{index + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{merchant.name}</p>
                    <p className="text-xs text-[rgb(var(--foreground-muted))]">
                      {merchant.count} transactions
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {currencySymbol}{merchant.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </StaggerItem>
      </StaggerContainer>
    </PageContainer>
  );
}

function SummaryCard({
  title,
  amount,
  icon,
  color,
  currencySymbol,
}: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: 'income' | 'expense';
  currencySymbol: string;
}) {
  const colorClasses = {
    income: {
      bg: 'bg-[rgb(var(--income))]/10',
      text: 'text-[rgb(var(--income))]',
    },
    expense: {
      bg: 'bg-[rgb(var(--expense))]/10',
      text: 'text-[rgb(var(--expense))]',
    },
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="card p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1.5 rounded-lg', colorClasses[color].bg, colorClasses[color].text)}>
          {icon}
        </div>
        <span className="text-micro">{title.toUpperCase()}</span>
      </div>
      <p className={cn('text-xl font-bold tabular-nums', colorClasses[color].text)}>
        {currencySymbol}{amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
      </p>
    </motion.div>
  );
}

function CategoryBar({
  category,
  icon,
  amount,
  percentage,
  transactions,
  currencySymbol,
  delay,
}: {
  category: string;
  icon: string;
  amount: number;
  percentage: number;
  transactions: number;
  currencySymbol: string;
  delay: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium">{category}</span>
        </div>
        <div className="text-right">
          <p className="font-semibold tabular-nums">
            {currencySymbol}{amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-[rgb(var(--foreground-muted))]">
            {percentage.toFixed(0)}% · {transactions} txns
          </p>
        </div>
      </div>
      <div className="h-2 bg-[rgb(var(--background-secondary))] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className="h-full bg-[rgb(var(--expense))] rounded-full"
        />
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  color,
  currencySymbol,
  invertChange = false,
}: {
  label: string;
  current: number;
  previous: number;
  color: 'income' | 'expense';
  currencySymbol: string;
  invertChange?: boolean;
}) {
  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : 0;
  const isPositive = invertChange ? change < 0 : change > 0;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-[rgb(var(--foreground-muted))]">
          vs {currencySymbol}{previous.toLocaleString('en-US', { minimumFractionDigits: 0 })} last month
        </p>
      </div>
      <div className="text-right">
        <p className={cn(
          'font-semibold tabular-nums',
          color === 'income' ? 'text-[rgb(var(--income))]' : 'text-[rgb(var(--expense))]'
        )}>
          {currencySymbol}{current.toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </p>
        <p className={cn(
          'text-sm tabular-nums',
          isPositive ? 'text-[rgb(var(--income))]' : 'text-[rgb(var(--expense))]'
        )}>
          {isPositive ? '+' : ''}{changePercent.toFixed(0)}%
        </p>
      </div>
    </div>
  );
}
