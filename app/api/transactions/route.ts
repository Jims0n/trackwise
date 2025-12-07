import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const accountId = searchParams.get('accountId');

    const whereClause: any = { userId: session.user.id };
    if (accountId) {
      whereClause.accountId = accountId;
    }

    const transactions = await db.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Serialize the data
    const serializedTransactions = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      date: t.date.toISOString(),
      category: t.category,
      accountId: t.accountId,
      accountName: t.account.name,
      isRecurring: t.isRecurring,
      recurringInterval: t.recurringInterval,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({ transactions: serializedTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
