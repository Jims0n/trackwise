"use client";

import { FiCheck } from "react-icons/fi";

interface TransactionSuccessProps {
  type: "INCOME" | "EXPENSE";
  amount: number;
  onClose: () => void;
}

export default function TransactionSuccess({ type, amount, onClose }: TransactionSuccessProps) {
  const bgColor = type === "INCOME" ? "bg-[#0F5D4F]" : "bg-[#5E1F32]";
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'symbol',
  }).format(amount);
  
  // Auto close after 2 seconds
  setTimeout(() => {
    onClose();
  }, 2000);
  
  return (
    <div className={`fixed inset-0 ${bgColor} flex flex-col items-center justify-center z-50 p-6`}>
      <div className="flex flex-col items-center">
        <div className="bg-white rounded-full p-2 mb-6">
          <FiCheck className="text-green-600" size={32} />
        </div>
        
        <div className="text-4xl font-bold text-white mb-2">
          {type === "INCOME" ? "+" : "-"} {formattedAmount.replace('NGN', '₦')}
        </div>
        
        <p className="text-white text-center">
          {type === "INCOME" ? "Income added to" : "Expense deducted from"} your balance.
        </p>
      </div>
    </div>
  );
}
