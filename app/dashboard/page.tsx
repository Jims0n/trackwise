"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";

// Components
import { Header } from "@/components/layout/header";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { HeroBalance } from "@/components/home/hero-balance";
import { MonthlySummary } from "@/components/home/monthly-summary";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentTransactions } from "@/components/home/recent-transactions";

// Hooks & Data
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get real data only - no more demo data fallback
  const { netWorth, monthlyFlow, recentTransactions, accounts, isLoading } = useDashboardData();
  
  // Check if user has any accounts
  const hasAccounts = accounts.length > 0;
  
  // Check authentication (middleware handles currency redirect)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[rgb(var(--background))]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full border-4 border-[rgb(var(--primary))]/20 border-t-[rgb(var(--primary))] animate-spin" />
          <p className="text-caption">Loading your finances...</p>
        </motion.div>
      </div>
    );
  }

  // Show empty state for new users without accounts
  if (!hasAccounts) {
    return (
      <PageContainer className="pb-28">
        <Header />
        
        {/* Welcome Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          {/* Zero Balance */}
          <HeroBalance
            balance={0}
            change={0}
            changePercentage={0}
            label="Total Balance"
          />
          
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Get Started Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-8 text-center mt-6"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-[rgb(var(--primary))]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to TrackWise!</h2>
            <p className="text-[rgb(var(--foreground-muted))] mb-6 max-w-sm mx-auto">
              Start by adding your first account to track your finances. You can add bank accounts, credit cards, cash, and more.
            </p>
            <Link href="/dashboard/accounts">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[rgb(var(--primary))] text-white font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Your First Account
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-28">
      {/* Header */}
      <Header />

      {/* Hero Balance Section */}
      {netWorth && (
        <HeroBalance
          balance={netWorth.total}
          change={netWorth.change}
          changePercentage={netWorth.changePercentage}
          label="Total Balance"
        />
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Monthly Cash Flow Summary */}
      <StaggerContainer className="space-y-6 mt-6">
        {monthlyFlow && (
          <StaggerItem>
            <MonthlySummary
              month={monthlyFlow.month}
              year={monthlyFlow.year}
              income={monthlyFlow.income}
              expenses={monthlyFlow.expenses}
              savings={monthlyFlow.savings}
              savingsRate={monthlyFlow.savingsRate}
            />
          </StaggerItem>
        )}

        {/* Recent Transactions */}
        <StaggerItem>
          <RecentTransactions transactions={recentTransactions} limit={5} />
        </StaggerItem>
      </StaggerContainer>
    </PageContainer>
  );
}
