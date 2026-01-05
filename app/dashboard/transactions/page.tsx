"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Calendar,
    X,
    ChevronDown
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { getTransactions } from "@/app/actions/transaction";
import type { Transaction, TransactionType } from "@/types";

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

// Extended type that includes account info from getTransactions
type TransactionWithAccount = Transaction & {
    account?: { id: string; name: string; currency: string };
};

export default function TransactionsPage() {
    const { currencySymbol } = useUIStore();
    const [transactions, setTransactions] = useState<TransactionWithAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        async function loadTransactions() {
            setIsLoading(true);
            const result = await getTransactions({ limit: 100 });
            if (result.transactions) {
                setTransactions(result.transactions as TransactionWithAccount[]);
            }
            setIsLoading(false);
        }
        loadTransactions();
    }, []);

    // Filter transactions
    const filteredTransactions = transactions.filter((t) => {
        // Type filter
        if (filterType !== 'all' && t.type.toLowerCase() !== filterType) {
            return false;
        }
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                t.description?.toLowerCase().includes(query) ||
                t.category?.name.toLowerCase().includes(query)
            );
        }
        return true;
    });

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
        const date = format(new Date(transaction.date), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {} as Record<string, Transaction[]>);

    const sortedDates = Object.keys(groupedTransactions).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    return (
        <PageContainer>
            <PageHeader
                title="Transactions"
                subtitle={`${filteredTransactions.length} transactions`}
            />

            {/* Search and Filter */}
            <div className="space-y-3 mb-6">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--foreground-muted))]" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-[rgb(var(--foreground-muted))]" />
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {(['all', 'income', 'expense', 'transfer'] as FilterType[]).map((type) => (
                        <motion.button
                            key={type}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilterType(type)}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors',
                                filterType === type
                                    ? 'bg-[rgb(var(--primary))] text-white'
                                    : 'bg-[rgb(var(--card))] text-[rgb(var(--foreground-secondary))]'
                            )}
                        >
                            {type === 'all' ? 'All' : type}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Transactions List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="card p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--background-secondary))]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-[rgb(var(--background-secondary))] rounded w-1/3" />
                                    <div className="h-3 bg-[rgb(var(--background-secondary))] rounded w-1/2" />
                                </div>
                                <div className="h-5 bg-[rgb(var(--background-secondary))] rounded w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--background-secondary))] flex items-center justify-center">
                        <span className="text-3xl">📝</span>
                    </div>
                    <h3 className="font-medium mb-1">No transactions found</h3>
                    <p className="text-caption">
                        {searchQuery || filterType !== 'all'
                            ? "Try adjusting your filters"
                            : "Start by adding your first transaction"}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map((date) => (
                        <div key={date}>
                            {/* Date Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-[rgb(var(--foreground-muted))]" />
                                <p className="text-sm font-medium text-[rgb(var(--foreground-secondary))]">
                                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                </p>
                            </div>

                            {/* Transactions for this date */}
                            <div className="card overflow-hidden divide-y divide-[rgb(var(--border))]">
                                {groupedTransactions[date].map((transaction, index) => (
                                    <TransactionRow
                                        key={transaction.id}
                                        transaction={transaction}
                                        currencySymbol={currencySymbol}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}

function TransactionRow({
    transaction,
    currencySymbol,
    index,
}: {
    transaction: Transaction;
    currencySymbol: string;
    index: number;
}) {
    const isIncome = transaction.type === 'INCOME';
    const isTransfer = transaction.type === 'TRANSFER';

    const getIcon = () => {
        if (isTransfer) return '↔️';
        return transaction.category?.icon || (isIncome ? '💰' : '📦');
    };

    const getAmountColor = () => {
        if (isTransfer) return 'text-[rgb(var(--foreground-secondary))]';
        return isIncome ? 'text-[rgb(var(--income))]' : 'text-[rgb(var(--expense))]';
    };

    const getAmountPrefix = () => {
        if (isTransfer) return '';
        return isIncome ? '+' : '-';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-4 p-4 hover:bg-[rgb(var(--background-secondary))] transition-colors cursor-pointer"
        >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-[rgb(var(--background-secondary))] flex items-center justify-center text-xl">
                {getIcon()}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                    {transaction.description || transaction.category?.name || 'Transaction'}
                </p>
                <p className="text-sm text-[rgb(var(--foreground-muted))]">
                    {transaction.category?.name || 'Uncategorized'} · {format(new Date(transaction.date), 'h:mm a')}
                </p>
            </div>

            {/* Amount */}
            <div className="text-right">
                <p className={cn('font-semibold tabular-nums text-lg', getAmountColor())}>
                    {getAmountPrefix()}{currencySymbol}{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
            </div>

            {/* Arrow */}
            <div className={cn('p-1.5 rounded-lg', isIncome ? 'bg-[rgb(var(--income))]/10' : 'bg-[rgb(var(--expense))]/10')}>
                {isIncome ? (
                    <ArrowDownLeft className={cn('w-4 h-4', getAmountColor())} />
                ) : (
                    <ArrowUpRight className={cn('w-4 h-4', getAmountColor())} />
                )}
            </div>
        </motion.div>
    );
}
