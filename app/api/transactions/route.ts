import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/prisma';
import { fromMinorUnits } from '@/types';

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
            currency: true,
          },
        },
        category: true,
      },
    });

    // Serialize the data
    const serializedTransactions = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      accountId: t.accountId,
      type: t.type,
      status: t.status,
      amount: fromMinorUnits(t.amount),
      currency: t.currency,
      description: t.description,
      categoryId: t.categoryId,
      category: t.category ? {
        id: t.category.id,
        name: t.category.name,
        icon: t.category.icon,
        color: t.category.color,
        type: t.category.type,
      } : undefined,
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({ transactions: serializedTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
