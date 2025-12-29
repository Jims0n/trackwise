'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Wallet, Plus, BarChart3, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

type NavItem = {
  id: string;
  label: string;
  icon: typeof Home;
  href: string;
  isAction?: boolean;
};

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/dashboard' },
  { id: 'accounts', label: 'Accounts', icon: Wallet, href: '/dashboard/accounts' },
  { id: 'add', label: 'Add', icon: Plus, href: '', isAction: true },
  { id: 'insights', label: 'Insights', icon: BarChart3, href: '/dashboard/insights' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { openAddModal } = useUIStore();

  // Determine active tab from current pathname
  const getActiveTab = () => {
    if (pathname === '/dashboard') return 'home';
    if (pathname.startsWith('/dashboard/accounts')) return 'accounts';
    if (pathname.startsWith('/dashboard/insights')) return 'insights';
    if (pathname.startsWith('/dashboard/settings')) return 'settings';
    return 'home';
  };

  const activeTab = getActiveTab();

  const handleNavClick = (item: NavItem) => {
    if (item.isAction) {
      openAddModal('EXPENSE');
    } else {
      router.push(item.href);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="glass border-t border-[rgb(var(--border))]">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="relative -mt-6"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-14 h-14 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </motion.div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center justify-center py-2 px-4 relative"
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-colors duration-200',
                      isActive
                        ? 'text-[rgb(var(--primary))]'
                        : 'text-[rgb(var(--foreground-muted))]'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] mt-1 font-medium transition-colors duration-200',
                    isActive
                      ? 'text-[rgb(var(--primary))]'
                      : 'text-[rgb(var(--foreground-muted))]'
                  )}
                >
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[rgb(var(--primary))]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
