'use client';

import { motion } from 'framer-motion';
import { Bell, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface HeaderProps {
  showMenu?: boolean;
  showNotifications?: boolean;
}

export function Header({ showMenu = false, showNotifications = true }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between py-4"
    >
      {/* Left side - Logo or Menu */}
      <div className="flex items-center gap-3">
        {showMenu && (
          <button className="p-2 -ml-2 rounded-xl hover:bg-[rgb(var(--background-secondary))] transition-colors">
            <Menu className="w-5 h-5 text-[rgb(var(--foreground))]" />
          </button>
        )}
        <h1 className="text-xl font-semibold tracking-tight">
          track<span className="text-[rgb(var(--primary))]">wise</span>
        </h1>
      </div>

      {/* Right side - Actions + Avatar */}
      <div className="flex items-center gap-2">
        {showNotifications && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-xl hover:bg-[rgb(var(--background-secondary))] transition-colors"
          >
            <Bell className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-[rgb(var(--expense))] rounded-full" />
          </motion.button>
        )}

        {/* Avatar */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-[rgb(var(--border))] hover:ring-[rgb(var(--primary))] transition-all"
        >
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[rgb(var(--primary))] flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </motion.button>
      </div>
    </motion.header>
  );
}

// Simple page header with title and optional subtitle
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start justify-between mb-6"
    >
      <div>
        <h1 className="text-headline">{title}</h1>
        {subtitle && (
          <p className="text-caption mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <div>{action}</div>
      )}
    </motion.div>
  );
}
