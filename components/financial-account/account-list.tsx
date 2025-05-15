"use client";

import { useEffect, useState } from "react";
import { getFinancialAccounts } from "@/app/actions/financial-account";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// Define a type that matches what comes back from the database
type FinancialAccount = {
  id: string;
  name: string;
  balance: number | string | { toString(): string }; // Handle Decimal type from Prisma
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function AccountList() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const result = await getFinancialAccounts();
        
        if (result.error) {
          setError(result.error);
          toast.error(result.error);
        } else if (result.accounts) {
          setAccounts(result.accounts);
        }
      } catch (err) {
        setError("Failed to load accounts");
        toast.error("Failed to load accounts");
      } finally {
        setIsLoading(false);
      }
    }

    loadAccounts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No accounts found. Create your first account to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Financial Accounts</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className={account.isDefault ? "border-primary" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  {account.isDefault && (
                    <CardDescription className="text-primary">Default Account</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Number(account.balance))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
