/**
 * Drift Protocol Integration for TrackWise
 * Adapted from drift-subaccounts repository
 * Read-only by wallet address - no private keys stored
 */

import { Connection, PublicKey } from '@solana/web3.js';
import {
    DriftClient,
    initialize,
    BulkAccountLoader,
    User,
    getUserAccountPublicKeySync,
    QUOTE_SPOT_MARKET_INDEX,
    BN,
} from '@drift-labs/sdk';
import {
    DriftPositionData,
    DriftBalanceData,
    DRIFT_PERP_MARKETS,
    DRIFT_SPOT_MARKETS,
    PRICE_PRECISION,
} from '@/types/crypto';

// Environment
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

let driftClientInstance: DriftClient | null = null;
let connectionInstance: Connection | null = null;

/**
 * Create Solana connection
 */
export function getConnection(): Connection {
    if (!connectionInstance) {
        console.log('[Drift] Creating Solana connection to:', HELIUS_RPC_URL);
        connectionInstance = new Connection(HELIUS_RPC_URL, {
            commitment: 'confirmed',
            disableRetryOnRateLimit: false,
        });
    }
    return connectionInstance;
}

/**
 * Initialize Drift client (server-side, read-only)
 * Includes oracle subscription wait for accurate SDK calculations
 */
export async function getDriftClient(): Promise<DriftClient> {
    if (driftClientInstance) {
        return driftClientInstance;
    }

    console.log('[Drift] Initializing DriftClient...');

    const connection = getConnection();

    // Initialize SDK
    await initialize({ env: 'mainnet-beta' });

    // Dummy wallet for read-only access
    const dummyWallet = {
        publicKey: PublicKey.default,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
    };

    // Create bulk account loader for efficient fetching
    // Use 'as any' to bypass SDK version mismatch with Connection type
    const accountLoader = new BulkAccountLoader(
        connection as any,
        'confirmed',
        5000
    );

    // Define markets to subscribe to for oracle data
    const perpMarketIndexes = [0, 1, 2, 3, 4, 5]; // SOL, BTC, ETH, etc.
    const spotMarketIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // USDC, SOL, mSOL, wBTC, wETH, etc.

    const config = {
        connection: connection as any, // Type assertion for SDK compatibility
        wallet: dummyWallet,
        env: 'mainnet-beta' as const,
        opts: {
            skipPreflight: false,
            commitment: 'confirmed' as const,
        },
        activeSubAccountId: 0,
        userStats: false,
        perpMarketIndexes,
        spotMarketIndexes,
        accountSubscription: {
            type: 'polling' as const,
            accountLoader,
        },
    };

    driftClientInstance = new DriftClient(config);
    await driftClientInstance.subscribe();

    // Wait for oracle data to load (first request only, ~3 seconds)
    console.log('[Drift] Waiting for oracle subscriptions to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[Drift] DriftClient initialized with oracle data');
    return driftClientInstance;
}

/**
 * Validate Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

/**
 * Fetch user account from Drift by wallet address
 */
export async function getDriftUser(
    walletAddress: string,
    subAccountId: number = 0
): Promise<User | null> {
    try {
        const client = await getDriftClient();
        const authority = new PublicKey(walletAddress);

        // Check if user account exists
        const userAccountPubKey = getUserAccountPublicKeySync(
            client.program.programId,
            authority,
            subAccountId
        );

        // Try to add user to client
        try {
            await client.addUser(subAccountId, authority);
        } catch (e) {
            // User might already be added, continue
        }

        const user = client.getUser(subAccountId, authority);

        if (user) {
            // CRITICAL: Subscribe to load account data
            // This is required before calling getTokenAmount, getTotalCollateral, etc.
            try {
                await user.subscribe();
            } catch (subError) {
                console.log('[Drift] User subscription failed, fetching accounts directly');
            }

            // Fetch accounts to ensure data is loaded
            await user.fetchAccounts();
        }

        return user;
    } catch (error) {
        console.error('[Drift] Error getting user:', error);
        return null;
    }
}

/**
 * Fetch positions from Drift account
 */
export async function fetchDriftPositions(
    walletAddress: string,
    subAccountId: number = 0
): Promise<DriftPositionData[]> {
    try {
        const user = await getDriftUser(walletAddress, subAccountId);
        if (!user) {
            console.log('[Drift] No user found for address:', walletAddress);
            return [];
        }

        const client = await getDriftClient();
        const userAccount = user.getUserAccount();
        const perpPositions = (userAccount as any).perpPositions || [];

        const positions: DriftPositionData[] = [];

        for (const position of perpPositions) {
            const baseAssetAmount = position.baseAssetAmount;
            if (!baseAssetAmount || baseAssetAmount.toString() === '0') {
                continue;
            }

            const marketIndex = position.marketIndex as number;
            const marketInfo = DRIFT_PERP_MARKETS[marketIndex] || {
                name: `PERP-${marketIndex}`,
                baseDecimals: 8,
                quoteDecimals: 6,
            };

            // Determine direction
            const baseAssetAmountStr = baseAssetAmount.toString();
            const isLong = !baseAssetAmountStr.startsWith('-');
            const direction = isLong ? 'Long' : 'Short';

            // Calculate size
            const baseDecimals = marketInfo.baseDecimals;
            const quoteDecimals = marketInfo.quoteDecimals;
            const size = Math.abs(
                parseFloat(baseAssetAmountStr) / Math.pow(10, baseDecimals)
            );

            // Get mark price (oracle price)
            let markPrice = 0;
            try {
                const oracleData = (client as any).getOracleDataForPerpMarket?.(marketIndex);
                if (oracleData?.price) {
                    markPrice = parseFloat(oracleData.price.toString()) / Math.pow(10, PRICE_PRECISION);
                }
            } catch (e) {
                console.warn('[Drift] Could not get oracle price for market:', marketIndex);
            }

            // Calculate entry price
            let entryPrice = 0;
            if (position.quoteEntryAmount && baseAssetAmount && baseAssetAmountStr !== '0') {
                const quoteEntryFloat = parseFloat(position.quoteEntryAmount.toString());
                const baseAssetAmountFloat = parseFloat(baseAssetAmountStr);
                entryPrice = Math.abs(quoteEntryFloat / baseAssetAmountFloat);
                entryPrice = entryPrice * (Math.pow(10, baseDecimals) / Math.pow(10, quoteDecimals));
            }

            // Calculate PnL
            let unrealizedPnl = 0;
            let pnlPercent = 0;

            if (markPrice > 0 && entryPrice > 0 && size > 0) {
                if (direction === 'Long') {
                    unrealizedPnl = size * (markPrice - entryPrice);
                    pnlPercent = ((markPrice / entryPrice) - 1) * 100;
                } else {
                    unrealizedPnl = size * (entryPrice - markPrice);
                    pnlPercent = ((entryPrice / markPrice) - 1) * 100;
                }
            }

            const notionalUsd = size * markPrice;

            // Calculate margin (initial margin requirement ~10% for most markets)
            // Drift uses different margin requirements per market, we'll approximate
            const marginRequirement = 0.1; // 10% initial margin
            const margin = notionalUsd * marginRequirement;

            // Calculate leverage
            const leverage = margin > 0 ? notionalUsd / margin : 0;

            // Calculate liquidation price
            // Liq price is when loss = collateral - maintenance margin (typically 3%)
            // For Long: liqPrice = entryPrice * (1 - (margin - maintenance) / notional)
            // For Short: liqPrice = entryPrice * (1 + (margin - maintenance) / notional)
            const maintenanceMargin = notionalUsd * 0.03; // 3% maintenance
            let liquidationPrice = 0;
            if (direction === 'Long' && entryPrice > 0) {
                liquidationPrice = entryPrice * (1 - (margin - maintenanceMargin) / notionalUsd);
            } else if (direction === 'Short' && entryPrice > 0) {
                liquidationPrice = entryPrice * (1 + (margin - maintenanceMargin) / notionalUsd);
            }

            // Get funding rate from perp market
            let fundingRate = 0;
            try {
                const perpMarket = client.getPerpMarketAccount(marketIndex);
                if (perpMarket && perpMarket.amm) {
                    // Funding rate is stored as a BN in the AMM
                    // Convert to hourly percentage
                    const lastFundingRate = (perpMarket.amm as any).lastFundingRate;
                    if (lastFundingRate) {
                        // Funding rate precision is 1e9, convert to percentage
                        fundingRate = parseFloat(lastFundingRate.toString()) / 1e9 * 100;
                    }
                }
            } catch {
                // Use 0 if unavailable
            }

            positions.push({
                market: marketInfo.name,
                marketIndex,
                direction: direction as 'Long' | 'Short',
                size,
                entryPrice,
                markPrice,
                notionalUsd,
                unrealizedPnl,
                pnlPercent,
                margin,
                liquidationPrice,
                leverage,
                fundingRate,
            });
        }

        console.log('[Drift] Fetched', positions.length, 'positions for', walletAddress);
        return positions;
    } catch (error) {
        console.error('[Drift] Error fetching positions:', error);
        return [];
    }
}

/**
 * Fetch balances from Drift account
 * Applies cumulative interest from spot markets for accurate amounts
 */
export async function fetchDriftBalances(
    walletAddress: string,
    subAccountId: number = 0
): Promise<DriftBalanceData[]> {
    try {
        const user = await getDriftUser(walletAddress, subAccountId);
        if (!user) {
            return [];
        }

        const client = await getDriftClient();
        const userAccount = user.getUserAccount();
        const spotPositions = (userAccount as any).spotPositions || [];

        const balances: DriftBalanceData[] = [];

        for (const position of spotPositions) {
            const scaledBalance = position.scaledBalance;
            const balanceType = position.balanceType;

            // Skip empty positions
            if (!scaledBalance) continue;

            let scaledBalanceNum = 0;
            try {
                scaledBalanceNum = parseFloat(scaledBalance.toString());
            } catch {
                continue;
            }

            if (scaledBalanceNum === 0) continue;

            const marketIndex = position.marketIndex as number;
            const metadata = DRIFT_SPOT_MARKETS[marketIndex] || {
                name: `Token ${marketIndex}`,
                decimals: 6,
                symbol: `TOKEN${marketIndex}`,
            };

            try {
                // Get spot market to access cumulative interest
                let cumulativeInterest = 1e10; // Default: 1 * SPOT_CUMULATIVE_INTEREST_PRECISION

                try {
                    const spotMarket = client.getSpotMarketAccount(marketIndex);
                    if (spotMarket) {
                        // Check if deposit or borrow
                        const isDeposit = !balanceType ||
                            balanceType.deposit !== undefined ||
                            (typeof balanceType === 'object' && 'deposit' in balanceType);

                        if (isDeposit && spotMarket.cumulativeDepositInterest) {
                            cumulativeInterest = parseFloat(spotMarket.cumulativeDepositInterest.toString());
                        } else if (!isDeposit && spotMarket.cumulativeBorrowInterest) {
                            cumulativeInterest = parseFloat(spotMarket.cumulativeBorrowInterest.toString());
                        }
                    }
                } catch (e) {
                    // Use default if can't get market
                }

                // Calculate actual token amount
                // Formula: tokenAmount = scaledBalance * cumulativeInterest / (SPOT_BALANCE_PRECISION * SPOT_CUMULATIVE_INTEREST_PRECISION)
                // SPOT_BALANCE_PRECISION = 10^9
                // SPOT_CUMULATIVE_INTEREST_PRECISION = 10^10
                const tokenAmount = (scaledBalanceNum * cumulativeInterest) / (1e9 * 1e10);

                // For USD value, USDC = 1:1, for other tokens we'd need oracle price
                let valueUsd = tokenAmount;
                if (marketIndex !== 0) {
                    try {
                        const oracleData = client.getOracleDataForSpotMarket(marketIndex);
                        if (oracleData?.price) {
                            const price = parseFloat(oracleData.price.toString()) / 1e6;
                            valueUsd = tokenAmount * price;
                        }
                    } catch {
                        // Use token amount as fallback
                    }
                }

                if (tokenAmount > 0.000001) { // Skip dust
                    balances.push({
                        asset: metadata.symbol,
                        amount: tokenAmount,
                        valueUsd: valueUsd,
                    });
                }
            } catch (e) {
                console.warn('[Drift] Error processing balance for market:', marketIndex, e);
            }
        }

        // Sort: USDC first, then by value
        balances.sort((a, b) => {
            if (a.asset === 'USDC') return -1;
            if (b.asset === 'USDC') return 1;
            return b.valueUsd - a.valueUsd;
        });

        console.log('[Drift] Fetched', balances.length, 'balances for', walletAddress);
        return balances;
    } catch (error) {
        console.error('[Drift] Error fetching balances:', error);
        return [];
    }
}

/**
 * Fetch all subaccounts for a wallet address
 */
export async function fetchSubaccounts(
    walletAddress: string
): Promise<{ id: number; exists: boolean }[]> {
    try {
        const client = await getDriftClient();
        const connection = getConnection();
        const authority = new PublicKey(walletAddress);

        const subaccounts: { id: number; exists: boolean }[] = [];

        // Check subaccount IDs 0-10
        for (let subAccountId = 0; subAccountId <= 10; subAccountId++) {
            try {
                const userAccountPubKey = getUserAccountPublicKeySync(
                    client.program.programId,
                    authority,
                    subAccountId
                );

                const accountInfo = await connection.getAccountInfo(userAccountPubKey);

                if (accountInfo && accountInfo.data.length > 0) {
                    subaccounts.push({ id: subAccountId, exists: true });
                }
            } catch (e) {
                // Subaccount doesn't exist, continue
            }
        }

        console.log('[Drift] Found', subaccounts.length, 'subaccounts for', walletAddress);
        return subaccounts;
    } catch (error) {
        console.error('[Drift] Error fetching subaccounts:', error);
        return [];
    }
}

/**
 * Get account equity and margin info
 * Total Collateral = Spot Value + Unrealized PnL from Perps
 */
export async function fetchAccountEquity(
    walletAddress: string,
    subAccountId: number = 0
): Promise<{
    totalEquity: number;
    freeCollateral: number;
    marginUsed: number;
    unrealizedPnl: number;
    accountHealth: number;
    leverage: number;
} | null> {
    try {
        const user = await getDriftUser(walletAddress, subAccountId);
        if (!user) return null;

        const client = await getDriftClient();
        const userAccount = user.getUserAccount();
        const spotPositions = (userAccount as any).spotPositions || [];
        const perpPositions = (userAccount as any).perpPositions || [];

        let spotValue = 0;
        let unrealizedPnl = 0;
        let totalMarginUsed = 0;

        // Calculate spot value from balances
        for (const position of spotPositions) {
            const scaledBalance = position.scaledBalance;
            if (!scaledBalance) continue;

            let scaledBalanceNum = 0;
            try {
                scaledBalanceNum = parseFloat(scaledBalance.toString());
            } catch {
                continue;
            }

            if (scaledBalanceNum === 0) continue;

            const marketIndex = position.marketIndex as number;
            const balanceType = position.balanceType;

            try {
                let cumulativeInterest = 1e10;
                try {
                    const spotMarket = client.getSpotMarketAccount(marketIndex);
                    if (spotMarket) {
                        const isDeposit = !balanceType ||
                            balanceType.deposit !== undefined ||
                            (typeof balanceType === 'object' && 'deposit' in balanceType);

                        if (isDeposit && spotMarket.cumulativeDepositInterest) {
                            cumulativeInterest = parseFloat(spotMarket.cumulativeDepositInterest.toString());
                        } else if (!isDeposit && spotMarket.cumulativeBorrowInterest) {
                            cumulativeInterest = parseFloat(spotMarket.cumulativeBorrowInterest.toString());
                        }
                    }
                } catch {
                    // Use default
                }

                const tokenAmount = (scaledBalanceNum * cumulativeInterest) / (1e9 * 1e10);

                if (marketIndex === 0) {
                    spotValue += tokenAmount;
                } else {
                    try {
                        const oracleData = client.getOracleDataForSpotMarket(marketIndex);
                        if (oracleData?.price) {
                            const price = parseFloat(oracleData.price.toString()) / 1e6;
                            spotValue += tokenAmount * price;
                        }
                    } catch {
                        // Skip
                    }
                }
            } catch {
                // Skip
            }
        }

        // Calculate unrealized PnL from perp positions
        for (const position of perpPositions) {
            const baseAssetAmount = position.baseAssetAmount;
            if (!baseAssetAmount || baseAssetAmount.toString() === '0') continue;

            const marketIndex = position.marketIndex as number;
            const marketInfo = DRIFT_PERP_MARKETS[marketIndex];
            if (!marketInfo) continue;

            const baseAssetAmountStr = baseAssetAmount.toString();
            const isLong = !baseAssetAmountStr.startsWith('-');
            const baseDecimals = marketInfo.baseDecimals;
            const quoteDecimals = marketInfo.quoteDecimals;
            const size = Math.abs(parseFloat(baseAssetAmountStr) / Math.pow(10, baseDecimals));

            // Get mark price
            let markPrice = 0;
            try {
                const oracleData = (client as any).getOracleDataForPerpMarket?.(marketIndex);
                if (oracleData?.price) {
                    markPrice = parseFloat(oracleData.price.toString()) / 1e6;
                }
            } catch {
                continue;
            }

            // Calculate entry price
            let entryPrice = 0;
            if (position.quoteEntryAmount && baseAssetAmountStr !== '0') {
                const quoteEntryFloat = parseFloat(position.quoteEntryAmount.toString());
                const baseAssetAmountFloat = parseFloat(baseAssetAmountStr);
                entryPrice = Math.abs(quoteEntryFloat / baseAssetAmountFloat);
                entryPrice = entryPrice * (Math.pow(10, baseDecimals) / Math.pow(10, quoteDecimals));
            }

            // Calculate PnL for this position
            if (markPrice > 0 && entryPrice > 0 && size > 0) {
                if (isLong) {
                    unrealizedPnl += size * (markPrice - entryPrice);
                } else {
                    unrealizedPnl += size * (entryPrice - markPrice);
                }
            }

            // Calculate margin used (10% initial margin assumption)
            const notionalUsd = size * markPrice;
            totalMarginUsed += notionalUsd * 0.1;
        }

        // Total collateral = Spot value + Unrealized PnL
        const totalEquity = spotValue + unrealizedPnl;
        const freeCollateral = Math.max(0, totalEquity - totalMarginUsed);

        // Calculate total notional for leverage
        let totalNotional = 0;
        for (const position of perpPositions) {
            const baseAssetAmount = position.baseAssetAmount;
            if (!baseAssetAmount || baseAssetAmount.toString() === '0') continue;

            const marketIndex = position.marketIndex as number;
            const marketInfo = DRIFT_PERP_MARKETS[marketIndex];
            if (!marketInfo) continue;

            const size = Math.abs(parseFloat(baseAssetAmount.toString()) / Math.pow(10, marketInfo.baseDecimals));
            try {
                const oracleData = (client as any).getOracleDataForPerpMarket?.(marketIndex);
                if (oracleData?.price) {
                    const price = parseFloat(oracleData.price.toString()) / 1e6;
                    totalNotional += size * price;
                }
            } catch { }
        }

        // Leverage = Total Notional / Total Equity
        const leverage = totalEquity > 0 ? totalNotional / totalEquity : 0;

        // Account Health: 100% = no positions, 0% = at liquidation
        // Health = (Equity - Maintenance Margin) / (Initial Margin - Maintenance Margin) * 100
        // Simplified: Health = Free Collateral / Total Margin * 100, capped at 100%
        const maintenanceMargin = totalNotional * 0.03; // 3% maintenance
        let accountHealth = 100;
        if (totalMarginUsed > 0) {
            // Distance from maintenance margin as percentage
            const distanceFromLiq = totalEquity - maintenanceMargin;
            const totalMarginBuffer = totalMarginUsed - maintenanceMargin;
            if (totalMarginBuffer > 0) {
                accountHealth = Math.max(0, Math.min(100, (distanceFromLiq / totalMarginBuffer) * 100));
            }
        }

        return {
            totalEquity,
            freeCollateral,
            marginUsed: totalMarginUsed,
            unrealizedPnl,
            accountHealth,
            leverage,
        };
    } catch (error) {
        console.error('[Drift] Error fetching equity:', error);
        return null;
    }
}

// Order History Types
export interface DriftOrderData {
    orderId: number;
    marketIndex: number;
    market: string;
    orderType: string;
    direction: 'Long' | 'Short';
    price: number;
    size: number;
    filledSize: number;
    status: 'Open' | 'Filled' | 'Cancelled';
    timestamp: number;
}

/**
 * Fetch open orders from Drift account
 */
export async function fetchOrderHistory(
    walletAddress: string,
    subAccountId: number = 0
): Promise<DriftOrderData[]> {
    try {
        const user = await getDriftUser(walletAddress, subAccountId);
        if (!user) return [];

        const userAccount = user.getUserAccount();
        const orders = (userAccount as any).orders || [];

        const orderList: DriftOrderData[] = [];

        for (const order of orders) {
            // Skip empty order slots
            if (!order.orderId || order.orderId.toString() === '0') {
                continue;
            }

            const marketIndex = order.marketIndex as number;
            const isPerpOrder = order.marketType?.perp !== undefined;

            // Get market name
            let marketName = isPerpOrder
                ? (DRIFT_PERP_MARKETS[marketIndex]?.name || `PERP-${marketIndex}`)
                : (DRIFT_SPOT_MARKETS[marketIndex]?.symbol || `SPOT-${marketIndex}`);

            // Determine order type
            let orderType = 'Limit';
            if (order.orderType?.market !== undefined) orderType = 'Market';
            else if (order.orderType?.limit !== undefined) orderType = 'Limit';
            else if (order.orderType?.triggerMarket !== undefined) orderType = 'Stop Market';
            else if (order.orderType?.triggerLimit !== undefined) orderType = 'Stop Limit';
            else if (order.orderType?.oracle !== undefined) orderType = 'Oracle';

            // Determine direction
            const direction = order.direction?.long !== undefined ? 'Long' : 'Short';

            // Parse price (PRICE_PRECISION = 1e6)
            const price = order.price ? parseFloat(order.price.toString()) / 1e6 : 0;

            // Parse size
            const baseDecimals = isPerpOrder
                ? (DRIFT_PERP_MARKETS[marketIndex]?.baseDecimals || 9)
                : 9;
            const size = order.baseAssetAmount
                ? Math.abs(parseFloat(order.baseAssetAmount.toString())) / Math.pow(10, baseDecimals)
                : 0;
            const filledSize = order.baseAssetAmountFilled
                ? Math.abs(parseFloat(order.baseAssetAmountFilled.toString())) / Math.pow(10, baseDecimals)
                : 0;

            // Determine status
            let status: 'Open' | 'Filled' | 'Cancelled' = 'Open';
            if (order.status?.filled !== undefined) status = 'Filled';
            else if (order.status?.canceled !== undefined) status = 'Cancelled';

            // Get timestamp (slot to approximate timestamp)
            const timestamp = order.slot ? parseInt(order.slot.toString()) * 400 : Date.now();

            orderList.push({
                orderId: parseInt(order.orderId.toString()),
                marketIndex,
                market: marketName,
                orderType,
                direction,
                price,
                size,
                filledSize,
                status,
                timestamp,
            });
        }

        // Sort by orderId descending (newest first)
        orderList.sort((a, b) => b.orderId - a.orderId);

        console.log('[Drift] Fetched', orderList.length, 'orders for', walletAddress);
        return orderList;
    } catch (error) {
        console.error('[Drift] Error fetching orders:', error);
        return [];
    }
}
