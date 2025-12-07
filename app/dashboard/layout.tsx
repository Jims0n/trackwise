'use client';

import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AddTransactionModal } from "@/components/modals/add-transaction-modal";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      
      {/* Bottom Navigation */}
      <BottomNav />
      
      {/* Global Modals */}
      <AddTransactionModal />
    </div>
  );
}
