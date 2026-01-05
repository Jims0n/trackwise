"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Palette,
  Globe,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
  X,
  CreditCard,
  FileText,
  Sparkles,
  Download,
  Info
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { PageContainer, StaggerContainer, StaggerItem } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { updateUserPreferences, exportTransactionsCSV, getAppInfo, getUserPreferences } from "@/app/actions/preferences";
import { getAIProvider } from "@/app/actions/ai";

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const accentColors = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme, currency, currencySymbol, setCurrency, accentColor, setAccentColor } = useUIStore();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // AI settings
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [aiAvailable, setAiAvailable] = useState<string[]>([]);

  // App info
  const [appVersion, setAppVersion] = useState('2.0.0');
  const [transactionCount, setTransactionCount] = useState(0);

  // Load preferences and app info
  useEffect(() => {
    async function loadData() {
      const [prefsResult, aiResult, infoResult] = await Promise.all([
        getUserPreferences(),
        getAIProvider(),
        getAppInfo(),
      ]);

      if (prefsResult.preferences) {
        setEmailNotifications(prefsResult.preferences.emailNotifications);
        setBudgetAlerts(prefsResult.preferences.budgetAlerts);
        setWeeklyDigest(prefsResult.preferences.weeklyDigest);
      }

      if (aiResult.provider) {
        setAiProvider(aiResult.provider);
        setAiAvailable(aiResult.available);
      }

      if (infoResult.success) {
        setAppVersion(infoResult.version!);
        setTransactionCount(infoResult.transactionCount!);
      }
    }
    loadData();
  }, []);

  const handleCurrencySelect = async (code: string, symbol: string) => {
    setCurrency(code, symbol);
    document.cookie = `userCurrency=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    // Save to database
    await updateUserPreferences({ defaultCurrency: code });

    setShowCurrencyPicker(false);
    toast.success(`Currency changed to ${code}`);
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    await updateUserPreferences({ theme: newTheme });
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleAccentColorChange = async (color: string, name: string) => {
    setAccentColor(color);
    await updateUserPreferences({ accentColor: color });
    setShowColorPicker(false);
    toast.success(`Accent color changed to ${name}`);
  };

  const handleNotificationToggle = async (type: 'email' | 'budget' | 'digest', value: boolean) => {
    switch (type) {
      case 'email':
        setEmailNotifications(value);
        await updateUserPreferences({ emailNotifications: value });
        break;
      case 'budget':
        setBudgetAlerts(value);
        await updateUserPreferences({ budgetAlerts: value });
        break;
      case 'digest':
        setWeeklyDigest(value);
        await updateUserPreferences({ weeklyDigest: value });
        break;
    }
    toast.success('Preferences updated');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await exportTransactionsCSV();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Create and download CSV file
      const blob = new Blob([result.csv!], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trackwise-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${result.count} transactions`);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Settings"
        subtitle="Customize your experience"
      />

      <StaggerContainer className="space-y-6">
        {/* Profile Card */}
        <StaggerItem>
          <motion.div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[rgb(var(--border))]">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[rgb(var(--primary))] flex items-center justify-center">
                    <span className="text-white text-2xl font-semibold">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-title">{session?.user?.name || 'User'}</h3>
                <p className="text-caption">{session?.user?.email}</p>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

        {/* Appearance Section */}
        <StaggerItem>
          <div className="space-y-2">
            <p className="text-micro px-1">APPEARANCE</p>
            <div className="card overflow-hidden divide-y divide-[rgb(var(--border))]">
              {/* Theme */}
              <SettingsRow
                icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                title="Theme"
                subtitle={theme === 'light' ? 'Light' : 'Dark'}
                onClick={() => { }}
                trailing={
                  <div className="flex items-center gap-2 bg-[rgb(var(--background-secondary))] p-1 rounded-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleThemeChange('light'); }}
                      className={cn(
                        'p-2 rounded-full transition-colors',
                        theme === 'light' && 'bg-[rgb(var(--card))] shadow-sm'
                      )}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleThemeChange('dark'); }}
                      className={cn(
                        'p-2 rounded-full transition-colors',
                        theme === 'dark' && 'bg-[rgb(var(--card))] shadow-sm'
                      )}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                  </div>
                }
              />

              {/* Accent Color */}
              <SettingsRow
                icon={<Palette className="w-5 h-5" />}
                title="Accent Color"
                subtitle="Customize app color"
                onClick={() => setShowColorPicker(true)}
                trailing={
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                }
              />
            </div>
          </div>
        </StaggerItem>

        {/* Preferences Section */}
        <StaggerItem>
          <div className="space-y-2">
            <p className="text-micro px-1">PREFERENCES</p>
            <div className="card overflow-hidden divide-y divide-[rgb(var(--border))]">
              {/* Currency */}
              <SettingsRow
                icon={<Globe className="w-5 h-5" />}
                title="Currency"
                subtitle={`${currency} (${currencySymbol})`}
                onClick={() => setShowCurrencyPicker(true)}
              />

              {/* Notifications */}
              <SettingsRow
                icon={<Bell className="w-5 h-5" />}
                title="Email Notifications"
                subtitle="Get updates via email"
                onClick={() => handleNotificationToggle('email', !emailNotifications)}
                trailing={
                  <Toggle enabled={emailNotifications} />
                }
              />

              <SettingsRow
                icon={<Bell className="w-5 h-5" />}
                title="Budget Alerts"
                subtitle="Notify when over budget"
                onClick={() => handleNotificationToggle('budget', !budgetAlerts)}
                trailing={
                  <Toggle enabled={budgetAlerts} />
                }
              />

              <SettingsRow
                icon={<Bell className="w-5 h-5" />}
                title="Weekly Digest"
                subtitle="Summary every Monday"
                onClick={() => handleNotificationToggle('digest', !weeklyDigest)}
                trailing={
                  <Toggle enabled={weeklyDigest} />
                }
              />
            </div>
          </div>
        </StaggerItem>

        {/* AI Settings */}
        {aiAvailable.length > 0 && (
          <StaggerItem>
            <div className="space-y-2">
              <p className="text-micro px-1">AI FEATURES</p>
              <div className="card overflow-hidden divide-y divide-[rgb(var(--border))]">
                <SettingsRow
                  icon={<Sparkles className="w-5 h-5" />}
                  title="AI Provider"
                  subtitle={`Using ${aiProvider === 'openai' ? 'OpenAI GPT-4o-mini' : 'Google Gemini 2.0'}`}
                  onClick={() => { }}
                  trailing={
                    <span className="text-xs text-[rgb(var(--foreground-muted))] px-2 py-1 rounded-full bg-[rgb(var(--background-secondary))]">
                      {aiAvailable.join(' + ').toUpperCase()}
                    </span>
                  }
                />
              </div>
            </div>
          </StaggerItem>
        )}

        {/* Data Section */}
        <StaggerItem>
          <div className="space-y-2">
            <p className="text-micro px-1">DATA</p>
            <div className="card overflow-hidden divide-y divide-[rgb(var(--border))]">
              <SettingsRow
                icon={<CreditCard className="w-5 h-5" />}
                title="Accounts"
                subtitle="Manage connected accounts"
                onClick={() => router.push('/dashboard/accounts')}
              />
              <SettingsRow
                icon={<FileText className="w-5 h-5" />}
                title="Export Data"
                subtitle={`Export ${transactionCount} transactions`}
                onClick={handleExportData}
                trailing={
                  isExporting ? (
                    <div className="animate-spin">
                      <Download className="w-5 h-5" />
                    </div>
                  ) : (
                    <Download className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />
                  )
                }
              />
              <SettingsRow
                icon={<Shield className="w-5 h-5" />}
                title="Privacy & Security"
                subtitle="Your data is encrypted"
                onClick={() => { }}
                trailing={
                  <span className="text-xs text-[rgb(var(--income))] px-2 py-1 rounded-full bg-[rgb(var(--income))]/10">
                    Protected
                  </span>
                }
              />
            </div>
          </div>
        </StaggerItem>

        {/* Support Section */}
        <StaggerItem>
          <div className="space-y-2">
            <p className="text-micro px-1">ABOUT</p>
            <div className="card overflow-hidden divide-y divide-[rgb(var(--border))]">
              <SettingsRow
                icon={<Info className="w-5 h-5" />}
                title="App Version"
                subtitle={`v${appVersion}`}
                onClick={() => { }}
                trailing={
                  <span className="text-xs text-[rgb(var(--foreground-muted))]">
                    Latest
                  </span>
                }
              />
              <SettingsRow
                icon={<HelpCircle className="w-5 h-5" />}
                title="Help & Support"
                subtitle="Get help with the app"
                onClick={() => window.open('mailto:support@trackwise.app', '_blank')}
              />
            </div>
          </div>
        </StaggerItem>

        {/* Sign Out */}
        <StaggerItem>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full card p-4 flex items-center justify-center gap-2 text-[rgb(var(--expense))]"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </motion.button>
        </StaggerItem>
      </StaggerContainer>

      {/* Currency Picker Modal */}
      <PickerModal
        isOpen={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="Select Currency"
      >
        <div className="space-y-1">
          {currencies.map((c) => (
            <motion.button
              key={c.code}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCurrencySelect(c.code, c.symbol)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-2xl transition-colors',
                currency === c.code
                  ? 'bg-[rgb(var(--primary))]/10'
                  : 'hover:bg-[rgb(var(--background-secondary))]'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold w-10">{c.symbol}</span>
                <div className="text-left">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-[rgb(var(--foreground-muted))]">{c.code}</p>
                </div>
              </div>
              {currency === c.code && (
                <Check className="w-5 h-5 text-[rgb(var(--primary))]" />
              )}
            </motion.button>
          ))}
        </div>
      </PickerModal>

      {/* Color Picker Modal */}
      <PickerModal
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        title="Select Accent Color"
      >
        <div className="grid grid-cols-3 gap-3">
          {accentColors.map((color) => (
            <motion.button
              key={color.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAccentColorChange(color.value, color.name)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                accentColor === color.value
                  ? 'border-[rgb(var(--foreground))]'
                  : 'border-transparent bg-[rgb(var(--background-secondary))]'
              )}
            >
              <div
                className="w-10 h-10 rounded-full"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm font-medium">{color.name}</span>
            </motion.button>
          ))}
        </div>
      </PickerModal>
    </PageContainer>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={cn(
        'w-11 h-6 rounded-full transition-colors relative',
        enabled ? 'bg-[rgb(var(--income))]' : 'bg-[rgb(var(--background-secondary))]'
      )}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-[rgb(var(--background-secondary))] transition-colors"
    >
      <div className="p-2 rounded-xl bg-[rgb(var(--background-secondary))] text-[rgb(var(--foreground-secondary))]">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-[rgb(var(--foreground-muted))]">{subtitle}</p>
      </div>
      {trailing || <ChevronRight className="w-5 h-5 text-[rgb(var(--foreground-muted))]" />}
    </motion.button>
  );
}

function PickerModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[rgb(var(--card))] shadow-2xl max-h-[70vh]"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-[rgb(var(--border))]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-title">{title}</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-[rgb(var(--background-secondary))]"
              >
                <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto max-h-[calc(70vh-80px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
