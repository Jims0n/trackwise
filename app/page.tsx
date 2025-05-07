"use client";

import { SignInButton } from "@/components/auth-button";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // If the user is authenticated, redirect to dashboard
  if (session && session.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-instrument">
      <div className="max-w-md w-full p-8 space-y-8 bg-primary text-primary-foreground rounded-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">trackwise<span className="text-primary">.</span></h1>
          <p className="mt-2 text-gray-600">Take control of your financial life.</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="mt-8">
            <SignInButton />
          </div>
        )}
      </div>
    </div>
  );
}
