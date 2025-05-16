"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AccountForm from "@/components/financial-account/account-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiPlus } from "react-icons/fi";
import { getFinancialAccounts } from "@/app/actions/financial-account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type FinancialAccount = {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
};

export default function AccountsPage() {
  const [showFormModal, setShowFormModal] = useState(false);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    async function loadAccounts() {
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
    }

    loadAccounts();
  }, []);
  
  const handleAccountClick = (accountId: string) => {
    router.push(`/dashboard/accounts/${accountId}/transactions`);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Accounts</h1>
          <Button 
            onClick={() => setShowFormModal(true)} 
            className="flex items-center gap-2"
          >
            <FiPlus size={18} /> Add Account
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage your financial accounts.
        </p>
      </div>
      
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="sm:max-w-[425px] bg-[#444444] border-0">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold">Add New Account</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AccountForm onSuccess={() => setShowFormModal(false)} />
          </div>
        </DialogContent>
      </Dialog>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No accounts found. Add your first account to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card 
              key={account.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleAccountClick(account.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{account.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(account.balance)}
                </div>
                {account.isDefault && (
                  <div className="mt-2">
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Default</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
