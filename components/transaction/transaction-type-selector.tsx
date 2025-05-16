"use client";

import { useState } from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";

type TransactionType = "INCOME" | "EXPENSE";

interface TransactionTypeSelectorProps {
  onSelect: (type: TransactionType) => void;
  onClose: () => void;
}

export default function TransactionTypeSelector({ onSelect, onClose }: TransactionTypeSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 p-6">
      <div className="w-full max-w-md">
        <h2 className="text-white text-2xl font-semibold mb-8">Add a new transaction.</h2>
        
        <button 
          onClick={() => onSelect("INCOME")}
          className="w-full flex items-center text-white text-xl py-4 border-b border-white/30 focus:outline-none"
        >
          <FiArrowDownLeft className="mr-4" /> Income
        </button>
        
        <button 
          onClick={() => onSelect("EXPENSE")}
          className="w-full flex items-center text-white text-xl py-4 border-b border-white/30 focus:outline-none"
        >
          <FiArrowUpRight className="mr-4" /> Expense
        </button>
        
        <button 
          onClick={onClose}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-[#FAFFF5] text-black rounded-full p-4 focus:outline-none"
        >
          <FiX size={24} />
        </button>
      </div>
    </div>
  );
}
