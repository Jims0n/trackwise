"use client";

import { FiArrowLeft, FiX, FiBriefcase, FiFileText, FiDollarSign, FiGift, FiHeart, FiShoppingBag, FiHome, FiCoffee, FiTruck, FiCreditCard, FiArrowDownLeft, FiArrowUpRight } from "react-icons/fi";
import { useState } from "react";

// Define the category types
const incomeCategories = [
  { id: "salary", name: "Salary or Wages", icon: <FiBriefcase size={20} /> },
  { id: "freelance", name: "Freelance or Contracts", icon: <FiFileText size={20} /> },
  { id: "dividends", name: "Dividends", icon: <FiDollarSign size={20} /> },
  { id: "gifts", name: "Gifts", icon: <FiGift size={20} /> },
  { id: "benefits", name: "Benefits", icon: <FiHeart size={20} /> },
  { id: "sales", name: "Item Sales", icon: <FiShoppingBag size={20} /> },
];

const expenseCategories = [
  { id: "utilities", name: "Utilities", icon: <FiHome size={20} /> },
  { id: "food", name: "Food and Drinks", icon: <FiCoffee size={20} /> },
  { id: "transportation", name: "Transportation", icon: <FiTruck size={20} /> },
  { id: "health", name: "Health and Personal Care", icon: <FiHeart size={20} /> },
  { id: "financial", name: "Financial Obligation", icon: <FiCreditCard size={20} /> },
  { id: "shopping", name: "Shopping & Entertainment", icon: <FiShoppingBag size={20} /> },
];

interface CategorySelectorProps {
  type: "INCOME" | "EXPENSE";
  onSelect: (category: string, categoryName: string) => void;
  onBack: () => void;
  onClose: () => void;
}

export default function CategorySelector({ type, onSelect, onBack, onClose }: CategorySelectorProps) {
  const categories = type === "INCOME" ? incomeCategories : expenseCategories;
  const bgColor = type === "INCOME" ? "bg-[#0F5D4F]" : "bg-[#5E1F32]";
  
  return (
    <div className={`fixed inset-0 ${bgColor} flex flex-col z-50 p-6`}>
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-white focus:outline-none">
          <FiArrowLeft size={24} />
        </button>
        <span className="ml-4 text-white text-lg">Back</span>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center">
          {type === "INCOME" ? (
            <FiArrowDownLeft className="text-white mr-2" size={24} />
          ) : (
            <FiArrowUpRight className="text-white mr-2" size={24} />
          )}
          <h2 className="text-white text-2xl font-semibold">{type === "INCOME" ? "Income" : "Expense"}</h2>
        </div>
        <p className="text-white/70 mt-1">
          Choose an {type === "INCOME" ? "income" : "expense"} category.
        </p>
      </div>
      
      <div className="flex-1 overflow-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id, category.name)}
            className="w-full flex items-center text-white py-4 border-b border-white/30 focus:outline-none"
          >
            <span className="mr-4">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
      
      <button 
        onClick={onClose}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-[#FAFFF5] text-black rounded-full p-4 focus:outline-none"
      >
        <FiX size={24} />
      </button>
    </div>
  );
}
