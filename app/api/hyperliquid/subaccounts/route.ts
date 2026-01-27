import { NextRequest, NextResponse } from 'next/server';
import { fetchHyperliquidSubaccounts, isValidHyperliquidAddress } from '@/lib/crypto/hyperliquid';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet address required' },
                { status: 400 }
            );
        }

        if (!isValidHyperliquidAddress(wallet)) {
            return NextResponse.json(
                { error: 'Invalid Ethereum address format. Must start with 0x followed by 40 hex characters.' },
                { status: 400 }
            );
        }

        const subaccounts = await fetchHyperliquidSubaccounts(wallet);

        // Include the master account as well
        const allAccounts = [
            {
                name: 'Master',
                subAccountUser: wallet,
                master: wallet,
                equity: 0, // Will be fetched separately
                isMaster: true,
            },
            ...subaccounts.map(sub => ({ ...sub, isMaster: false })),
        ];

        return NextResponse.json({
            subaccounts: allAccounts,
            count: allAccounts.length,
        });
    } catch (error) {
        console.error('[API] Error fetching Hyperliquid subaccounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subaccounts from Hyperliquid' },
            { status: 500 }
        );
    }
}
