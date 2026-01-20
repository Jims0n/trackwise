// Crypto Types for TrackWise

export type CryptoPlatform = 'DRIFT' | 'HYPERLIQUID';
export type PositionDirection = 'Long' | 'Short';

// ============================================
// Wallet Types
// ============================================

export interface CryptoWallet {
    id: string;
    userId: string;
    address: string;
    network: string;
    label: string | null;
    platform: CryptoPlatform;
    totalBalanceUsd: number;
    unrealizedPnlUsd: number;
    lastSyncedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    positions?: PerpPosition[];
    balances?: CryptoBalance[];
}

export interface PerpPosition {
    id: string;
    walletId: string;
    market: string;
    marketIndex: number;
    direction: PositionDirection;
    size: number;
    entryPrice: number;
    markPrice: number;
    notionalUsd: number;
    unrealizedPnl: number;
    pnlPercent: number;
    leverage: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CryptoBalance {
    id: string;
    walletId: string;
    asset: string;
    amount: number;
    valueUsd: number;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface CryptoSummary {
    totalBalanceUsd: number;
    totalUnrealizedPnl: number;
    openPositionsCount: number;
    wallets: CryptoWallet[];
}

export interface AddWalletInput {
    address: string;
    platform: CryptoPlatform;
    label?: string;
}

export interface SyncWalletResult {
    success: boolean;
    wallet?: CryptoWallet;
    error?: string;
}

// ============================================
// Drift Protocol Types
// ============================================

export interface DriftPositionData {
    market: string;
    marketIndex: number;
    direction: PositionDirection;
    size: number;
    entryPrice: number;
    markPrice: number;
    notionalUsd: number;
    unrealizedPnl: number;
    pnlPercent: number;
    margin: number;
    liquidationPrice: number;
    leverage: number;
    fundingRate: number; // Hourly funding rate as percentage
}

export interface DriftBalanceData {
    asset: string;
    amount: number;
    valueUsd: number;
}

// Market mapping for Drift Protocol
export const DRIFT_PERP_MARKETS: Record<number, { name: string; baseDecimals: number; quoteDecimals: number }> = {
    0: { name: 'SOL-PERP', baseDecimals: 9, quoteDecimals: 6 },
    1: { name: 'BTC-PERP', baseDecimals: 6, quoteDecimals: 6 },
    2: { name: 'ETH-PERP', baseDecimals: 6, quoteDecimals: 6 },
    3: { name: 'mSOL-PERP', baseDecimals: 9, quoteDecimals: 6 },
    4: { name: 'BNB-PERP', baseDecimals: 8, quoteDecimals: 6 },
    5: { name: 'AVAX-PERP', baseDecimals: 8, quoteDecimals: 6 },
    6: { name: 'ARB-PERP', baseDecimals: 8, quoteDecimals: 6 },
    7: { name: 'DOGE-PERP', baseDecimals: 8, quoteDecimals: 6 },
    8: { name: 'MATIC-PERP', baseDecimals: 8, quoteDecimals: 6 },
    9: { name: 'SUI-PERP', baseDecimals: 8, quoteDecimals: 6 },
    10: { name: 'XRP-PERP', baseDecimals: 8, quoteDecimals: 6 },
    11: { name: 'ADA-PERP', baseDecimals: 8, quoteDecimals: 6 },
    12: { name: 'APT-PERP', baseDecimals: 8, quoteDecimals: 6 },
    13: { name: 'LTC-PERP', baseDecimals: 8, quoteDecimals: 6 },
    14: { name: 'BCH-PERP', baseDecimals: 8, quoteDecimals: 6 },
    15: { name: 'OP-PERP', baseDecimals: 8, quoteDecimals: 6 },
    16: { name: 'LINK-PERP', baseDecimals: 8, quoteDecimals: 6 },
    17: { name: 'NEAR-PERP', baseDecimals: 8, quoteDecimals: 6 },
    18: { name: 'JTO-PERP', baseDecimals: 8, quoteDecimals: 6 },
    19: { name: 'TIA-PERP', baseDecimals: 8, quoteDecimals: 6 },
    20: { name: 'JUP-PERP', baseDecimals: 8, quoteDecimals: 6 },
    21: { name: 'WIF-PERP', baseDecimals: 8, quoteDecimals: 6 },
    22: { name: 'SEI-PERP', baseDecimals: 8, quoteDecimals: 6 },
    23: { name: 'DYM-PERP', baseDecimals: 8, quoteDecimals: 6 },
    24: { name: 'STRK-PERP', baseDecimals: 8, quoteDecimals: 6 },
    25: { name: 'BONK-PERP', baseDecimals: 5, quoteDecimals: 6 },
    26: { name: 'PYTH-PERP', baseDecimals: 8, quoteDecimals: 6 },
    27: { name: 'RNDR-PERP', baseDecimals: 8, quoteDecimals: 6 },
};

export const DRIFT_SPOT_MARKETS: Record<number, { name: string; decimals: number; symbol: string }> = {
    0: { name: 'USDC', decimals: 6, symbol: 'USDC' },
    1: { name: 'SOL', decimals: 9, symbol: 'SOL' },
    2: { name: 'BTC', decimals: 8, symbol: 'BTC' },
    3: { name: 'ETH', decimals: 8, symbol: 'ETH' },
    4: { name: 'PYTH', decimals: 6, symbol: 'PYTH' },
    5: { name: 'BONK', decimals: 5, symbol: 'BONK' },
    6: { name: 'JTO', decimals: 8, symbol: 'JTO' },
    7: { name: 'WBTC', decimals: 8, symbol: 'WBTC' },
    8: { name: 'MSOL', decimals: 9, symbol: 'MSOL' },
    9: { name: 'RNDR', decimals: 8, symbol: 'RNDR' },
    10: { name: 'WETH', decimals: 8, symbol: 'WETH' },
    11: { name: 'JUP', decimals: 6, symbol: 'JUP' },
    12: { name: 'STRK', decimals: 8, symbol: 'STRK' },
    13: { name: 'WIF', decimals: 6, symbol: 'WIF' },
    14: { name: 'DYM', decimals: 9, symbol: 'DYM' },
    15: { name: 'USDT', decimals: 6, symbol: 'USDT' },
    16: { name: 'SEI', decimals: 6, symbol: 'SEI' },
};

// Constants
export const PRICE_PRECISION = 6;
export const QUOTE_SPOT_MARKET_INDEX = 0;
