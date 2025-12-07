'use client';

import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface HeroBalanceProps {
  balance: number;
  change: number;
  changePercentage: number;
  label?: string;
}

// Animated counter component
function AnimatedNumber({ value, currency = '$' }: { value: number; currency?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 1,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(v),
    });

    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayValue);

  return (
    <span className="tabular-nums">
      {currency}{formatted}
    </span>
  );
}

export function HeroBalance({
  balance,
  change,
  changePercentage,
  label = 'Total Balance',
}: HeroBalanceProps) {
  const [isHidden, setIsHidden] = useState(false);
  const { currencySymbol } = useUIStore();
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-center py-8"
    >
      {/* Label with hide toggle */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-micro">{label}</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsHidden(!isHidden)}
          className="p-1 rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors"
        >
          {isHidden ? (
            <EyeOff className="w-4 h-4 text-[rgb(var(--foreground-muted))]" />
          ) : (
            <Eye className="w-4 h-4 text-[rgb(var(--foreground-muted))]" />
          )}
        </motion.button>
      </div>

      {/* Balance amount */}
      <motion.div
        className="text-display mb-4"
        animate={{ scale: isHidden ? 0.95 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isHidden ? (
          <span className="tracking-wider">••••••</span>
        ) : (
          <AnimatedNumber value={balance} currency={currencySymbol} />
        )}
      </motion.div>

      {/* Change indicator */}
      {!isHidden && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
            isPositive
              ? 'bg-[rgb(var(--income))]/10 text-[rgb(var(--income))]'
              : 'bg-[rgb(var(--expense))]/10 text-[rgb(var(--expense))]'
          )}
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: isPositive ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </motion.div>
          <span>
            {isPositive ? '+' : ''}
            {currencySymbol}{Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs opacity-80">
            ({isPositive ? '+' : ''}{changePercentage.toFixed(1)}%)
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact version for use in cards
export function CompactBalance({
  balance,
  label,
  icon,
  color = 'primary',
}: {
  balance: number;
  label: string;
  icon?: React.ReactNode;
  color?: 'income' | 'expense' | 'primary' | 'secondary';
}) {
  const { currencySymbol } = useUIStore();

  const colorClasses = {
    income: 'text-[rgb(var(--income))]',
    expense: 'text-[rgb(var(--expense))]',
    primary: 'text-[rgb(var(--primary))]',
    secondary: 'text-[rgb(var(--secondary))]',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="card card-interactive p-4"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn('p-2 rounded-xl bg-[rgb(var(--background-secondary))]', colorClasses[color])}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-micro mb-1">{label}</p>
          <p className={cn('text-title tabular-nums', colorClasses[color])}>
            {currencySymbol}{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
