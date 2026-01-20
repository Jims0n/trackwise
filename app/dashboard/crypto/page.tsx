"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Plus,
    AlertTriangle,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { getCryptoSummary, syncWalletData } from "@/app/actions/crypto";
import { AddWalletModal } from "@/components/crypto/add-wallet-modal";
import { PositionsTable } from "@/components/crypto/positions-table";
import { BalancesCard } from "@/components/crypto/balances-card";
import type { CryptoSummary, CryptoWallet, PerpPosition } from "@/types/crypto";

export default function CryptoPage() {
    const [summary, setSummary] = useState<CryptoSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = async () => {
        const result = await getCryptoSummary();
        if (result.summary) {
            setSummary(result.summary);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        if (!summary?.wallets?.length) return;

        setIsSyncing(true);
        try {
            for (const wallet of summary.wallets) {
                await syncWalletData(wallet.id);
            }
            await loadData();
            toast.success("Wallets synced successfully");
        } catch (error) {
            toast.error("Failed to sync wallets");
        }
        setIsSyncing(false);
    };

    const handleWalletAdded = async () => {
        setShowAddModal(false);
        await loadData();
        toast.success("Wallet added successfully");
    };

    // Collect all positions from all wallets
    const allPositions: (PerpPosition & { walletLabel?: string })[] = [];
    summary?.wallets?.forEach((wallet) => {
        wallet.positions?.forEach((pos) => {
            allPositions.push({
                ...pos,
                walletLabel: wallet.label || wallet.address.slice(0, 8) + "...",
            });
        });
    });

    return (
        <PageContainer>
            <PageHeader
                title="Crypto"
                subtitle="Track your perpetual positions"
                action={
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSync}
                            disabled={isSyncing || !summary?.wallets?.length}
                            className="p-2 rounded-xl bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--border))] transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddModal(true)}
                            className="p-2 rounded-xl bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity"
                        >
                            <Plus className="w-5 h-5" />
                        </motion.button>
                    </div>
                }
            />

            {/* Risk Warning */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 rounded-xl bg-[rgb(var(--expense))]/10 border border-[rgb(var(--expense))]/20 flex items-start gap-3"
            >
                <AlertTriangle className="w-5 h-5 text-[rgb(var(--expense))] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[rgb(var(--expense))]">
                    <strong>Volatile Assets:</strong> Crypto perpetuals are high-risk. This is read-only monitoring—no trading execution.
                </p>
            </motion.div>

            {isLoading ? (
                <LoadingSkeleton />
            ) : !summary?.wallets?.length ? (
                <EmptyState onAddWallet={() => setShowAddModal(true)} />
            ) : (
                <StaggerContainer className="space-y-6">
                    {/* Summary Cards */}
                    <StaggerItem>
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryCard
                                label="Total Balance"
                                value={`$${summary.totalBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                icon={<Wallet className="w-5 h-5" />}
                            />
                            <SummaryCard
                                label="Unrealized PnL"
                                value={`${summary.totalUnrealizedPnl >= 0 ? '+' : ''}$${summary.totalUnrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                icon={summary.totalUnrealizedPnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                variant={summary.totalUnrealizedPnl >= 0 ? 'positive' : 'negative'}
                            />
                        </div>
                    </StaggerItem>

                    {/* Positions Table */}
                    {allPositions.length > 0 && (
                        <StaggerItem>
                            <div className="card p-4">
                                <h3 className="text-title mb-4">Open Positions ({allPositions.length})</h3>
                                <PositionsTable positions={allPositions} />
                            </div>
                        </StaggerItem>
                    )}

                    {/* Wallets & Balances */}
                    <StaggerItem>
                        <h3 className="text-title mb-4">Wallets</h3>
                        <div className="space-y-4">
                            {summary.wallets.map((wallet) => (
                                <BalancesCard
                                    key={wallet.id}
                                    wallet={wallet}
                                    onRefresh={loadData}
                                />
                            ))}
                        </div>
                    </StaggerItem>
                </StaggerContainer>
            )}

            {/* Add Wallet Modal */}
            <AddWalletModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleWalletAdded}
            />
        </PageContainer>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    variant = 'neutral'
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    variant?: 'positive' | 'negative' | 'neutral';
}) {
    const variantStyles = {
        positive: 'text-[rgb(var(--income))]',
        negative: 'text-[rgb(var(--expense))]',
        neutral: 'text-[rgb(var(--foreground))]',
    };

    return (
        <div className="card p-4">
            <div className="flex items-center gap-2 text-[rgb(var(--foreground-muted))] mb-2">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <p className={cn("text-xl font-semibold tabular-nums", variantStyles[variant])}>
                {value}
            </p>
        </div>
    );
}

function EmptyState({ onAddWallet }: { onAddWallet: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 text-center"
        >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--background-secondary))] flex items-center justify-center">
                <Wallet className="w-8 h-8 text-[rgb(var(--foreground-muted))]" />
            </div>
            <h3 className="text-title mb-2">No wallets connected</h3>
            <p className="text-caption mb-6">Add a wallet to track your perpetual positions</p>
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onAddWallet}
                className="px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-white font-medium"
            >
                Add Wallet
            </motion.button>
        </motion.div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 animate-pulse">
                    <div className="h-4 bg-[rgb(var(--background-secondary))] rounded w-24 mb-2" />
                    <div className="h-6 bg-[rgb(var(--background-secondary))] rounded w-32" />
                </div>
                <div className="card p-4 animate-pulse">
                    <div className="h-4 bg-[rgb(var(--background-secondary))] rounded w-24 mb-2" />
                    <div className="h-6 bg-[rgb(var(--background-secondary))] rounded w-32" />
                </div>
            </div>
            <div className="card p-4 animate-pulse">
                <div className="h-5 bg-[rgb(var(--background-secondary))] rounded w-40 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-[rgb(var(--background-secondary))] rounded" />
                    ))}
                </div>
            </div>
        </div>
    );
}
