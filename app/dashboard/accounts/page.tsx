"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, CreditCard, Landmark, Bitcoin, PiggyBank, ChevronRight, X } from "lucide-react";
import { getFinancialAccounts, createFinancialAccount } from "@/app/actions/financial-account";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";

type FinancialAccount = {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
};

const accountIcons: Record<string, typeof Wallet> = {
  cash: Wallet,
  bank: Landmark,
  credit: CreditCard,
  crypto: Bitcoin,
  savings: PiggyBank,
};

const accountColors = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export default function AccountsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { currencySymbol } = useUIStore();
  
  const loadAccounts = async () => {
    try {
      const result = await getFinancialAccounts();
      if (result.error) {
        toast.error(result.error);
      } else if (result.accounts) {
        setAccounts(result.accounts);
      }
    } catch (error) {
      toast.error("Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);
  
  const handleAccountClick = (accountId: string) => {
    router.push(`/dashboard/accounts/${accountId}/transactions`);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  return (
    <PageContainer>
      {/* Header */}
      <PageHeader 
        title="Accounts" 
        subtitle="Manage your financial accounts"
        action={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-xl bg-[rgb(var(--primary))] text-white"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        }
      />

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6"
      >
        <p className="text-micro mb-2">TOTAL BALANCE</p>
        <p className="text-display text-[rgb(var(--primary))] tabular-nums">
          {currencySymbol}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-caption mt-2">
          Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Accounts List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-10 h-10 border-4 border-[rgb(var(--primary))]/20 border-t-[rgb(var(--primary))] rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <StaggerContainer className="space-y-3">
          {accounts.map((account, index) => (
            <StaggerItem key={account.id}>
              <AccountCard
                account={account}
                color={accountColors[index % accountColors.length]}
                onClick={() => handleAccountClick(account.id)}
                currencySymbol={currencySymbol}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadAccounts();
        }}
      />
    </PageContainer>
  );
}

function AccountCard({
  account,
  color,
  onClick,
  currencySymbol,
}: {
  account: FinancialAccount;
  color: string;
  onClick: () => void;
  currencySymbol: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full card card-interactive p-4"
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Wallet className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-[rgb(var(--foreground))]">{account.name}</p>
          <p className="text-sm text-[rgb(var(--foreground-muted))]">
            {account.isDefault ? 'Default Account' : 'Account'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg tabular-nums" style={{ color }}>
            {currencySymbol}{account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
      </div>
    </motion.button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center">
        <Wallet className="w-8 h-8 text-[rgb(var(--primary))]" />
      </div>
      <h3 className="text-title mb-2">No accounts yet</h3>
      <p className="text-caption mb-6">
        Add your first account to start tracking your finances
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[rgb(var(--primary))] text-white font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Account
      </motion.button>
    </motion.div>
  );
}

function AddAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currencySymbol } = useUIStore();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createFinancialAccount({
        name: name.trim(),
        balance: parseFloat(balance) || 0,
        isDefault,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Account created successfully!');
        setName('');
        setBalance('');
        setIsDefault(false);
        onSuccess();
      }
    } catch (error) {
      toast.error('Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[rgb(var(--card))] shadow-2xl max-h-[80vh]"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-[rgb(var(--border))]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-title">Add Account</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-[rgb(var(--background-secondary))]"
              >
                <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
              </motion.button>
            </div>

            {/* Form */}
            <div className="px-6 pb-8 space-y-4">
              <div>
                <label className="text-micro block mb-2">ACCOUNT NAME</label>
                <input
                  type="text"
                  placeholder="e.g., Main Checking"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] transition-colors"
                />
              </div>

              <div>
                <label className="text-micro block mb-2">STARTING BALANCE</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground-muted))]">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full p-4 pl-10 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] transition-colors tabular-nums"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDefault(!isDefault)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-2xl border transition-colors',
                  isDefault
                    ? 'bg-[rgb(var(--primary))]/10 border-[rgb(var(--primary))]'
                    : 'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border))]'
                )}
              >
                <span className="font-medium">Set as default account</span>
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  isDefault
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]'
                    : 'border-[rgb(var(--border))]'
                )}>
                  {isDefault && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  'w-full py-4 rounded-2xl font-semibold text-white bg-[rgb(var(--primary))] transition-all mt-4',
                  isSubmitting && 'opacity-70'
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
