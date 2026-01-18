"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getAvailableCurrencies } from "@/lib/currency";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { updateUserPreferences } from "@/app/actions/preferences";

const currencies = getAvailableCurrencies();

export default function CurrencySelectionPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrency } = useUIStore();

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency);

  const handleNext = async () => {
    if (!selectedCurrency || !selectedCurrencyData) {
      toast.error("Please select a currency");
      return;
    }

    setIsLoading(true);

    try {
      // Save to database
      await updateUserPreferences({ defaultCurrency: selectedCurrency });

      // Store in cookie for server-side
      document.cookie = `userCurrency=${selectedCurrency}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

      // Store in Zustand for client-side
      setCurrency(selectedCurrency, selectedCurrencyData.symbol);

      setTimeout(() => {
        router.push("/dashboard");
      }, 300);
    } catch (error) {
      toast.error("Failed to save currency preference");
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex flex-col">
      {/* Progress indicator */}
      <div className="pt-safe px-6 py-4">
        <div className="h-1 bg-[rgb(var(--border))] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '50%' }}
            className="h-full bg-[rgb(var(--primary))] rounded-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-headline mb-2">
            Select your currency
          </h1>
          <p className="text-caption mb-8">
            Choose your primary currency for tracking expenses
          </p>

          {/* Currency List */}
          <div className="space-y-2">
            {currencies.map((currency, index) => (
              <motion.button
                key={currency.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCurrency(currency.code)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
                  selectedCurrency === currency.code
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold',
                  selectedCurrency === currency.code
                    ? 'bg-[rgb(var(--primary))] text-white'
                    : 'bg-[rgb(var(--background-secondary))]'
                )}>
                  {currency.symbol}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{currency.name}</p>
                  <p className="text-sm text-[rgb(var(--foreground-muted))]">{currency.code}</p>
                </div>
                {selectedCurrency === currency.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-safe py-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={isLoading || !selectedCurrency}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all',
            selectedCurrency
              ? 'bg-[rgb(var(--primary))]'
              : 'bg-[rgb(var(--foreground-muted))]'
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Setting up...</span>
            </div>
          ) : (
            <>
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
