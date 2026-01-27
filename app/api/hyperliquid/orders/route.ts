import { NextRequest, NextResponse } from 'next/server';
import { fetchHyperliquidOrders, isValidHyperliquidAddress } from '@/lib/crypto/hyperliquid';

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

        const orders = await fetchHyperliquidOrders(wallet);

        // Transform to match Drift order format
        const formattedOrders = orders.map((order) => ({
            orderId: order.oid,
            market: `${order.coin}-PERP`,
            orderType: 'Limit',
            direction: order.side === 'B' ? 'Long' : 'Short',
            price: parseFloat(order.limitPx),
            size: parseFloat(order.sz),
            filledSize: parseFloat(order.origSz) - parseFloat(order.sz),
            status: 'Open' as const,
            timestamp: order.timestamp,
        }));

        return NextResponse.json({
            orders: formattedOrders,
            count: formattedOrders.length,
        });
    } catch (error) {
        console.error('[API] Error fetching Hyperliquid orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders from Hyperliquid' },
            { status: 500 }
        );
    }
}
