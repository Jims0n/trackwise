import { NextRequest, NextResponse } from 'next/server';
import {
    fetchDriftBalances,
    fetchAccountEquity,
    isValidSolanaAddress
} from '@/lib/crypto/drift';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const subaccount = searchParams.get('subaccount') || '0';

    if (!wallet) {
        return NextResponse.json(
            { error: 'Wallet address is required' },
            { status: 400 }
        );
    }

    if (!isValidSolanaAddress(wallet)) {
        return NextResponse.json(
            { error: 'Invalid Solana wallet address' },
            { status: 400 }
        );
    }

    try {
        const subaccountId = parseInt(subaccount);

        const [balances, equity] = await Promise.all([
            fetchDriftBalances(wallet, subaccountId),
            fetchAccountEquity(wallet, subaccountId),
        ]);

        // Calculate total balance
        const totalBalance = balances.reduce((sum, b) => sum + b.valueUsd, 0);

        return NextResponse.json({
            wallet,
            subaccount: subaccountId,
            balances,
            equity: equity || {
                totalEquity: totalBalance,
                freeCollateral: totalBalance,
                marginUsed: 0,
            },
            summary: {
                totalBalance,
                tokenCount: balances.length,
            },
        });
    } catch (error) {
        console.error('[API] Error fetching balances:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balances' },
            { status: 500 }
        );
    }
}
