'use server';

import { db as prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Update user preferences (theme, currency, accent color, etc.)
 */
export async function updateUserPreferences(data: {
    theme?: string;
    accentColor?: string;
    defaultCurrency?: string;
    emailNotifications?: boolean;
    budgetAlerts?: boolean;
    weeklyDigest?: boolean;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { error: 'Not authenticated' };
        }

        // Upsert preferences
        const preferences = await prisma.userPreferences.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                theme: data.theme || 'system',
                accentColor: data.accentColor || '#10B981',
                defaultCurrency: data.defaultCurrency || 'USD',
                emailNotifications: data.emailNotifications ?? true,
                budgetAlerts: data.budgetAlerts ?? true,
                weeklyDigest: data.weeklyDigest ?? false,
            },
            update: {
                ...(data.theme && { theme: data.theme }),
                ...(data.accentColor && { accentColor: data.accentColor }),
                ...(data.defaultCurrency && { defaultCurrency: data.defaultCurrency }),
                ...(data.emailNotifications !== undefined && { emailNotifications: data.emailNotifications }),
                ...(data.budgetAlerts !== undefined && { budgetAlerts: data.budgetAlerts }),
                ...(data.weeklyDigest !== undefined && { weeklyDigest: data.weeklyDigest }),
            },
        });

        revalidatePath('/dashboard/settings');
        return { success: true, preferences };
    } catch (error) {
        console.error('Failed to update preferences:', error);
        return { error: 'Failed to update preferences' };
    }
}

/**
 * Get user preferences
 */
export async function getUserPreferences() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { error: 'Not authenticated' };
        }

        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
        });

        return { preferences };
    } catch (error) {
        console.error('Failed to get preferences:', error);
        return { error: 'Failed to get preferences' };
    }
}

/**
 * Export user transactions as CSV
 */
export async function exportTransactionsCSV(options?: {
    startDate?: Date;
    endDate?: Date;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { error: 'Not authenticated' };
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: session.user.id,
                ...(options?.startDate || options?.endDate
                    ? {
                        date: {
                            ...(options.startDate && { gte: options.startDate }),
                            ...(options.endDate && { lte: options.endDate }),
                        },
                    }
                    : {}),
            },
            include: {
                category: true,
                account: true,
            },
            orderBy: { date: 'desc' },
        });

        // Convert to CSV format
        const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Description', 'Status'];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.type,
            (Number(t.amount) / 100).toFixed(2), // Convert from minor units
            t.currency,
            t.category?.name || 'Uncategorized',
            t.account?.name || '',
            t.description || '',
            t.status,
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        return { success: true, csv, count: transactions.length };
    } catch (error) {
        console.error('Failed to export transactions:', error);
        return { error: 'Failed to export transactions' };
    }
}

/**
 * Get app version and stats
 */
export async function getAppInfo() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { error: 'Not authenticated' };
        }

        const [transactionCount, accountCount] = await Promise.all([
            prisma.transaction.count({ where: { userId: session.user.id } }),
            prisma.financialAccount.count({ where: { userId: session.user.id } }),
        ]);

        return {
            success: true,
            version: '2.0.0',
            transactionCount,
            accountCount,
        };
    } catch (error) {
        console.error('Failed to get app info:', error);
        return { error: 'Failed to get app info' };
    }
}
