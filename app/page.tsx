"use client";

import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, PieChart, Wallet, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // If the user is authenticated, redirect to dashboard
  if (session && session.user) {
    redirect("/dashboard");
  }

  const features = [
    { icon: Wallet, label: "Track Accounts" },
    { icon: TrendingUp, label: "Cash Flow" },
    { icon: PieChart, label: "Insights" },
    { icon: Shield, label: "Secure" },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-sm w-full"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold">
              track<span className="text-[rgb(var(--primary))]">wise</span>
            </h1>
            <p className="text-[rgb(var(--foreground-muted))] mt-2">
              Your personal finance companion
            </p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
              >
                <feature.icon className="w-4 h-4 text-[rgb(var(--primary))]" />
                <span className="text-sm font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Sign In Button */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-[rgb(var(--primary))]/20 border-t-[rgb(var(--primary))] rounded-full animate-spin" />
            </div>
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
            >
              <Image
                src="/google.svg"
                alt="Google"
                width={20}
                height={20}
              />
              <span className="font-medium">Continue with Google</span>
            </motion.button>
          )}

          {/* Terms */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-[rgb(var(--foreground-muted))] mt-6"
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </motion.p>

          {/* Crypto Positions Link */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-8 pt-8 border-t border-[rgb(var(--border))]"
          >
            <Link href="/crypto">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[rgb(var(--primary))]/10 to-transparent border border-[rgb(var(--primary))]/20 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary))]/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[rgb(var(--primary))]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Drift Positions</p>
                    <p className="text-xs text-[rgb(var(--foreground-muted))]">
                      View your perpetual positions
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[rgb(var(--primary))] group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="py-6 text-center"
      >
        <p className="text-micro">Made with 💚 for your finances</p>
      </motion.div>
    </div>
  );
}

