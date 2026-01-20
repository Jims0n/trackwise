import { NextRequest, NextResponse } from 'next/server';
import { fetchOrderHistory } from '@/lib/crypto/drift';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const wallet = searchParams.get('wallet');
        const subaccount = searchParams.get('subaccount');

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet address required' },
                { status: 400 }
            );
        }

        const subAccountId = subaccount ? parseInt(subaccount) : 0;
        const orders = await fetchOrderHistory(wallet, subAccountId);

        return NextResponse.json({
            orders,
            count: orders.length,
        });
    } catch (error) {
        console.error('[API] Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
