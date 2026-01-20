"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, TrendingDown, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CryptoSummaryProps {
    walletAddress?: string;
}

export function CryptoSummaryCard({ walletAddress }: CryptoSummaryProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        totalEquity: number;
        totalPnl: number;
        positionCount: number;
    } | null>(null);

    useEffect(() => {
        if (!walletAddress) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [posRes, balRes] = await Promise.all([
                    fetch(`/api/drift/positions?wallet=${walletAddress}`),
                    fetch(`/api/drift/balances?wallet=${walletAddress}`),
                ]);

                const [posData, balData] = await Promise.all([posRes.json(), balRes.json()]);

                if (posRes.ok && balRes.ok) {
                    setData({
                        totalEquity: balData.equity?.totalEquity || 0,
                        totalPnl: posData.summary?.totalPnl || 0,
                        positionCount: posData.summary?.count || 0,
                    });
                }
            } catch (err) {
                console.error("Error fetching crypto summary:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [walletAddress]);

    // No wallet configured
    if (!walletAddress) {
        return (
            <Link href="/crypto">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="card p-4 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Crypto Positions</h3>
                        <ExternalLink className="w-4 h-4 text-[rgb(var(--foreground-muted))] group-hover:text-[rgb(var(--primary))]" />
                    </div>
                    <p className="text-sm text-[rgb(var(--foreground-muted))]">
                        Track your Drift Protocol positions. Click to add a wallet.
                    </p>
                </motion.div>
            </Link>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Crypto Positions</h3>
                    <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--foreground-muted))]" />
                </div>
                <div className="space-y-2">
                    <div className="h-6 bg-[rgb(var(--background-secondary))] rounded animate-pulse" />
                    <div className="h-4 bg-[rgb(var(--background-secondary))] rounded w-2/3 animate-pulse" />
                </div>
            </div>
        );
    }

    // Has data
    if (data) {
        return (
            <Link href={`/crypto/view?wallet=${walletAddress}`}>
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="card p-4 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Crypto Positions</h3>
                        <ExternalLink className="w-4 h-4 text-[rgb(var(--foreground-muted))] group-hover:text-[rgb(var(--primary))]" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-semibold tabular-nums">
                                ${data.totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            <span
                                className={cn(
                                    "text-sm font-medium flex items-center gap-1",
                                    data.totalPnl >= 0
                                        ? "text-[rgb(var(--income))]"
                                        : "text-[rgb(var(--expense))]"
                                )}
                            >
                                {data.totalPnl >= 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                ) : (
                                    <TrendingDown className="w-3 h-3" />
                                )}
                                {data.totalPnl >= 0 ? "+" : ""}$
                                {Math.abs(data.totalPnl).toFixed(2)}
                            </span>
                        </div>

                        <p className="text-xs text-[rgb(var(--foreground-muted))]">
                            {data.positionCount} open position{data.positionCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </motion.div>
            </Link>
        );
    }

    return null;
}
