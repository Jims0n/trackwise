'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Calendar, DollarSign, TrendingUp, Store } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface SpendingPatternsData {
    transactionCount: number;
    avgTransaction: number;
    peakSpendingDay: string;
    peakSpendingAmount: number;
    byDayOfWeek: Array<{ day: string; count: number; amount: number }>;
    topMerchants: Array<{ merchant: string; count: number }>;
}

interface SpendingPatternsProps {
    data: SpendingPatternsData | null;
    className?: string;
}

export function SpendingPatterns({ data, className }: SpendingPatternsProps) {
    const { currencySymbol } = useUIStore();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    if (!data) {
        return (
            <motion.div
                ref={ref}
                className={cn('card p-6', className)}
            >
                <h3 className="text-title mb-4">Spending Patterns</h3>
                <div className="text-center py-8">
                    <p className="text-caption">Add more transactions to see patterns</p>
                </div>
            </motion.div>
        );
    }

    const formatAmount = (amount: number) => {
        return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Normalize day of week data for mini bar chart
    const maxDayAmount = Math.max(...data.byDayOfWeek.map(d => d.amount), 1);
    const sortedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const orderedDays = sortedDays.map(day =>
        data.byDayOfWeek.find(d => d.day === day) || { day, count: 0, amount: 0 }
    );

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className={cn('card p-6', className)}
        >
            <h3 className="text-title mb-6">Spending Patterns</h3>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-3 rounded-xl bg-[rgb(var(--background-secondary))]"
                >
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[rgb(var(--primary))]" />
                    </div>
                    <p className="text-lg font-bold">{data.transactionCount}</p>
                    <p className="text-[10px] text-[rgb(var(--foreground-muted))]">Transactions</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-3 rounded-xl bg-[rgb(var(--background-secondary))]"
                >
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[rgb(var(--expense))]/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-[rgb(var(--expense))]" />
                    </div>
                    <p className="text-lg font-bold">{formatAmount(data.avgTransaction)}</p>
                    <p className="text-[10px] text-[rgb(var(--foreground-muted))]">Avg Spend</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                    transition={{ delay: 0.3 }}
                    className="text-center p-3 rounded-xl bg-[rgb(var(--background-secondary))]"
                >
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[rgb(var(--secondary))]/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[rgb(var(--secondary))]" />
                    </div>
                    <p className="text-lg font-bold">{data.peakSpendingDay}</p>
                    <p className="text-[10px] text-[rgb(var(--foreground-muted))]">Peak Day</p>
                </motion.div>
            </div>

            {/* Spending by Day of Week */}
            <div className="mb-6">
                <p className="text-sm font-medium mb-3">Spending by Day</p>
                <div className="flex items-end gap-1 h-16">
                    {orderedDays.map((day, index) => {
                        const heightPercent = (day.amount / maxDayAmount) * 100;
                        const isPeak = day.day === data.peakSpendingDay;

                        return (
                            <div key={day.day} className="flex-1 flex flex-col items-center">
                                <motion.div
                                    className={cn(
                                        'w-full rounded-t-sm min-h-[4px]',
                                        isPeak
                                            ? 'bg-[rgb(var(--expense))]'
                                            : 'bg-[rgb(var(--foreground))]/20'
                                    )}
                                    initial={{ height: 0 }}
                                    animate={isInView ? { height: `${Math.max(heightPercent, 8)}%` } : { height: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                />
                                <span className={cn(
                                    'text-[9px] mt-1',
                                    isPeak ? 'text-[rgb(var(--expense))] font-bold' : 'text-[rgb(var(--foreground-muted))]'
                                )}>
                                    {day.day.slice(0, 1)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Merchants */}
            {data.topMerchants.length > 0 && (
                <div>
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Store className="w-4 h-4 text-[rgb(var(--foreground-muted))]" />
                        Frequent Merchants
                    </p>
                    <div className="space-y-2">
                        {data.topMerchants.slice(0, 3).map((merchant, index) => (
                            <motion.div
                                key={merchant.merchant}
                                initial={{ opacity: 0, x: -10 }}
                                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-[rgb(var(--background-secondary))]"
                            >
                                <span className="text-sm capitalize truncate flex-1">{merchant.merchant}</span>
                                <span className="text-xs text-[rgb(var(--foreground-muted))] ml-2">
                                    {merchant.count}x
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
