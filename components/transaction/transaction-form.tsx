"use client";

import { useState, useEffect } from "react";
import { FiArrowLeft, FiX, FiCalendar, FiClock, FiMapPin } from "react-icons/fi";
import { FiArrowDownLeft, FiArrowUpRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { createTransaction } from "@/app/actions/transaction";
import { toast } from "sonner";

interface TransactionFormProps {
  type: "INCOME" | "EXPENSE";
  category: string;
  categoryName: string;
  accountId: string;
  onBack: () => void;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

export default function TransactionForm({ 
  type, 
  category, 
  categoryName, 
  accountId,
  onBack, 
  onClose, 
  onSuccess 
}: TransactionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [location, setLocation] = useState("");
  
  const bgColor = type === "INCOME" ? "bg-[#0F5D4F]" : "bg-[#5E1F32]";
  const iconComponent = type === "INCOME" ? 
    <FiArrowDownLeft className="text-white" size={24} /> : 
    <FiArrowUpRight className="text-white" size={24} />;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Combine date and time for the transaction
      const [hours, minutes] = time.split(':');
      const transactionDate = new Date(date);
      transactionDate.setHours(parseInt(hours), parseInt(minutes));
      
      const result = await createTransaction({
        type,
        amount: parseFloat(amount),
        description: description || `${categoryName} transaction`,
        date: transactionDate,
        category: categoryName,
        accountId,
        isRecurring: false,
      });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        onSuccess(parseFloat(amount));
      }
    } catch (error) {
      toast.error("Failed to create transaction");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`fixed inset-0 ${bgColor} flex flex-col z-50`}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="text-white focus:outline-none">
            <FiArrowLeft size={24} />
          </button>
          <span className="ml-4 text-white text-lg">Back</span>
        </div>
        
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            {iconComponent}
            <h2 className="text-white text-2xl font-semibold ml-2">{type === "INCOME" ? "Income" : "Expense"}</h2>
          </div>
          <div className="flex items-center justify-center text-white">
            {type === "INCOME" ? (
              <FiBriefcase className="mr-2" size={18} />
            ) : (
              <FiCoffee className="mr-2" size={18} />
            )}
            <span>{categoryName}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 pt-0">
        <h3 className="text-white text-xl font-medium mb-6 text-center">
          Share more details about this transaction.
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm mb-2">Label</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border-b border-white/30 text-white p-2 focus:outline-none focus:border-white"
              placeholder="What's this for?"
            />
          </div>
          
          <div>
            <label className="block text-white text-sm mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border-b border-white/30 text-white p-2 focus:outline-none focus:border-white"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="flex items-center text-white text-sm mb-2">
              <FiCalendar className="mr-2" size={16} />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent border-b border-white/30 text-white p-2 focus:outline-none focus:border-white"
              required
            />
          </div>
          
          <div>
            <label className="flex items-center text-white text-sm mb-2">
              <FiClock className="mr-2" size={16} />
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-transparent border-b border-white/30 text-white p-2 focus:outline-none focus:border-white"
              required
            />
          </div>
          
          
          
          <div className="flex justify-between pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="bg-white/10 text-white rounded-full p-4 focus:outline-none"
            >
              <FiX size={24} />
            </button>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-white text-black rounded-full p-4 focus:outline-none flex items-center justify-center"
            >
              <FiArrowRight size={24} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import the icons used in the component
import { FiBriefcase, FiCoffee, FiArrowRight } from "react-icons/fi";
