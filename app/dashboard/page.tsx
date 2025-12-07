"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Check authentication and currency selection (must be before any conditional returns)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    
    if (status === "authenticated") {
      const hasCurrency = document.cookie.split(';').some(cookie => cookie.trim().startsWith('userCurrency='));
      
      if (!hasCurrency) {
        console.log('No currency cookie found in dashboard, redirecting to currency selection');
        router.push('/onboarding/currency');
      }
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-primary text-primary-foreground shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome, {session?.user?.name}!</h2>
        <p className="text-gray-200">
          Track your finances, manage budgets, and take control of your financial life with Trackwise.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div onClick={() => router.push('/dashboard/accounts')} className="bg-card shadow rounded-lg p-6 border border-border hover:border-primary cursor-pointer transition-colors">
          <h3 className="text-lg font-semibold mb-2">Financial Accounts</h3>
          <p className="text-muted-foreground">Create and manage your financial accounts</p>
        </div>
        
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-2">Budgets</h3>
          <p className="text-muted-foreground">Coming soon: Set and monitor your budgets</p>
        </div>
      </div>
    </div>
  );
}
