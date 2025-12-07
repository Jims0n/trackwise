"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

// Components
import { Header } from "@/components/layout/header";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { HeroBalance } from "@/components/home/hero-balance";
import { MonthlySummary } from "@/components/home/monthly-summary";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentTransactions } from "@/components/home/recent-transactions";

// Hooks & Data
import { useDashboardData, useDemoData } from "@/hooks/use-dashboard-data";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Try real data first, fall back to demo data if no accounts exist
  const realData = useDashboardData();
  const demoData = useDemoData();
  
  // Use real data if user has accounts, otherwise show demo
  const hasRealData = realData.accounts.length > 0;
  const { netWorth, monthlyFlow, recentTransactions, isLoading } = hasRealData ? realData : demoData;
  
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
