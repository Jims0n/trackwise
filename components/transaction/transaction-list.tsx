"use client";

import { useState, useEffect } from "react";
import { getTransactions } from "@/app/actions/transaction";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { FiCoffee, FiBriefcase, FiShoppingBag, FiHome, FiCreditCard, FiGift } from "react-icons/fi";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  date: string;
  category: string;
  accountId: string;
  account: {
    name: string;
    id: string;
    balance: number;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

type TransactionListProps = {
  accountId?: string;
};

export default function TransactionList({ accountId }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const result = await getTransactions();
        if (result.error) {
          setError(result.error);
          toast.error(result.error);
        } else if (result.transactions) {
          // Filter transactions by accountId if provided
          const filteredTransactions = accountId
            ? result.transactions.filter((t: Transaction) => t.accountId === accountId)
            : result.transactions;
          
          setTransactions(filteredTransactions);
        }
      } catch (err) {
        setError("Failed to load transactions");
        toast.error("Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, [accountId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}th ${date.toLocaleString('default', { month: 'short' })}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  };

  // Function to get the appropriate icon for a category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food and Drinks':
        return <FiCoffee size={18} />;
      case 'Salary or Wages':
        return <FiBriefcase size={18} />;
      case 'Shopping':
        return <FiShoppingBag size={18} />;
      case 'Housing':
        return <FiHome size={18} />;
      case 'Bills':
        return <FiCreditCard size={18} />;
      case 'Gifts':
        return <FiGift size={18} />;
      default:
        return <FiCreditCard size={18} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
              {getCategoryIcon(transaction.category)}
            </div>
            <div>
              <p className="font-medium text-sm">
                {transaction.type === 'EXPENSE' && '↑ '}
                {transaction.type === 'INCOME' && '↓ '}
                {transaction.category}
              </p>
              <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
            </div>
          </div>
          <div className={`font-semibold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
            {transaction.type === 'INCOME' ? '+ ' : '- '}
            {formatCurrency(transaction.amount).replace('₦', '')}
          </div>
        </div>
      ))}
    </div>
  );
}
