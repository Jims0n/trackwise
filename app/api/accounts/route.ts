import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/prisma';
import { fromMinorUnits } from '@/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await db.financialAccount.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Serialize the data with all fields and proper balance conversion
    const serializedAccounts = accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      name: account.name,
      type: account.type,
      institution: account.institution,
      balance: fromMinorUnits(account.balance), // Convert from cents to display amount
      currency: account.currency,
      icon: account.icon,
      color: account.color,
      status: account.status,
      isDefault: account.isDefault,
      sortOrder: account.sortOrder,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }));

    return NextResponse.json({ accounts: serializedAccounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
