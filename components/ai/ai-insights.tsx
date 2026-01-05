'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateFinancialInsights } from '@/app/actions/ai';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
    className?: string;
}

interface Insight {
    text: string;
    type: 'positive' | 'neutral' | 'warning';
}

function classifyInsight(text: string): 'positive' | 'neutral' | 'warning' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('great') || lowerText.includes('good') || lowerText.includes('saving') || lowerText.includes('decreased')) {
        return 'positive';
    }
    if (lowerText.includes('warning') || lowerText.includes('overspending') || lowerText.includes('increased') || lowerText.includes('high')) {
        return 'warning';
    }
    return 'neutral';
}

export function AIInsights({ className }: AIInsightsProps) {
    const [insights, setInsights] = useState<string[]>([]);
    const [tip, setTip] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

    const fetchInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateFinancialInsights();
            if (result.error) {
                setError(result.error);
            } else {
                setInsights(result.insights);
                setTip(result.tip);
            }
        } catch (err) {
            setError('Failed to load insights');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    // Auto-rotate insights every 5 seconds
    useEffect(() => {
        if (insights.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [insights.length]);

    const currentInsight = insights[currentInsightIndex];
    const insightType = currentInsight ? classifyInsight(currentInsight) : 'neutral';

    const typeColors = {
        positive: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
        neutral: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
        warning: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    };

    const iconColors = {
        positive: 'text-emerald-500',
        neutral: 'text-blue-500',
        warning: 'text-amber-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={cn('relative overflow-hidden', className)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Sparkles className="w-5 h-5 text-[rgb(var(--primary))]" />
                        <motion.div
                            className="absolute inset-0 rounded-full bg-[rgb(var(--primary))]/30"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <span className="text-micro">AI INSIGHTS</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                        BETA
                    </span>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9, rotate: 180 }}
                    onClick={fetchInsights}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn('w-4 h-4 text-[rgb(var(--foreground-muted))]', isLoading && 'animate-spin')} />
                </motion.button>
            </div>

            {/* Content Card */}
            <motion.div
                className={cn(
                    'card border p-5 bg-gradient-to-br transition-colors duration-500',
                    typeColors[insightType]
                )}
            >
                {isLoading ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[rgb(var(--background-secondary))] animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-[rgb(var(--background-secondary))] rounded animate-pulse w-3/4" />
                            <div className="h-3 bg-[rgb(var(--background-secondary))] rounded animate-pulse w-1/2" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3 text-[rgb(var(--expense))]">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Rotating Insights */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentInsightIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-start gap-3 mb-4"
                            >
                                <div className={cn('p-2 rounded-xl bg-white/50 dark:bg-black/20', iconColors[insightType])}>
                                    {insightType === 'positive' ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : insightType === 'warning' ? (
                                        <AlertCircle className="w-4 h-4" />
                                    ) : (
                                        <Lightbulb className="w-4 h-4" />
                                    )}
                                </div>
                                <p className="text-sm leading-relaxed flex-1">{currentInsight}</p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Insight Dots */}
                        {insights.length > 1 && (
                            <div className="flex gap-1.5 justify-center mb-4">
                                {insights.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentInsightIndex(index)}
                                        className={cn(
                                            'w-1.5 h-1.5 rounded-full transition-all duration-300',
                                            index === currentInsightIndex
                                                ? 'w-4 bg-[rgb(var(--foreground))]'
                                                : 'bg-[rgb(var(--foreground))]/30'
                                        )}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Tip Section */}
                        {tip && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="pt-4 border-t border-[rgb(var(--border))]/50"
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">💡</span>
                                    <p className="text-sm text-[rgb(var(--foreground-secondary))] leading-relaxed">
                                        <span className="font-medium text-[rgb(var(--foreground))]">Tip: </span>
                                        {tip}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}
