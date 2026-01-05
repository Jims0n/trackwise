"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, PieChart, BarChart3, Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { AIInsights } from "@/components/ai";
import { SpendingTrendsChart, SpendingPatterns } from "@/components/charts";
import {
  getTransactionStats,
  getMonthlyTrends,
  getComparisonStats,
  getSpendingPatterns
} from "@/app/actions/transaction";

type TimeRange = 'week' | 'month' | 'year';

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { currencySymbol } = useUIStore();
  const { isLoading } = useDashboardData();

  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Data states
  const [stats, setStats] = useState<{
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    byCategory: Array<{
      categoryId: string;
      category: string;
      icon: string;
      color: string;
      amount: number;
      percentage: number;
      transactionCount: number;
    }>;
  } | null>(null);

  const [trends, setTrends] = useState<Array<{
    month: string;
    year: number;
    monthNum: number;
    income: number;
    expenses: number;
    savings: number;
  }>>([]);

  const [comparison, setComparison] = useState<{
    current: { income: number; expenses: number };
    previous: { income: number; expenses: number };
    changes: { income: number; expenses: number };
  } | null>(null);

  const [patterns, setPatterns] = useState<{
    transactionCount: number;
    avgTransaction: number;
    peakSpendingDay: string;
    peakSpendingAmount: number;
    byDayOfWeek: Array<{ day: string; count: number; amount: number }>;
    topMerchants: Array<{ merchant: string; count: number }>;
  } | null>(null);

  // Fetch all data when time range changes
  useEffect(() => {
    async function loadData() {
      setIsLoadingStats(true);

      const [statsResult, trendsResult, comparisonResult, patternsResult] = await Promise.all([
        getTransactionStats(timeRange),
        getMonthlyTrends(6),
        getComparisonStats(timeRange),
        getSpendingPatterns(),
      ]);

      if (!statsResult.error) {
        setStats({
          income: statsResult.income || 0,
          expenses: statsResult.expenses || 0,
          savings: statsResult.savings || 0,
          savingsRate: statsResult.savingsRate || 0,
          byCategory: statsResult.byCategory || [],
        });
      }

      if (!trendsResult.error && trendsResult.trends) {
        setTrends(trendsResult.trends);
      }

      if (!comparisonResult.error && comparisonResult.current) {
        setComparison({
          current: comparisonResult.current,
          previous: comparisonResult.previous!,
          changes: comparisonResult.changes!,
        });
      }

      if (!patternsResult.error && patternsResult.patterns) {
        setPatterns(patternsResult.patterns);
      }

      setIsLoadingStats(false);
    }
    loadData();
  }, [timeRange]);

  const categorySpending = stats?.byCategory || [];
  const totalExpenses = stats?.expenses ?? 0;
  const totalIncome = stats?.income ?? 0;
  const savingsRate = stats?.savingsRate ?? 0;

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
        {/* AI Insights Section */}
        <StaggerItem>
          <AIInsights />
        </StaggerItem>

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

        {/* Spending Trends Chart */}
        <StaggerItem>
          <SpendingTrendsChart data={trends} />
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

        {/* Monthly Comparison - Now with Real Data */}
        {comparison && (
          <StaggerItem>
            <motion.div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-[rgb(var(--secondary))]" />
                <h3 className="text-title">
                  {timeRange === 'week' ? 'This Week vs Last Week' :
                    timeRange === 'year' ? 'This Year vs Last Year' :
                      'This Month vs Last Month'}
                </h3>
              </div>

              <div className="space-y-4">
                <ComparisonRow
                  label="Income"
                  current={comparison.current.income}
                  previous={comparison.previous.income}
                  changePercent={comparison.changes.income}
                  color="income"
                  currencySymbol={currencySymbol}
                />
                <ComparisonRow
                  label="Expenses"
                  current={comparison.current.expenses}
                  previous={comparison.previous.expenses}
                  changePercent={comparison.changes.expenses}
                  color="expense"
                  currencySymbol={currencySymbol}
                  invertChange
                />
              </div>
            </motion.div>
          </StaggerItem>
        )}

        {/* Spending Patterns */}
        <StaggerItem>
          <SpendingPatterns data={patterns} />
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
  changePercent,
  color,
  currencySymbol,
  invertChange = false,
}: {
  label: string;
  current: number;
  previous: number;
  changePercent: number;
  color: 'income' | 'expense';
  currencySymbol: string;
  invertChange?: boolean;
}) {
  const isPositive = invertChange ? changePercent < 0 : changePercent > 0;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-[rgb(var(--foreground-muted))]">
          vs {currencySymbol}{previous.toLocaleString('en-US', { minimumFractionDigits: 0 })} prev
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
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(0)}%
        </p>
      </div>
    </div>
  );
}
