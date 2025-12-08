"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Plus, Calendar, Receipt } from "lucide-react";
import { getFinancialAccounts } from "@/app/actions/financial-account";
import { getTransactions } from "@/app/actions/transaction";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { use } from "react";

import type { 
  FinancialAccount, 
  Transaction,
  TransactionType 
} from "@/types";

export default function AccountTransactionsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const accountId = use(params).accountId;
  const router = useRouter();
  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { currencySymbol, openAddModal } = useUIStore();

  useEffect(() => {
    async function loadData() {
      try {
        const accountsResult = await getFinancialAccounts();
        if (accountsResult.error) {
          toast.error(accountsResult.error);
          return;
        }
        
        if (!accountsResult.accounts || accountsResult.accounts.length === 0) {
          setIsLoading(false);
          return;
        }
        
        const selectedAccount = accountsResult.accounts.find(acc => acc.id === accountId);
        
        if (!selectedAccount) {
          toast.error("Account not found");
          router.push('/dashboard/accounts');
          return;
        }
        
        setAccount(selectedAccount);
        
        const transactionsResult = await getTransactions();
        if (transactionsResult.error) {
          toast.error(transactionsResult.error);
        } else if (transactionsResult.transactions) {
          const accountTransactions = transactionsResult.transactions.filter(
            (t: any) => t.accountId === selectedAccount.id
          );
          setTransactions(accountTransactions as Transaction[]);
          
          let income = 0;
          let expense = 0;
          accountTransactions.forEach((t: any) => {
            if (t.type === "INCOME") {
              income += t.amount;
            } else {
              expense += t.amount;
            }
          });
          setIncomeTotal(income);
          setExpenseTotal(expense);
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [accountId, router]);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (transaction: Transaction): string => {
    return transaction.category?.icon || '�';
  };

  const getCategoryName = (transaction: Transaction): string => {
    return transaction.category?.name || 'Uncategorized';
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-[rgb(var(--primary))]/20 border-t-[rgb(var(--primary))] rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-[rgb(var(--background-secondary))]"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-headline">{account?.name || 'Account'}</h1>
          <p className="text-caption">Transaction history</p>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6"
      >
        <p className="text-micro mb-2">CURRENT BALANCE</p>
        <p className="text-display text-[rgb(var(--primary))] tabular-nums">
          {currencySymbol}{(account?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        
        {/* Income/Expense Summary */}
        <div className="flex gap-4 mt-6 pt-4 border-t border-[rgb(var(--border))]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-lg bg-[rgb(var(--income))]/10">
                <TrendingUp className="w-3 h-3 text-[rgb(var(--income))]" />
              </div>
              <span className="text-micro">INCOME</span>
            </div>
            <p className="text-lg font-semibold text-[rgb(var(--income))] tabular-nums">
              +{currencySymbol}{incomeTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-lg bg-[rgb(var(--expense))]/10">
                <TrendingDown className="w-3 h-3 text-[rgb(var(--expense))]" />
              </div>
              <span className="text-micro">EXPENSES</span>
            </div>
            <p className="text-lg font-semibold text-[rgb(var(--expense))] tabular-nums">
              -{currencySymbol}{expenseTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transactions Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title">Transactions</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => openAddModal('EXPENSE')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add
        </motion.button>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center">
            <Receipt className="w-8 h-8 text-[rgb(var(--primary))]" />
          </div>
          <h3 className="text-title mb-2">No transactions yet</h3>
          <p className="text-caption mb-6">
            Add your first transaction to start tracking
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => openAddModal('EXPENSE')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[rgb(var(--primary))] text-white font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </motion.button>
        </motion.div>
      ) : (
        <StaggerContainer className="space-y-2">
          {transactions.map((transaction) => (
            <StaggerItem key={transaction.id}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="card card-interactive p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-lg',
                    transaction.type === 'INCOME' 
                      ? 'bg-[rgb(var(--income))]/10' 
                      : 'bg-[rgb(var(--expense))]/10'
                  )}>
                    {getCategoryIcon(transaction)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {transaction.description || getCategoryName(transaction)}
                    </p>
                    <p className="text-sm text-[rgb(var(--foreground-muted))]">
                      {getCategoryName(transaction)} · {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p className={cn(
                    'font-semibold tabular-nums',
                    transaction.type === 'INCOME' 
                      ? 'text-[rgb(var(--income))]' 
                      : 'text-[rgb(var(--expense))]'
                  )}>
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {currencySymbol}{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </PageContainer>
  );
}
