"use client";

import { useState, useEffect } from "react";
import TransactionList from "@/components/transaction/transaction-list";
import TransactionModal from "@/components/transaction/transaction-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FiPlus, FiChevronDown, FiArrowDown, FiArrowUp, FiUser } from "react-icons/fi";
import { getFinancialAccounts } from "@/app/actions/financial-account";
import { getTransactions } from "@/app/actions/transaction";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { use } from "react";

type FinancialAccount = {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
};

export default function AccountTransactionsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const accountId = use(params).accountId;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("This Month");
  const { data: session } = useSession();

  useEffect(() => {
    async function loadData() {
      try {
        // Load accounts
        const accountsResult = await getFinancialAccounts();
        if (accountsResult.error) {
          toast.error(accountsResult.error);
          return;
        }
        
        if (!accountsResult.accounts || accountsResult.accounts.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Find the account by ID
        const selectedAccount = accountsResult.accounts.find(acc => acc.id === accountId);
        
        if (!selectedAccount) {
          toast.error("Account not found");
          setIsLoading(false);
          return;
        }
        
        setAccount(selectedAccount);
        
        // Load transactions
        const transactionsResult = await getTransactions();
        if (transactionsResult.error) {
          toast.error(transactionsResult.error);
        } else if (transactionsResult.transactions) {
          // Filter transactions for the selected account
          const accountTransactions = transactionsResult.transactions.filter(
            (t: any) => t.accountId === selectedAccount.id
          );
          setTransactions(accountTransactions);
          
          // Calculate income and expense totals
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
  }, [accountId]);

  const handleAddTransaction = () => {
    if (!account) {
      toast.error("Please create an account first");
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleTransactionComplete = () => {
    // Reload data after transaction is created
    setIsModalOpen(false);
    window.location.reload();
  };

  return (
    <div className="max-w-md mx-auto pb-20">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <>
          {/* Header with greeting */}
          <div className="text-center py-8">
            <h2 className="text-2xl font-medium">Hello, {session?.user?.name?.split(' ')[0] || 'User'}.</h2>
            <p className="text-gray-500 text-sm mt-1">Add a new transaction to get started.</p>
          </div>
          
          {/* Current Balance */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm mb-1">Current Balance</p>
            <h1 className="text-5xl font-bold">{formatCurrency(account?.balance || 0)}</h1>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gray-200 mb-6"></div>
          
          {/* Income & Expenses */}
          <div className="flex justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <span className="mr-1">↓</span> Income
              </div>
              <p className="text-2xl font-bold">{formatCurrency(incomeTotal)}</p>
            </div>
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end text-sm text-gray-500 mb-1">
                <span className="mr-1">↑</span> Expenses
              </div>
              <p className="text-2xl font-bold">{formatCurrency(expenseTotal)}</p>
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gray-200 mb-4"></div>
          
          {/* Recent Transactions */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Recent Transactions</h3>
            <div className="flex items-center text-sm text-gray-500">
              {selectedMonth} <FiChevronDown className="ml-1" />
            </div>
          </div>
          
          {/* Transactions list */}
          {transactions.length > 0 ? (
            <TransactionList accountId={accountId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No transactions found</p>
              <Button onClick={handleAddTransaction} variant="outline">Add your first transaction</Button>
            </div>
          )}
        </>
      )}
      
      {/* Floating Action Button */}
      <div className="fixed bottom-8 inset-x-0 flex justify-center">
        <button
          onClick={handleAddTransaction}
          className="bg-black text-white rounded-full p-4 shadow-lg hover:bg-gray-800 transition-colors focus:outline-none"
        >
          <FiPlus size={24} />
        </button>
      </div>
      
      {/* Transaction modal */}
      {isModalOpen && account && (
        <TransactionModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onTransactionComplete={handleTransactionComplete}
          accountId={account.id}
        />
      )}
    </div>
  );
}
