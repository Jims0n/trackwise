/**
 * Hyperliquid API Client
 * Read-only API for fetching positions, balances, and orders
 * 
 * API Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
 */

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

// ============================================
// Types
// ============================================

export interface HyperliquidPosition {
    coin: string;
    szi: string;           // Size (signed, negative = short)
    leverage: {
        type: string;
        value: number;
    };
    entryPx: string;       // Entry price
    positionValue: string; // Notional
    unrealizedPnl: string;
    returnOnEquity: string; // ROE as decimal
    liquidationPx: string | null;
    marginUsed: string;
}

export interface HyperliquidAssetPosition {
    position: HyperliquidPosition;
    type: 'oneWay';
}

export interface HyperliquidMarginSummary {
    accountValue: string;
    totalNtlPos: string;     // Total notional position
    totalRawUsd: string;     // Total raw USD
    totalMarginUsed: string;
    withdrawable: string;
}

export interface HyperliquidClearinghouseState {
    marginSummary: HyperliquidMarginSummary;
    crossMarginSummary: HyperliquidMarginSummary;
    crossMaintenanceMarginUsed: string;
    withdrawable: string;
    assetPositions: HyperliquidAssetPosition[];
}

export interface HyperliquidOrder {
    coin: string;
    oid: number;
    side: 'B' | 'A';  // B = Buy, A = Sell (Ask)
    limitPx: string;
    sz: string;        // Size
    timestamp: number;
    origSz: string;    // Original size
    cloid: string | null;
}

export interface HyperliquidAssetCtx {
    dayNtlVlm: string;   // 24h volume
    funding: string;      // Current funding rate
    impactPxs: [string, string];
    markPx: string;       // Mark price
    midPx: string;        // Mid price
    openInterest: string;
    oraclePx: string;     // Oracle price
    premium: string;
    prevDayPx: string;
}

export interface HyperliquidMeta {
    universe: {
        name: string;
        szDecimals: number;
    }[];
}

// Normalized types for TrackWise (matching Drift structure)
export interface HyperliquidPositionData {
    market: string;
    marketIndex: number;
    direction: 'Long' | 'Short';
    size: number;
    entryPrice: number;
    markPrice: number;
    notionalUsd: number;
    unrealizedPnl: number;
    pnlPercent: number;
    margin: number;
    liquidationPrice: number;
    leverage: number;
    fundingRate: number;
}

export interface HyperliquidBalanceData {
    asset: string;
    amount: number;
    valueUsd: number;
}

export interface HyperliquidEquityData {
    totalEquity: number;
    freeCollateral: number;
    marginUsed: number;
    unrealizedPnl: number;
    accountHealth: number;
    leverage: number;
}

// Subaccount types
export interface HyperliquidSubaccount {
    name: string;
    subAccountUser: string;  // The subaccount address
    master: string;          // Master account address
    clearinghouseState: HyperliquidClearinghouseState;
}

// ============================================
// API Helper
// ============================================

async function hyperliquidRequest<T>(body: Record<string, unknown>): Promise<T> {
    const response = await fetch(HYPERLIQUID_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// ============================================
// Market Data Functions
// ============================================

let cachedMeta: HyperliquidMeta | null = null;
let cachedAssetCtxs: HyperliquidAssetCtx[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 seconds

async function getMetaAndAssetCtxs(): Promise<[HyperliquidMeta, HyperliquidAssetCtx[]]> {
    const now = Date.now();
    if (cachedMeta && cachedAssetCtxs && (now - cacheTimestamp) < CACHE_TTL) {
        return [cachedMeta, cachedAssetCtxs];
    }

    const result = await hyperliquidRequest<[HyperliquidMeta, HyperliquidAssetCtx[]]>({
        type: 'metaAndAssetCtxs',
    });

    cachedMeta = result[0];
    cachedAssetCtxs = result[1];
    cacheTimestamp = now;

    return result;
}

// ============================================
// Position Functions
// ============================================

export async function fetchHyperliquidPositions(
    walletAddress: string
): Promise<HyperliquidPositionData[]> {
    console.log('[Hyperliquid] Fetching positions for', walletAddress);

    try {
        // Fetch clearinghouse state and market data in parallel
        const [clearinghouse, [meta, assetCtxs]] = await Promise.all([
            hyperliquidRequest<HyperliquidClearinghouseState>({
                type: 'clearinghouseState',
                user: walletAddress,
            }),
            getMetaAndAssetCtxs(),
        ]);

        if (!clearinghouse.assetPositions || clearinghouse.assetPositions.length === 0) {
            console.log('[Hyperliquid] No positions found');
            return [];
        }

        // Build coin to index map
        const coinToIndex = new Map<string, number>();
        meta.universe.forEach((asset, index) => {
            coinToIndex.set(asset.name, index);
        });

        const positions: HyperliquidPositionData[] = [];

        for (const ap of clearinghouse.assetPositions) {
            const pos = ap.position;
            const size = parseFloat(pos.szi);

            // Skip zero positions
            if (size === 0) continue;

            const marketIndex = coinToIndex.get(pos.coin) ?? -1;
            const assetCtx = assetCtxs[marketIndex];

            const entryPrice = parseFloat(pos.entryPx);
            const markPrice = assetCtx ? parseFloat(assetCtx.markPx) : entryPrice;
            const notionalUsd = parseFloat(pos.positionValue);
            const unrealizedPnl = parseFloat(pos.unrealizedPnl);
            const margin = parseFloat(pos.marginUsed);
            const liquidationPrice = pos.liquidationPx ? parseFloat(pos.liquidationPx) : 0;

            // Use the API-provided leverage (user's configured leverage)
            const positionLeverage = pos.leverage?.value ?? (margin > 0 ? notionalUsd / margin : 0);
            const pnlPercent = margin > 0 ? (unrealizedPnl / margin) * 100 : 0;

            // Get funding rate (hourly, as decimal)
            const fundingRate = assetCtx ? parseFloat(assetCtx.funding) * 100 : 0;

            positions.push({
                market: `${pos.coin}-PERP`,
                marketIndex,
                direction: size > 0 ? 'Long' : 'Short',
                size: Math.abs(size),
                entryPrice,
                markPrice,
                notionalUsd: Math.abs(notionalUsd),
                unrealizedPnl,
                pnlPercent,
                margin,
                liquidationPrice,
                leverage: positionLeverage,
                fundingRate,
            });
        }

        console.log('[Hyperliquid] Fetched', positions.length, 'positions');
        return positions;
    } catch (error) {
        console.error('[Hyperliquid] Error fetching positions:', error);
        throw error;
    }
}

// ============================================
// Balance Functions
// ============================================

export async function fetchHyperliquidBalances(
    walletAddress: string
): Promise<{ balances: HyperliquidBalanceData[]; equity: HyperliquidEquityData }> {
    console.log('[Hyperliquid] Fetching balances for', walletAddress);

    try {
        const clearinghouse = await hyperliquidRequest<HyperliquidClearinghouseState>({
            type: 'clearinghouseState',
            user: walletAddress,
        });

        const marginSummary = clearinghouse.crossMarginSummary;

        const accountValue = parseFloat(marginSummary.accountValue);
        const totalMarginUsed = parseFloat(marginSummary.totalMarginUsed);
        const withdrawable = parseFloat(clearinghouse.withdrawable);
        const totalNotional = parseFloat(marginSummary.totalNtlPos);

        // Calculate unrealized PnL from positions
        let unrealizedPnl = 0;
        for (const ap of clearinghouse.assetPositions) {
            unrealizedPnl += parseFloat(ap.position.unrealizedPnl);
        }

        // Calculate account health (distance from liquidation)
        // Simplified: 100% when no positions, decreases with leverage
        const maintenanceMargin = parseFloat(clearinghouse.crossMaintenanceMarginUsed);
        const accountHealth = maintenanceMargin > 0
            ? Math.min(100, Math.max(0, ((accountValue - maintenanceMargin) / accountValue) * 100))
            : 100;

        // Calculate total leverage
        const leverage = accountValue > 0 ? totalNotional / accountValue : 0;

        // Hyperliquid is USDC-based, so we just show the account value
        const balances: HyperliquidBalanceData[] = [
            {
                asset: 'USDC',
                amount: accountValue,
                valueUsd: accountValue,
            },
        ];

        const equity: HyperliquidEquityData = {
            totalEquity: accountValue,
            freeCollateral: withdrawable,
            marginUsed: totalMarginUsed,
            unrealizedPnl,
            accountHealth,
            leverage,
        };

        console.log('[Hyperliquid] Fetched balances, equity:', accountValue.toFixed(2));
        return { balances, equity };
    } catch (error) {
        console.error('[Hyperliquid] Error fetching balances:', error);
        throw error;
    }
}

// ============================================
// Order Functions
// ============================================

export async function fetchHyperliquidOrders(
    walletAddress: string
): Promise<HyperliquidOrder[]> {
    console.log('[Hyperliquid] Fetching orders for', walletAddress);

    try {
        const orders = await hyperliquidRequest<HyperliquidOrder[]>({
            type: 'openOrders',
            user: walletAddress,
        });

        console.log('[Hyperliquid] Fetched', orders.length, 'open orders');
        return orders;
    } catch (error) {
        console.error('[Hyperliquid] Error fetching orders:', error);
        throw error;
    }
}

// ============================================
// Subaccount Functions
// ============================================

export interface HyperliquidSubaccountInfo {
    name: string;
    subAccountUser: string;
    master: string;
    equity: number;
}

export async function fetchHyperliquidSubaccounts(
    walletAddress: string
): Promise<HyperliquidSubaccountInfo[]> {
    console.log('[Hyperliquid] Fetching subaccounts for', walletAddress);

    try {
        const response = await hyperliquidRequest<HyperliquidSubaccount[]>({
            type: 'subAccounts',
            user: walletAddress,
        });

        if (!response || response.length === 0) {
            console.log('[Hyperliquid] No subaccounts found');
            return [];
        }

        const subaccounts: HyperliquidSubaccountInfo[] = response.map((sub) => ({
            name: sub.name,
            subAccountUser: sub.subAccountUser,
            master: sub.master,
            equity: parseFloat(sub.clearinghouseState?.crossMarginSummary?.accountValue || '0'),
        }));

        console.log('[Hyperliquid] Fetched', subaccounts.length, 'subaccounts');
        return subaccounts;
    } catch (error) {
        console.error('[Hyperliquid] Error fetching subaccounts:', error);
        // Return empty array on error (some wallets may not have subaccounts set up)
        return [];
    }
}

// ============================================
// Address Validation
// ============================================

export function isValidHyperliquidAddress(address: string): boolean {
    // Hyperliquid uses Ethereum-style addresses (0x...)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function detectProtocol(address: string): 'DRIFT' | 'HYPERLIQUID' | null {
    // Ethereum address (0x prefix)
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return 'HYPERLIQUID';
    }

    // Solana address (Base58, typically 32-44 chars, no 0x prefix)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        return 'DRIFT';
    }

    return null;
}
