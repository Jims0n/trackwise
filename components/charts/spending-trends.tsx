'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface TrendData {
    month: string;
    year: number;
    monthNum: number;
    income: number;
    expenses: number;
    savings: number;
}

interface SpendingTrendsChartProps {
    data: TrendData[];
    className?: string;
}

export function SpendingTrendsChart({ data, className }: SpendingTrendsChartProps) {
    const { currencySymbol } = useUIStore();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    const { maxValue, chartData } = useMemo(() => {
        const allValues = data.flatMap(d => [d.income, d.expenses]);
        const max = Math.max(...allValues, 1);

        return {
            maxValue: max,
            chartData: data.map(d => ({
                ...d,
                incomeHeight: (d.income / max) * 100,
                expenseHeight: (d.expenses / max) * 100,
            })),
        };
    }, [data]);

    // Calculate change from first to last month
    const firstMonth = data[0];
    const lastMonth = data[data.length - 1];
    const expenseChange = firstMonth && lastMonth && firstMonth.expenses > 0
        ? ((lastMonth.expenses - firstMonth.expenses) / firstMonth.expenses) * 100
        : 0;

    if (data.length === 0) {
        return (
            <motion.div
                ref={ref}
                className={cn('card p-6', className)}
            >
                <h3 className="text-title mb-4">Spending Trends</h3>
                <div className="text-center py-8">
                    <p className="text-caption">Add transactions to see spending trends</p>
                </div>
            </motion.div>
        );
    }

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return `${currencySymbol}${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${currencySymbol}${(amount / 1000).toFixed(0)}k`;
        return `${currencySymbol}${amount.toFixed(0)}`;
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className={cn('card p-6', className)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-title">Spending Trends</h3>
                    <p className="text-caption">Last {data.length} months</p>
                </div>
                {expenseChange !== 0 && (
                    <div className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium',
                        expenseChange > 0
                            ? 'bg-[rgb(var(--expense))]/10 text-[rgb(var(--expense))]'
                            : 'bg-[rgb(var(--income))]/10 text-[rgb(var(--income))]'
                    )}>
                        {expenseChange > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>{Math.abs(expenseChange).toFixed(0)}%</span>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="flex items-end gap-2 h-40 mb-4">
                {chartData.map((item, index) => (
                    <div key={`${item.month}-${item.year}`} className="flex-1 flex flex-col items-center gap-1">
                        {/* Bars Container */}
                        <div className="w-full flex gap-0.5 items-end h-32">
                            {/* Income Bar */}
                            <motion.div
                                className="flex-1 bg-[rgb(var(--income))] rounded-t-sm min-h-[2px]"
                                initial={{ height: 0 }}
                                animate={isInView ? { height: `${item.incomeHeight}%` } : { height: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            />
                            {/* Expense Bar */}
                            <motion.div
                                className="flex-1 bg-[rgb(var(--expense))] rounded-t-sm min-h-[2px]"
                                initial={{ height: 0 }}
                                animate={isInView ? { height: `${item.expenseHeight}%` } : { height: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 + 0.05 }}
                            />
                        </div>

                        {/* Month Label */}
                        <span className="text-[10px] text-[rgb(var(--foreground-muted))] font-medium">
                            {item.month}
                        </span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-[rgb(var(--border))]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[rgb(var(--income))]" />
                    <span className="text-xs text-[rgb(var(--foreground-secondary))]">Income</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[rgb(var(--expense))]" />
                    <span className="text-xs text-[rgb(var(--foreground-secondary))]">Expenses</span>
                </div>
            </div>

            {/* Summary Stats */}
            {lastMonth && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[rgb(var(--border))]">
                    <div className="text-center">
                        <p className="text-xs text-[rgb(var(--foreground-muted))] mb-1">This Month Income</p>
                        <p className="font-semibold text-[rgb(var(--income))]">
                            {formatAmount(lastMonth.income)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-[rgb(var(--foreground-muted))] mb-1">This Month Expenses</p>
                        <p className="font-semibold text-[rgb(var(--expense))]">
                            {formatAmount(lastMonth.expenses)}
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
