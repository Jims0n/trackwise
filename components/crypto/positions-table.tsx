"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PerpPosition } from "@/types/crypto";

interface PositionsTableProps {
    positions: (PerpPosition & { walletLabel?: string })[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
    if (positions.length === 0) {
        return (
            <p className="text-caption text-center py-4">No open positions</p>
        );
    }

    return (
        <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-[rgb(var(--border))]">
                        <th className="text-left py-2 px-2 text-micro font-medium">Market</th>
                        <th className="text-left py-2 px-2 text-micro font-medium">Side</th>
                        <th className="text-right py-2 px-2 text-micro font-medium">Size</th>
                        <th className="text-right py-2 px-2 text-micro font-medium">Entry</th>
                        <th className="text-right py-2 px-2 text-micro font-medium">Mark</th>
                        <th className="text-right py-2 px-2 text-micro font-medium">PnL</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.map((position, index) => (
                        <motion.tr
                            key={position.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-[rgb(var(--border))]/50 last:border-0"
                        >
                            <td className="py-3 px-2">
                                <div className="font-medium text-sm">{position.market}</div>
                                {position.walletLabel && (
                                    <div className="text-xs text-[rgb(var(--foreground-muted))]">
                                        {position.walletLabel}
                                    </div>
                                )}
                            </td>
                            <td className="py-3 px-2">
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        position.direction === 'Long'
                                            ? 'text-[rgb(var(--income))]'
                                            : 'text-[rgb(var(--expense))]'
                                    )}
                                >
                                    {position.direction}
                                </span>
                            </td>
                            <td className="py-3 px-2 text-right text-sm tabular-nums">
                                {position.size.toFixed(4)}
                            </td>
                            <td className="py-3 px-2 text-right text-sm tabular-nums">
                                ${position.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 text-right text-sm tabular-nums">
                                ${position.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 text-right">
                                <div
                                    className={cn(
                                        'text-sm font-medium tabular-nums',
                                        position.unrealizedPnl >= 0
                                            ? 'text-[rgb(var(--income))]'
                                            : 'text-[rgb(var(--expense))]'
                                    )}
                                >
                                    {position.unrealizedPnl >= 0 ? '+' : ''}
                                    ${position.unrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div
                                    className={cn(
                                        'text-xs',
                                        position.pnlPercent >= 0
                                            ? 'text-[rgb(var(--income))]'
                                            : 'text-[rgb(var(--expense))]'
                                    )}
                                >
                                    {position.pnlPercent >= 0 ? '+' : ''}
                                    {position.pnlPercent.toFixed(2)}%
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
