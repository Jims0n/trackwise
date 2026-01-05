'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface FlowData {
    income: { source: string; amount: number; color: string }[];
    expenses: { category: string; amount: number; color: string; icon: string }[];
}

interface MoneyFlowSankeyProps {
    data: FlowData;
    className?: string;
}

const DEFAULT_COLORS = {
    income: ['#10B981', '#14B8A6', '#06B6D4', '#3B82F6'],
    expense: ['#F43F5E', '#EC4899', '#F97316', '#EAB308', '#8B5CF6', '#6366F1'],
};

export function MoneyFlowSankey({ data, className }: MoneyFlowSankeyProps) {
    const { currencySymbol } = useUIStore();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    const totalIncome = useMemo(() =>
        data.income.reduce((sum, i) => sum + i.amount, 0),
        [data.income]
    );

    const totalExpenses = useMemo(() =>
        data.expenses.reduce((sum, e) => sum + e.amount, 0),
        [data.expenses]
    );

    const savings = totalIncome - totalExpenses;

    if (data.income.length === 0 && data.expenses.length === 0) {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                className={cn('card p-6', className)}
            >
                <h3 className="text-title mb-4">Money Flow</h3>
                <div className="text-center py-8">
                    <p className="text-caption">Add income and expenses to see your money flow</p>
                </div>
            </motion.div>
        );
    }

    const formatAmount = (amount: number) => {
        if (Math.abs(amount) >= 1000) {
            return `${currencySymbol}${(amount / 1000).toFixed(1)}k`;
        }
        return `${currencySymbol}${amount.toFixed(0)}`;
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className={cn('card p-6', className)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-title">Money Flow</h3>
                <span className="text-micro">THIS MONTH</span>
            </div>

            {/* Sankey Diagram */}
            <div className="relative h-[280px]">
                <svg
                    viewBox="0 0 400 280"
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Gradients for flows */}
                        {data.income.map((income, i) => (
                            <linearGradient
                                key={`income-grad-${i}`}
                                id={`income-grad-${i}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop offset="0%" stopColor={income.color || DEFAULT_COLORS.income[i % 4]} stopOpacity="0.8" />
                                <stop offset="100%" stopColor={income.color || DEFAULT_COLORS.income[i % 4]} stopOpacity="0.3" />
                            </linearGradient>
                        ))}
                        {data.expenses.map((expense, i) => (
                            <linearGradient
                                key={`expense-grad-${i}`}
                                id={`expense-grad-${i}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                                <stop offset="100%" stopColor={expense.color || DEFAULT_COLORS.expense[i % 6]} stopOpacity="0.8" />
                            </linearGradient>
                        ))}
                        {/* Savings gradient */}
                        <linearGradient id="savings-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>

                    {/* Income flows to center */}
                    {data.income.map((income, i) => {
                        const incomeY = 40 + (i * 200 / Math.max(data.income.length, 1));
                        const heightRatio = income.amount / totalIncome;
                        const flowHeight = Math.max(8, heightRatio * 60);

                        return (
                            <motion.g key={`income-${i}`}>
                                {/* Flow path */}
                                <motion.path
                                    d={`M 60 ${incomeY} 
                      C 120 ${incomeY}, 140 140, 160 140`}
                                    fill="none"
                                    stroke={`url(#income-grad-${i})`}
                                    strokeWidth={flowHeight}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                                    transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                                />
                                {/* Source label */}
                                <motion.text
                                    x="10"
                                    y={incomeY + 4}
                                    className="text-[11px] fill-[rgb(var(--foreground))] font-medium"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                >
                                    {income.source.length > 10 ? income.source.slice(0, 10) + '…' : income.source}
                                </motion.text>
                            </motion.g>
                        );
                    })}

                    {/* Center node (Total) */}
                    <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                    >
                        <rect
                            x="160"
                            y="100"
                            width="80"
                            height="80"
                            rx="16"
                            className="fill-[rgb(var(--secondary))]"
                        />
                        <text
                            x="200"
                            y="135"
                            textAnchor="middle"
                            className="text-[10px] fill-white font-medium opacity-80"
                        >
                            TOTAL
                        </text>
                        <text
                            x="200"
                            y="155"
                            textAnchor="middle"
                            className="text-[14px] fill-white font-bold"
                        >
                            {formatAmount(totalIncome)}
                        </text>
                    </motion.g>

                    {/* Expense flows from center */}
                    {data.expenses.slice(0, 5).map((expense, i) => {
                        const expenseY = 30 + (i * 200 / Math.max(data.expenses.length, 1));
                        const heightRatio = expense.amount / totalExpenses;
                        const flowHeight = Math.max(6, heightRatio * 50);

                        return (
                            <motion.g key={`expense-${i}`}>
                                {/* Flow path */}
                                <motion.path
                                    d={`M 240 140 
                      C 260 140, 280 ${expenseY}, 340 ${expenseY}`}
                                    fill="none"
                                    stroke={`url(#expense-grad-${i})`}
                                    strokeWidth={flowHeight}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                                    transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                                />
                                {/* Category label */}
                                <motion.text
                                    x="350"
                                    y={expenseY + 4}
                                    className="text-[10px] fill-[rgb(var(--foreground-secondary))]"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                >
                                    {expense.icon} {formatAmount(expense.amount)}
                                </motion.text>
                            </motion.g>
                        );
                    })}

                    {/* Savings flow (if positive) */}
                    {savings > 0 && (
                        <motion.g>
                            <motion.path
                                d={`M 240 140 
                    C 280 140, 300 250, 340 250`}
                                fill="none"
                                stroke="url(#savings-grad)"
                                strokeWidth={Math.max(8, (savings / totalIncome) * 40)}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                                transition={{ duration: 1, delay: 1 }}
                            />
                            <motion.text
                                x="350"
                                y="254"
                                className="text-[11px] fill-[rgb(var(--income))] font-semibold"
                                initial={{ opacity: 0, x: 10 }}
                                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                                transition={{ delay: 1.2 }}
                            >
                                💰 {formatAmount(savings)}
                            </motion.text>
                        </motion.g>
                    )}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[rgb(var(--border))]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[rgb(var(--income))]" />
                    <span className="text-xs text-[rgb(var(--foreground-secondary))]">Income</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[rgb(var(--expense))]" />
                    <span className="text-xs text-[rgb(var(--foreground-secondary))]">Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[rgb(var(--savings))]" />
                    <span className="text-xs text-[rgb(var(--foreground-secondary))]">Savings</span>
                </div>
            </div>
        </motion.div>
    );
}
