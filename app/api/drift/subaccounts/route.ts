import { NextRequest, NextResponse } from 'next/server';
import { fetchSubaccounts, isValidSolanaAddress } from '@/lib/crypto/drift';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

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
        const subaccounts = await fetchSubaccounts(wallet);

        return NextResponse.json({
            wallet,
            subaccounts,
            count: subaccounts.length,
        });
    } catch (error) {
        console.error('[API] Error fetching subaccounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subaccounts' },
            { status: 500 }
        );
    }
}
