"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Wallet,
    RefreshCw,
    ArrowLeft,
    AlertTriangle,
    Loader2,
    TrendingUp,
    TrendingDown,
    Clock,
    X,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Types
interface Position {
    market: string;
    marketIndex: number;
    direction: "Long" | "Short";
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

interface Balance {
    asset: string;
    amount: number;
    valueUsd: number;
}

interface Subaccount {
    id: number;
    exists: boolean;
}

interface Order {
    orderId: number;
    marketIndex: number;
    market: string;
    orderType: string;
    direction: "Long" | "Short";
    price: number;
    size: number;
    filledSize: number;
    status: "Open" | "Filled" | "Cancelled";
    timestamp: number;
}

function CryptoViewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const wallet = searchParams.get("wallet");

    const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
    const [selectedSubaccount, setSelectedSubaccount] = useState(0);
    const [positions, setPositions] = useState<Position[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [equity, setEquity] = useState({ totalEquity: 0, freeCollateral: 0, marginUsed: 0, unrealizedPnl: 0, accountHealth: 100, leverage: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [activeTab, setActiveTab] = useState<"positions" | "orders">("positions");

    // Fetch subaccounts
    useEffect(() => {
        if (!wallet) return;

        const fetchSubaccounts = async () => {
            try {
                const res = await fetch(`/api/drift/subaccounts?wallet=${wallet}`);
                const data = await res.json();
                if (res.ok && data.subaccounts.length > 0) {
                    setSubaccounts(data.subaccounts);
                    setSelectedSubaccount(data.subaccounts[0].id);
                }
            } catch (err) {
                console.error("Error fetching subaccounts:", err);
            }
        };

        fetchSubaccounts();
    }, [wallet]);

    // Fetch positions, balances, and orders
    const fetchData = useCallback(async () => {
        if (!wallet) return;

        try {
            setError(null);

            const [posRes, balRes, ordRes] = await Promise.all([
                fetch(`/api/drift/positions?wallet=${wallet}&subaccount=${selectedSubaccount}`),
                fetch(`/api/drift/balances?wallet=${wallet}&subaccount=${selectedSubaccount}`),
                fetch(`/api/drift/orders?wallet=${wallet}&subaccount=${selectedSubaccount}`),
            ]);

            const [posData, balData, ordData] = await Promise.all([posRes.json(), balRes.json(), ordRes.json()]);

            if (posRes.ok) {
                setPositions(posData.positions || []);
            }

            if (balRes.ok) {
                setBalances(balData.balances || []);
                setEquity(balData.equity || { totalEquity: 0, freeCollateral: 0, marginUsed: 0 });
            }

            if (ordRes.ok) {
                setOrders(ordData.orders || []);
            }

            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to fetch data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [wallet, selectedSubaccount]);

    // Initial fetch
    useEffect(() => {
        if (wallet && selectedSubaccount !== undefined) {
            setIsLoading(true);
            fetchData();
        }
    }, [wallet, selectedSubaccount, fetchData]);

    // Auto-refresh every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, 15000);

        return () => clearInterval(interval);
    }, [fetchData]);

    const handleRefresh = async () => {
        await fetchData();
        toast.success("Data refreshed");
    };

    if (!wallet) {
        router.push("/crypto");
        return null;
    }

    const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalBalance = balances.reduce((sum, b) => sum + b.valueUsd, 0);

    return (
        <div className="min-h-screen bg-[rgb(var(--background))]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[rgb(var(--background))]/80 backdrop-blur-xl border-b border-[rgb(var(--border))]">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/crypto" className="p-2 -ml-2 rounded-lg hover:bg-[rgb(var(--background-secondary))]">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-[rgb(var(--foreground-muted))]" />
                            <span className="font-mono text-sm">{shortWallet}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className="text-xs text-[rgb(var(--foreground-muted))] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="p-2 rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors"
                        >
                            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                        </motion.button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-3 rounded-xl bg-[rgb(var(--expense))]/10 border border-[rgb(var(--expense))]/20 flex items-center gap-3"
                    >
                        <AlertTriangle className="w-5 h-5 text-[rgb(var(--expense))] flex-shrink-0" />
                        <p className="text-sm text-[rgb(var(--expense))]">{error}</p>
                    </motion.div>
                )}

                {/* Subaccount Selector */}
                {subaccounts.length > 1 && (
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                        {subaccounts.map((sub) => (
                            <motion.button
                                key={sub.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedSubaccount(sub.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                                    selectedSubaccount === sub.id
                                        ? "bg-[rgb(var(--primary))] text-white"
                                        : "bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--background-secondary))]"
                                )}
                            >
                                Subaccount {sub.id}
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <SummaryCard
                        label="Total Equity"
                        value={`$${equity.totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    />
                    <SummaryCard
                        label="Unrealized PnL"
                        value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        valueColor={totalPnl >= 0 ? "income" : "expense"}
                    />
                    <SummaryCard
                        label="Free Collateral"
                        value={`$${equity.freeCollateral.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    />
                    <SummaryCard
                        label="Account Health"
                        value={`${equity.accountHealth.toFixed(0)}%`}
                        valueColor={equity.accountHealth > 50 ? "income" : equity.accountHealth > 20 ? "warning" : "expense"}
                    />
                    <SummaryCard
                        label="Leverage"
                        value={`${equity.leverage.toFixed(2)}x`}
                        valueColor={equity.leverage > 10 ? "expense" : equity.leverage > 5 ? "warning" : undefined}
                    />
                    <SummaryCard
                        label="Positions"
                        value={positions.length.toString()}
                    />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Positions / Orders - Tabbed */}
                    <div className="lg:col-span-2">
                        <div className="card p-4">
                            {/* Tabs */}
                            <div className="flex gap-1 mb-4 p-1 bg-[rgb(var(--background-secondary))] rounded-xl">
                                <button
                                    onClick={() => setActiveTab("positions")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                                        activeTab === "positions"
                                            ? "bg-[rgb(var(--card))] shadow-sm"
                                            : "text-[rgb(var(--foreground-muted))] hover:text-[rgb(var(--foreground))]"
                                    )}
                                >
                                    Open Positions ({positions.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("orders")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                                        activeTab === "orders"
                                            ? "bg-[rgb(var(--card))] shadow-sm"
                                            : "text-[rgb(var(--foreground-muted))] hover:text-[rgb(var(--foreground))]"
                                    )}
                                >
                                    Open Orders ({orders.length})
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === "positions" ? (
                                // Positions Content
                                isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="h-16 bg-[rgb(var(--background-secondary))] rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : positions.length === 0 ? (
                                    <p className="text-[rgb(var(--foreground-muted))] text-center py-8">
                                        No open positions
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {positions.map((position, index) => (
                                            <PositionRow
                                                key={`${position.market}-${index}`}
                                                position={position}
                                                onClick={() => setSelectedPosition(position)}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                // Orders Content
                                isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="h-16 bg-[rgb(var(--background-secondary))] rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : orders.length === 0 ? (
                                    <p className="text-[rgb(var(--foreground-muted))] text-center py-8">
                                        No open orders
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {orders.map((order) => (
                                            <OrderRow key={order.orderId} order={order} />
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Balances */}
                    <div>
                        <div className="card p-4">
                            <h3 className="font-semibold mb-4">Balances</h3>

                            {isLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-10 bg-[rgb(var(--background-secondary))] rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : balances.length === 0 ? (
                                <p className="text-[rgb(var(--foreground-muted))] text-center py-4">
                                    No balances found
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {balances.map((balance) => (
                                        <BalanceRow key={balance.asset} balance={balance} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Position Details Modal */}
            {selectedPosition && (
                <PositionDetailsModal
                    position={selectedPosition}
                    onClose={() => setSelectedPosition(null)}
                />
            )}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    valueColor,
}: {
    label: string;
    value: string;
    valueColor?: "income" | "expense" | "warning";
}) {
    return (
        <div className="card p-4">
            <p className="text-sm text-[rgb(var(--foreground-muted))] mb-1">{label}</p>
            <p
                className={cn(
                    "text-lg font-semibold tabular-nums",
                    valueColor === "income" && "text-[rgb(var(--income))]",
                    valueColor === "expense" && "text-[rgb(var(--expense))]",
                    valueColor === "warning" && "text-yellow-500"
                )}
            >
                {value}
            </p>
        </div>
    );
}

function PositionRow({ position, onClick }: { position: Position; onClick?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--background-secondary))] cursor-pointer hover:bg-[rgb(var(--background-secondary))]/80 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        position.direction === "Long"
                            ? "bg-[rgb(var(--income))]/10"
                            : "bg-[rgb(var(--expense))]/10"
                    )}
                >
                    {position.direction === "Long" ? (
                        <TrendingUp className="w-4 h-4 text-[rgb(var(--income))]" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-[rgb(var(--expense))]" />
                    )}
                </div>
                <div>
                    <p className="font-medium text-sm">{position.market}</p>
                    <p className="text-xs text-[rgb(var(--foreground-muted))]">
                        {position.direction} · {position.size.toFixed(4)}
                    </p>
                </div>
            </div>

            <div className="text-right">
                <p
                    className={cn(
                        "font-medium text-sm tabular-nums",
                        position.unrealizedPnl >= 0
                            ? "text-[rgb(var(--income))]"
                            : "text-[rgb(var(--expense))]"
                    )}
                >
                    {position.unrealizedPnl >= 0 ? "+" : ""}$
                    {position.unrealizedPnl.toFixed(2)}
                </p>
                <p
                    className={cn(
                        "text-xs tabular-nums",
                        position.pnlPercent >= 0
                            ? "text-[rgb(var(--income))]"
                            : "text-[rgb(var(--expense))]"
                    )}
                >
                    {position.pnlPercent >= 0 ? "+" : ""}
                    {position.pnlPercent.toFixed(2)}%
                </p>
            </div>
        </motion.div>
    );
}

function OrderRow({ order }: { order: Order }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--background-secondary))]"
        >
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        order.direction === "Long"
                            ? "bg-[rgb(var(--income))]/10"
                            : "bg-[rgb(var(--expense))]/10"
                    )}
                >
                    {order.direction === "Long" ? (
                        <TrendingUp className="w-4 h-4 text-[rgb(var(--income))]" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-[rgb(var(--expense))]" />
                    )}
                </div>
                <div>
                    <p className="font-medium text-sm">{order.market}</p>
                    <p className="text-xs text-[rgb(var(--foreground-muted))]">
                        {order.orderType} · {order.direction} · {order.size.toFixed(4)}
                    </p>
                </div>
            </div>

            <div className="text-right">
                <p className="font-medium text-sm tabular-nums">
                    ${order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className={cn(
                    "text-xs font-medium",
                    order.status === "Open" && "text-yellow-500",
                    order.status === "Filled" && "text-[rgb(var(--income))]",
                    order.status === "Cancelled" && "text-[rgb(var(--foreground-muted))]"
                )}>
                    {order.status}
                </p>
            </div>
        </motion.div>
    );
}
// Token icon URLs from common CDNs
const TOKEN_ICONS: Record<string, string> = {
    USDC: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    SOL: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    WETH: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
    BTC: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png",
    mSOL: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
    JitoSOL: "https://storage.googleapis.com/token-metadata/JitoSOL-256.png",
    WIF: "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betiez4btwel4c2rq4v6a.ipfs.cf-ipfs.com/",
    JUP: "https://static.jup.ag/jup/icon.png",
    BONK: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
    PYTH: "https://pyth.network/token.svg",
};

function BalanceRow({ balance }: { balance: Balance }) {
    const iconUrl = TOKEN_ICONS[balance.asset];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors"
        >
            <div className="flex items-center gap-3">
                {iconUrl ? (
                    <img
                        src={iconUrl}
                        alt={balance.asset}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                            // Fallback to letters if image fails
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <div className={cn(
                    "w-8 h-8 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center text-sm font-bold text-[rgb(var(--primary))]",
                    iconUrl && "hidden"
                )}>
                    {balance.asset.slice(0, 2)}
                </div>
                <span className="font-medium text-sm">{balance.asset}</span>
            </div>
            <div className="text-right">
                <p className="font-medium text-sm tabular-nums">
                    {balance.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                </p>
                <p className="text-xs text-[rgb(var(--foreground-muted))] tabular-nums">
                    ${balance.valueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
            </div>
        </motion.div>
    );
}

// Position Details Modal
function PositionDetailsModal({
    position,
    onClose
}: {
    position: Position;
    onClose: () => void;
}) {
    // Build Drift trade URL
    const marketSlug = position.market.replace('-PERP', '').toUpperCase();
    const driftUrl = `https://app.drift.trade/${marketSlug}-PERP`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[rgb(var(--card))] rounded-2xl p-6 w-full max-w-md border border-[rgb(var(--border))] shadow-xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                position.direction === "Long"
                                    ? "bg-[rgb(var(--income))]/10"
                                    : "bg-[rgb(var(--expense))]/10"
                            )}
                        >
                            {position.direction === "Long" ? (
                                <TrendingUp className="w-5 h-5 text-[rgb(var(--income))]" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-[rgb(var(--expense))]" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{position.market}</h3>
                            <p className={cn(
                                "text-sm font-medium",
                                position.direction === "Long"
                                    ? "text-[rgb(var(--income))]"
                                    : "text-[rgb(var(--expense))]"
                            )}>
                                {position.direction}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-[rgb(var(--background-secondary))] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Details Grid */}
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Size" value={position.size.toFixed(4)} />
                        <DetailItem label="Notional" value={`$${position.notionalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
                        <DetailItem label="Entry Price" value={`$${position.entryPrice.toFixed(2)}`} />
                        <DetailItem label="Mark Price" value={`$${position.markPrice.toFixed(2)}`} />
                        <DetailItem
                            label="Unrealized PnL"
                            value={`${position.unrealizedPnl >= 0 ? "+" : ""}$${position.unrealizedPnl.toFixed(2)}`}
                            valueColor={position.unrealizedPnl >= 0 ? "income" : "expense"}
                        />
                        <DetailItem
                            label="ROI"
                            value={`${position.pnlPercent >= 0 ? "+" : ""}${position.pnlPercent.toFixed(2)}%`}
                            valueColor={position.pnlPercent >= 0 ? "income" : "expense"}
                        />
                        <DetailItem
                            label="Margin"
                            value={`$${position.margin.toFixed(2)}`}
                        />
                        <DetailItem
                            label="Leverage"
                            value={`${position.leverage.toFixed(2)}x`}
                            valueColor={position.leverage > 10 ? "expense" : position.leverage > 5 ? "warning" : undefined}
                        />
                        <DetailItem
                            label="Funding Rate"
                            value={`${position.fundingRate >= 0 ? "+" : ""}${position.fundingRate.toFixed(4)}%`}
                            valueColor={
                                // For longs: positive funding = pay, negative = receive
                                // For shorts: opposite
                                position.direction === "Long"
                                    ? (position.fundingRate > 0 ? "expense" : position.fundingRate < 0 ? "income" : undefined)
                                    : (position.fundingRate < 0 ? "expense" : position.fundingRate > 0 ? "income" : undefined)
                            }
                        />
                        <DetailItem
                            label="Liq. Price"
                            value={`$${position.liquidationPrice.toFixed(2)}`}
                            valueColor="expense"
                        />
                    </div>
                </div>

                {/* TradingView Mini Chart */}
                <div className="mb-4 rounded-xl overflow-hidden border border-[rgb(var(--border))]">
                    <iframe
                        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${position.market.replace('-PERP', '').toUpperCase()
                            }USDT&interval=60&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1&showpopupbutton=0&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=BINANCE:BTCUSDT`}
                        style={{ width: '100%', height: '200px' }}
                        frameBorder="0"
                        allowTransparency
                        scrolling="no"
                    />
                </div>

                {/* Open in Drift Button */}
                <a
                    href={driftUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[rgb(var(--primary))] text-white font-medium hover:opacity-90 transition-opacity"
                >
                    Open in Drift
                    <ExternalLink className="w-4 h-4" />
                </a>
            </motion.div>
        </motion.div>
    );
}

function DetailItem({
    label,
    value,
    valueColor,
    className
}: {
    label: string;
    value: string;
    valueColor?: "income" | "expense" | "warning";
    className?: string;
}) {
    return (
        <div className={className}>
            <p className="text-xs text-[rgb(var(--foreground-muted))] mb-1">{label}</p>
            <p className={cn(
                "font-medium tabular-nums",
                valueColor === "income" && "text-[rgb(var(--income))]",
                valueColor === "expense" && "text-[rgb(var(--expense))]",
                valueColor === "warning" && "text-yellow-500"
            )}>
                {value}
            </p>
        </div>
    );
}

export default function CryptoViewPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
                </div>
            }
        >
            <CryptoViewContent />
        </Suspense>
    );
}
