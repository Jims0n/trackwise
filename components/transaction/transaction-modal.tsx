"use client";

import { useState } from "react";
import TransactionTypeSelector from "./transaction-type-selector";
import CategorySelector from "./category-selector";
import TransactionForm from "./transaction-form";
import TransactionSuccess from "./transaction-success";

type TransactionStep = "type" | "category" | "form" | "success";
type TransactionType = "INCOME" | "EXPENSE";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onTransactionComplete: () => void;
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  accountId,
  onTransactionComplete 
}: TransactionModalProps) {
  const [step, setStep] = useState<TransactionStep>("type");
  const [transactionType, setTransactionType] = useState<TransactionType | null>(null);
  const [category, setCategory] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  
  if (!isOpen) return null;
  
  const handleTypeSelect = (type: TransactionType) => {
    setTransactionType(type);
    setStep("category");
  };
  
  const handleCategorySelect = (categoryId: string, name: string) => {
    setCategory(categoryId);
    setCategoryName(name);
    setStep("form");
  };
  
  const handleSuccess = (transactionAmount: number) => {
    setAmount(transactionAmount);
    setStep("success");
  };
  
  const handleClose = () => {
    // Reset state
    setStep("type");
    setTransactionType(null);
    setCategory("");
    setCategoryName("");
    setAmount(0);
    onClose();
  };
  
  const handleTransactionComplete = () => {
    handleClose();
    onTransactionComplete();
  };
  
  return (
    <>
      {step === "type" && (
        <TransactionTypeSelector 
          onSelect={handleTypeSelect} 
          onClose={handleClose} 
        />
      )}
      
      {step === "category" && transactionType && (
        <CategorySelector 
          type={transactionType} 
          onSelect={handleCategorySelect} 
          onBack={() => setStep("type")} 
          onClose={handleClose} 
        />
      )}
      
      {step === "form" && transactionType && (
        <TransactionForm 
          type={transactionType} 
          category={category} 
          categoryName={categoryName} 
          accountId={accountId}
          onBack={() => setStep("category")} 
          onClose={handleClose} 
          onSuccess={handleSuccess} 
        />
      )}
      
      {step === "success" && transactionType && (
        <TransactionSuccess 
          type={transactionType} 
          amount={amount} 
          onClose={handleTransactionComplete} 
        />
      )}
    </>
  );
}
