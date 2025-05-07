"use client";

import { SignInButton } from "@/components/auth-button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // If the user is not authenticated, redirect to home page
  if (status === "unauthenticated") {
    router.push("/");
    return null; // Return null while redirecting
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">trackwise<span className="text-primary">.</span></h1>
          <SignInButton />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-primary text-primary-foreground shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {session?.user?.name}!</h2>
          <p className="text-gray-600">
            Your financial dashboard is being set up. Soon you&apos;ll be able to track expenses, 
            manage budgets, and take control of your financial life.
          </p>
        </div>
      </main>
    </div>
  );
}
