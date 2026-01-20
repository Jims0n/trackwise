"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { syncWalletData, removeCryptoWallet } from "@/app/actions/crypto";
import type { CryptoWallet } from "@/types/crypto";

interface BalancesCardProps {
    wallet: CryptoWallet;
    onRefresh: () => void;
}

export function BalancesCard({ wallet, onRefresh }: BalancesCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncWalletData(wallet.id);
            onRefresh();
            toast.success("Wallet synced");
        } catch (error) {
            toast.error("Failed to sync");
        }
        setIsSyncing(false);
    };

    const handleDelete = async () => {
        if (!confirm("Remove this wallet?")) return;

        setIsDeleting(true);
        try {
            await removeCryptoWallet(wallet.id);
            onRefresh();
            toast.success("Wallet removed");
        } catch (error) {
            toast.error("Failed to remove");
        }
        setIsDeleting(false);
    };

    const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
    const explorerUrl = wallet.network === 'solana'
        ? `https://solscan.io/account/${wallet.address}`
        : `https://arbiscan.io/address/${wallet.address}`;

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[rgb(var(--background-secondary))] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary))]/10 flex items-center justify-center">
                        <span className="text-lg">⚡</span>
                    </div>
                    <div>
                        <p className="font-medium">{wallet.label || 'Wallet'}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[rgb(var(--foreground-muted))] font-mono">
                                {shortAddress}
                            </span>
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[rgb(var(--primary))]"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="font-semibold tabular-nums">
                            ${wallet.totalBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p
                            className={cn(
                                'text-sm tabular-nums',
                                wallet.unrealizedPnlUsd >= 0
                                    ? 'text-[rgb(var(--income))]'
                                    : 'text-[rgb(var(--expense))]'
                            )}
                        >
                            {wallet.unrealizedPnlUsd >= 0 ? '+' : ''}
                            ${wallet.unrealizedPnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[rgb(var(--border))]"
                >
                    {/* Balances */}
                    {wallet.balances && wallet.balances.length > 0 && (
                        <div className="p-4 border-b border-[rgb(var(--border))]">
                            <p className="text-micro mb-3">BALANCES</p>
                            <div className="space-y-2">
                                {wallet.balances.map((balance) => (
                                    <div key={balance.id} className="flex items-center justify-between">
                                        <span className="font-medium">{balance.asset}</span>
                                        <div className="text-right">
                                            <span className="text-sm tabular-nums">
                                                {balance.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                                            </span>
                                            <span className="text-xs text-[rgb(var(--foreground-muted))] ml-2">
                                                (${balance.valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-4 flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--border))] transition-colors text-sm font-medium"
                        >
                            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                            {isSyncing ? 'Syncing...' : 'Sync'}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 rounded-xl text-[rgb(var(--expense))] hover:bg-[rgb(var(--expense))]/10 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {/* Last synced */}
                    {wallet.lastSyncedAt && (
                        <p className="text-xs text-[rgb(var(--foreground-muted))] text-center pb-3">
                            Last synced: {new Date(wallet.lastSyncedAt).toLocaleString()}
                        </p>
                    )}
                </motion.div>
            )}
        </div>
    );
}
