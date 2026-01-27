import { NextRequest, NextResponse } from 'next/server';
import { fetchHyperliquidBalances, isValidHyperliquidAddress } from '@/lib/crypto/hyperliquid';

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

        const { balances, equity } = await fetchHyperliquidBalances(wallet);

        return NextResponse.json({
            balances,
            equity,
        });
    } catch (error) {
        console.error('[API] Error fetching Hyperliquid balances:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balances from Hyperliquid' },
            { status: 500 }
        );
    }
}
