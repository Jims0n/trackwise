import { SignInButton } from "@/components/auth-button";
import Link from "next/link";
import { ReactNode } from "react";
import { FiHome, FiCreditCard, FiDollarSign, FiPieChart } from "react-icons/fi";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
            trackwise<span className="text-primary">.</span>
          </Link>
          <SignInButton />
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card h-[calc(100vh-4rem)] border-r border-border hidden md:block">
          <nav className="p-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors"
            >
              <FiHome className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/dashboard/accounts" 
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors"
            >
              <FiCreditCard className="h-5 w-5" />
              <span>Accounts</span>
            </Link>
            
            <Link 
              href="/dashboard/budgets" 
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors"
            >
              <FiPieChart className="h-5 w-5" />
              <span>Budgets</span>
            </Link>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
