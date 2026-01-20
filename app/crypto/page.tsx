"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Wallet, TrendingUp, Shield, ArrowRight, Loader2, X, Clock } from "lucide-react";
import Link from "next/link";

interface SavedWallet {
    address: string;
    label?: string;
    lastViewed: number;
}

const STORAGE_KEY = "trackwise_saved_wallets";

export default function CryptoLandingPage() {
    const [walletInput, setWalletInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);
    const router = useRouter();

    // Load saved wallets from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const wallets = JSON.parse(stored) as SavedWallet[];
                setSavedWallets(wallets.sort((a, b) => b.lastViewed - a.lastViewed));
            }
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // Save wallet to localStorage
    const saveWallet = (address: string) => {
        const existing = savedWallets.find(w => w.address === address);
        const newWallet: SavedWallet = {
            address,
            lastViewed: Date.now(),
        };

        let updated: SavedWallet[];
        if (existing) {
            updated = savedWallets.map(w => w.address === address ? newWallet : w);
        } else {
            updated = [newWallet, ...savedWallets].slice(0, 5); // Keep max 5 wallets
        }

        setSavedWallets(updated.sort((a, b) => b.lastViewed - a.lastViewed));
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore localStorage errors
        }
    };

    // Remove wallet from saved list
    const removeWallet = (address: string) => {
        const updated = savedWallets.filter(w => w.address !== address);
        setSavedWallets(updated);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore
        }
    };

    const handleViewWallet = async (addressOverride?: string) => {
        const address = addressOverride || walletInput.trim();
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            // Validate wallet by checking if it has subaccounts
            const res = await fetch(`/api/drift/subaccounts?wallet=${address}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Invalid wallet address");
                setIsLoading(false);
                return;
            }

            if (data.count === 0) {
                setError("No Drift accounts found for this wallet");
                setIsLoading(false);
                return;
            }

            // Save wallet to localStorage
            saveWallet(address);

            // Navigate to view page
            router.push(`/crypto/view?wallet=${address}`);
        } catch (err) {
            setError("Failed to validate wallet. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--background))]">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[rgb(var(--background))]/80 backdrop-blur-xl border-b border-[rgb(var(--border))]">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">
                            track<span className="text-[rgb(var(--primary))]">wise</span>
                        </h1>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--primary))]/10 border border-[rgb(var(--primary))]/20 text-[rgb(var(--primary))] text-sm font-medium mb-8"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Drift Protocol Positions
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                    >
                        Track Your
                        <br />
                        <span className="text-[rgb(var(--primary))]">Perpetual Positions</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-[rgb(var(--foreground-muted))] max-w-2xl mx-auto mb-12"
                    >
                        Enter any Solana wallet address to view Drift Protocol positions,
                        balances, and subaccounts. Read-only, no wallet connection needed.
                    </motion.p>

                    {/* Wallet Input */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--foreground-muted))]" />
                            <input
                                type="text"
                                placeholder="Enter Solana wallet address..."
                                value={walletInput}
                                onChange={(e) => {
                                    setWalletInput(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleViewWallet()}
                                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] transition-colors font-mono text-sm"
                            />
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewWallet()}
                                disabled={!walletInput.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        View
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 text-sm text-[rgb(var(--expense))]"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Recent Wallets */}
                        {savedWallets.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="mt-6"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-4 h-4 text-[rgb(var(--foreground-muted))]" />
                                    <span className="text-sm text-[rgb(var(--foreground-muted))]">Recent Wallets</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {savedWallets.map((wallet) => (
                                        <div
                                            key={wallet.address}
                                            className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] transition-colors cursor-pointer"
                                            onClick={() => handleViewWallet(wallet.address)}
                                        >
                                            <span className="font-mono text-xs">
                                                {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeWallet(wallet.address);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgb(var(--background-secondary))] transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="max-w-4xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <FeatureCard
                        icon={<Wallet className="w-6 h-6" />}
                        title="View Any Wallet"
                        description="Enter any Solana address to view Drift positions"
                    />
                    <FeatureCard
                        icon={<TrendingUp className="w-6 h-6" />}
                        title="Real-time Data"
                        description="Live positions, PnL, and balance updates"
                    />
                    <FeatureCard
                        icon={<Shield className="w-6 h-6" />}
                        title="Read-Only"
                        description="No wallet connection or private keys needed"
                    />
                </motion.div>
            </main>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[rgb(var(--primary))]/10 flex items-center justify-center text-[rgb(var(--primary))]">
                {icon}
            </div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-[rgb(var(--foreground-muted))]">{description}</p>
        </div>
    );
}
