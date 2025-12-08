import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

// Default categories that will be created for each new user
export const DEFAULT_CATEGORIES = {
  INCOME: [
    { name: 'Salary', icon: '💰', color: '#10B981' },
    { name: 'Freelance', icon: '💼', color: '#3B82F6' },
    { name: 'Investment', icon: '📈', color: '#8B5CF6' },
    { name: 'Gift', icon: '🎁', color: '#EC4899' },
    { name: 'Refund', icon: '↩️', color: '#6366F1' },
    { name: 'Other Income', icon: '💵', color: '#14B8A6' },
  ],
  EXPENSE: [
    { name: 'Food & Dining', icon: '🍔', color: '#F59E0B' },
    { name: 'Groceries', icon: '🛒', color: '#84CC16' },
    { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
    { name: 'Transportation', icon: '🚗', color: '#3B82F6' },
    { name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
    { name: 'Bills & Utilities', icon: '💡', color: '#F97316' },
    { name: 'Healthcare', icon: '🏥', color: '#EF4444' },
    { name: 'Travel', icon: '✈️', color: '#06B6D4' },
    { name: 'Education', icon: '📚', color: '#6366F1' },
    { name: 'Personal Care', icon: '💅', color: '#EC4899' },
    { name: 'Home', icon: '🏠', color: '#14B8A6' },
    { name: 'Insurance', icon: '🛡️', color: '#64748B' },
    { name: 'Subscriptions', icon: '📱', color: '#A855F7' },
    { name: 'Gifts & Donations', icon: '🎁', color: '#F43F5E' },
    { name: 'Other Expense', icon: '📦', color: '#6B7280' },
  ],
};

export async function createDefaultCategoriesForUser(userId: string) {
  const categories = [];

  // Create income categories
  for (const cat of DEFAULT_CATEGORIES.INCOME) {
    categories.push({
      userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: TransactionType.INCOME,
      isSystem: true,
      isActive: true,
    });
  }

  // Create expense categories
  for (const cat of DEFAULT_CATEGORIES.EXPENSE) {
    categories.push({
      userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: TransactionType.EXPENSE,
      isSystem: true,
      isActive: true,
    });
  }

  // Use createMany for efficiency
  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });

  return categories.length;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Get all users without categories
  const users = await prisma.user.findMany({
    include: {
      categories: true,
      preferences: true,
    },
  });

  for (const user of users) {
    // Create default categories if user has none
    if (user.categories.length === 0) {
      const count = await createDefaultCategoriesForUser(user.id);
      console.log(`✓ Created ${count} categories for user ${user.email}`);
    }

    // Create user preferences if not exists
    if (!user.preferences) {
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
        },
      });
      console.log(`✓ Created preferences for user ${user.email}`);
    }
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
