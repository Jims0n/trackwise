"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addCryptoWallet } from "@/app/actions/crypto";
import type { CryptoPlatform } from "@/types/crypto";

interface AddWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PLATFORMS = [
    { value: 'DRIFT' as CryptoPlatform, name: 'Drift Protocol', network: 'Solana', icon: '⚡' },
    // { value: 'HYPERLIQUID' as CryptoPlatform, name: 'HyperLiquid', network: 'Arbitrum', icon: '🔷', disabled: true },
];

export function AddWalletModal({ isOpen, onClose, onSuccess }: AddWalletModalProps) {
    const [platform, setPlatform] = useState<CryptoPlatform>('DRIFT');
    const [address, setAddress] = useState('');
    const [label, setLabel] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!address.trim()) {
            toast.error('Please enter a wallet address');
            return;
        }

        setIsLoading(true);
        try {
            const result = await addCryptoWallet({
                address: address.trim(),
                platform,
                label: label.trim() || undefined,
            });

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            setAddress('');
            setLabel('');
            onSuccess();
        } catch (error) {
            toast.error('Failed to add wallet');
        }
        setIsLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-[rgb(var(--card))] shadow-2xl max-h-[85vh]"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-[rgb(var(--border))]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4">
                            <h2 className="text-title">Add Wallet</h2>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full hover:bg-[rgb(var(--background-secondary))]"
                            >
                                <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-8 space-y-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                            {/* Platform Selection */}
                            <div>
                                <label className="text-micro block mb-2">PLATFORM</label>
                                <div className="space-y-2">
                                    {PLATFORMS.map((p) => (
                                        <motion.button
                                            key={p.value}
                                            type="button"
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setPlatform(p.value)}
                                            disabled={(p as any).disabled}
                                            className={cn(
                                                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                                                platform === p.value
                                                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                                                    : 'border-[rgb(var(--border))] bg-[rgb(var(--background-secondary))]',
                                                (p as any).disabled && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            <span className="text-2xl">{p.icon}</span>
                                            <div className="text-left">
                                                <p className="font-medium">{p.name}</p>
                                                <p className="text-sm text-[rgb(var(--foreground-muted))]">
                                                    {p.network}
                                                    {(p as any).disabled && ' (Coming Soon)'}
                                                </p>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Wallet Address */}
                            <div>
                                <label className="text-micro block mb-2">WALLET ADDRESS</label>
                                <input
                                    type="text"
                                    placeholder={platform === 'DRIFT' ? 'Solana address (e.g., 5abc...)' : 'Wallet address'}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] transition-colors font-mono text-sm"
                                />
                            </div>

                            {/* Optional Label */}
                            <div>
                                <label className="text-micro block mb-2">LABEL (OPTIONAL)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Main Trading"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] transition-colors"
                                />
                            </div>

                            {/* Info */}
                            <p className="text-xs text-[rgb(var(--foreground-muted))]">
                                🔒 Read-only access only. We never store or request private keys.
                            </p>

                            {/* Submit Button */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={isLoading || !address.trim()}
                                className={cn(
                                    'w-full py-4 rounded-2xl font-semibold text-white bg-[rgb(var(--primary))] transition-all',
                                    (isLoading || !address.trim()) && 'opacity-70'
                                )}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Connecting...</span>
                                    </div>
                                ) : (
                                    'Add Wallet'
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
