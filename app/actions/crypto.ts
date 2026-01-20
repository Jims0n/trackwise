'use server';

import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { revalidatePath } from 'next/cache';
import {
    isValidSolanaAddress,
    fetchDriftPositions,
    fetchDriftBalances,
} from '@/lib/crypto/drift';
import type { CryptoPlatform, CryptoSummary, AddWalletInput } from '@/types/crypto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get all crypto wallets for the current user
 */
export async function getCryptoWallets() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: 'Unauthorized', wallets: [] };
    }

    try {
        const wallets = await db.cryptoWallet.findMany({
            where: { userId: session.user.id },
            include: {
                positions: true,
                balances: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Convert Decimal to number for client
        const serializedWallets = wallets.map((w) => ({
            ...w,
            totalBalanceUsd: Number(w.totalBalanceUsd),
            unrealizedPnlUsd: Number(w.unrealizedPnlUsd),
            positions: w.positions.map((p) => ({
                ...p,
                size: Number(p.size),
                entryPrice: Number(p.entryPrice),
                markPrice: Number(p.markPrice),
                notionalUsd: Number(p.notionalUsd),
                unrealizedPnl: Number(p.unrealizedPnl),
                pnlPercent: Number(p.pnlPercent),
                leverage: p.leverage ? Number(p.leverage) : null,
            })),
            balances: w.balances.map((b) => ({
                ...b,
                amount: Number(b.amount),
                valueUsd: Number(b.valueUsd),
            })),
        }));

        return { wallets: serializedWallets };
    } catch (error) {
        console.error('[Crypto] Error fetching wallets:', error);
        return { error: 'Failed to fetch wallets', wallets: [] };
    }
}

/**
 * Get crypto summary across all wallets
 */
export async function getCryptoSummary(): Promise<{ summary: CryptoSummary | null; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: 'Unauthorized', summary: null };
    }

    try {
        const wallets = await db.cryptoWallet.findMany({
            where: { userId: session.user.id },
            include: {
                positions: true,
                balances: true,
            },
        });

        let totalBalanceUsd = 0;
        let totalUnrealizedPnl = 0;
        let openPositionsCount = 0;

        for (const wallet of wallets) {
            totalBalanceUsd += Number(wallet.totalBalanceUsd);
            totalUnrealizedPnl += Number(wallet.unrealizedPnlUsd);
            openPositionsCount += wallet.positions.length;
        }

        const serializedWallets = wallets.map((w) => ({
            ...w,
            totalBalanceUsd: Number(w.totalBalanceUsd),
            unrealizedPnlUsd: Number(w.unrealizedPnlUsd),
            positions: w.positions.map((p) => ({
                ...p,
                size: Number(p.size),
                entryPrice: Number(p.entryPrice),
                markPrice: Number(p.markPrice),
                notionalUsd: Number(p.notionalUsd),
                unrealizedPnl: Number(p.unrealizedPnl),
                pnlPercent: Number(p.pnlPercent),
                leverage: p.leverage ? Number(p.leverage) : null,
            })),
            balances: w.balances.map((b) => ({
                ...b,
                amount: Number(b.amount),
                valueUsd: Number(b.valueUsd),
            })),
        }));

        return {
            summary: {
                totalBalanceUsd,
                totalUnrealizedPnl,
                openPositionsCount,
                wallets: serializedWallets as any,
            },
        };
    } catch (error) {
        console.error('[Crypto] Error getting summary:', error);
        return { error: 'Failed to get summary', summary: null };
    }
}

/**
 * Add a new crypto wallet to track
 */
export async function addCryptoWallet(input: AddWalletInput) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    const { address, platform, label } = input;

    // Validate address
    if (platform === 'DRIFT' && !isValidSolanaAddress(address)) {
        return { error: 'Invalid Solana wallet address' };
    }

    try {
        // Check if wallet already exists
        const existing = await db.cryptoWallet.findFirst({
            where: {
                userId: session.user.id,
                address,
                platform,
            },
        });

        if (existing) {
            return { error: 'Wallet already added' };
        }

        // Create wallet
        const wallet = await db.cryptoWallet.create({
            data: {
                userId: session.user.id,
                address,
                platform,
                label,
                network: platform === 'DRIFT' ? 'solana' : 'ethereum',
            },
        });

        // Immediately sync data
        await syncWalletData(wallet.id);

        revalidatePath('/dashboard/crypto');
        return { success: true, walletId: wallet.id };
    } catch (error) {
        console.error('[Crypto] Error adding wallet:', error);
        return { error: 'Failed to add wallet' };
    }
}

/**
 * Remove a crypto wallet
 */
export async function removeCryptoWallet(walletId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        // Verify ownership
        const wallet = await db.cryptoWallet.findFirst({
            where: {
                id: walletId,
                userId: session.user.id,
            },
        });

        if (!wallet) {
            return { error: 'Wallet not found' };
        }

        await db.cryptoWallet.delete({
            where: { id: walletId },
        });

        revalidatePath('/dashboard/crypto');
        return { success: true };
    } catch (error) {
        console.error('[Crypto] Error removing wallet:', error);
        return { error: 'Failed to remove wallet' };
    }
}

/**
 * Sync wallet data from the blockchain
 */
export async function syncWalletData(walletId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const wallet = await db.cryptoWallet.findFirst({
            where: {
                id: walletId,
                userId: session.user.id,
            },
        });

        if (!wallet) {
            return { error: 'Wallet not found' };
        }

        if (wallet.platform === 'DRIFT') {
            // Fetch positions
            const positions = await fetchDriftPositions(wallet.address);

            // Fetch balances
            const balances = await fetchDriftBalances(wallet.address);

            // Calculate totals
            const totalBalanceUsd = balances.reduce((sum, b) => sum + b.valueUsd, 0);
            const unrealizedPnlUsd = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

            // Delete existing positions and balances
            await db.perpPosition.deleteMany({ where: { walletId } });
            await db.cryptoBalance.deleteMany({ where: { walletId } });

            // Insert new positions
            if (positions.length > 0) {
                await db.perpPosition.createMany({
                    data: positions.map((p) => ({
                        walletId,
                        market: p.market,
                        marketIndex: p.marketIndex,
                        direction: p.direction,
                        size: new Decimal(p.size),
                        entryPrice: new Decimal(p.entryPrice),
                        markPrice: new Decimal(p.markPrice),
                        notionalUsd: new Decimal(p.notionalUsd),
                        unrealizedPnl: new Decimal(p.unrealizedPnl),
                        pnlPercent: new Decimal(p.pnlPercent),
                    })),
                });
            }

            // Insert new balances
            if (balances.length > 0) {
                await db.cryptoBalance.createMany({
                    data: balances.map((b) => ({
                        walletId,
                        asset: b.asset,
                        amount: new Decimal(b.amount),
                        valueUsd: new Decimal(b.valueUsd),
                    })),
                });
            }

            // Update wallet totals
            await db.cryptoWallet.update({
                where: { id: walletId },
                data: {
                    totalBalanceUsd: new Decimal(totalBalanceUsd),
                    unrealizedPnlUsd: new Decimal(unrealizedPnlUsd),
                    lastSyncedAt: new Date(),
                },
            });

            revalidatePath('/dashboard/crypto');
            return {
                success: true,
                positionsCount: positions.length,
                balancesCount: balances.length,
            };
        }

        return { error: 'Unsupported platform' };
    } catch (error) {
        console.error('[Crypto] Error syncing wallet:', error);
        return { error: 'Failed to sync wallet data' };
    }
}
