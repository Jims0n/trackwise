import { NextRequest, NextResponse } from 'next/server';
import { fetchDriftPositions, isValidSolanaAddress } from '@/lib/crypto/drift';

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
        const positions = await fetchDriftPositions(wallet, parseInt(subaccount));

        // Calculate totals
        const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
        const totalNotional = positions.reduce((sum, p) => sum + p.notionalUsd, 0);

        return NextResponse.json({
            wallet,
            subaccount: parseInt(subaccount),
            positions,
            summary: {
                count: positions.length,
                totalPnl,
                totalNotional,
            },
        });
    } catch (error) {
        console.error('[API] Error fetching positions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch positions' },
            { status: 500 }
        );
    }
}
