
import { AccountList } from "@/components/financial-account/account-list";
import AccountForm from "@/components/financial-account/account-form";

export default function AccountsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Financial Accounts</h1>
        <p className="text-muted-foreground">
          Manage your financial accounts and track your balances.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <AccountList />
        </div>
        <div>
          <AccountForm />
        </div>
      </div>
    </div>
  );
}
