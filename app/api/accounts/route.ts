import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await db.financialAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Serialize the data
    const serializedAccounts = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      balance: Number(account.balance),
      isDefault: account.isDefault,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }));

    return NextResponse.json({ accounts: serializedAccounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
