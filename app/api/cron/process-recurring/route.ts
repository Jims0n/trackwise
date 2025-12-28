import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { toMinorUnits, fromMinorUnits } from '@/types';

// This endpoint processes recurring transactions
// Should be called by a cron job (Vercel Cron, etc.)
// Schedule: Daily at midnight UTC

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let processedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    // Find all active recurring rules due for processing
    const dueRules = await db.recurringRule.findMany({
      where: {
        status: 'ACTIVE',
        nextOccurrence: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    });

    for (const rule of dueRules) {
      try {
        // Check if max occurrences reached
        if (rule.maxOccurrences && rule.occurrenceCount >= rule.maxOccurrences) {
          await db.recurringRule.update({
            where: { id: rule.id },
            data: { status: 'COMPLETED' },
          });
          continue;
        }

        await db.$transaction(async (tx) => {
          // Get account to get currency
          const account = await tx.financialAccount.findUnique({
            where: { id: rule.accountId },
          });

          if (!account) {
            throw new Error(`Account ${rule.accountId} not found`);
          }

          // Create the transaction
          const transaction = await tx.transaction.create({
            data: {
              userId: rule.userId,
              accountId: rule.accountId,
              type: rule.type,
              amount: rule.amount,
              currency: rule.currency,
              description: rule.description,
              categoryId: rule.categoryId,
              date: rule.nextOccurrence!,
              status: rule.autoPost ? 'COMPLETED' : 'PENDING',
              recurringRuleId: rule.id,
            },
          });

          // Update account balance if auto-posted and not a transfer
          if (rule.autoPost && rule.type !== 'TRANSFER') {
            if (rule.type === 'INCOME') {
              await tx.financialAccount.update({
                where: { id: rule.accountId },
                data: { balance: { increment: rule.amount } },
              });
            } else if (rule.type === 'EXPENSE') {
              await tx.financialAccount.update({
                where: { id: rule.accountId },
                data: { balance: { decrement: rule.amount } },
              });
            }
          }

          // Calculate next occurrence
          const nextDate = calculateNextOccurrence(rule);
          const newOccurrenceCount = rule.occurrenceCount + 1;

          // Check if rule should be completed
          const shouldComplete =
            (rule.maxOccurrences && newOccurrenceCount >= rule.maxOccurrences) ||
            (rule.endDate && nextDate && nextDate > rule.endDate);

          // Update the rule
          await tx.recurringRule.update({
            where: { id: rule.id },
            data: {
              occurrenceCount: newOccurrenceCount,
              lastOccurrence: rule.nextOccurrence,
              lastProcessedAt: now,
              nextOccurrence: shouldComplete ? null : nextDate,
              status: shouldComplete ? 'COMPLETED' : 'ACTIVE',
            },
          });
        });

        processedCount++;
      } catch (error) {
        console.error(`Failed to process rule ${rule.id}:`, error);
        errors.push(`Rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

function calculateNextOccurrence(rule: any): Date | null {
  if (!rule.nextOccurrence) return null;

  const current = new Date(rule.nextOccurrence);
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'DAILY':
      current.setDate(current.getDate() + interval);
      break;
    case 'WEEKLY':
      current.setDate(current.getDate() + 7 * interval);
      break;
    case 'BIWEEKLY':
      current.setDate(current.getDate() + 14 * interval);
      break;
    case 'MONTHLY':
      current.setMonth(current.getMonth() + interval);
      // Handle month overflow (e.g., Jan 31 -> Feb 28)
      if (rule.dayOfMonth) {
        const targetDay = Math.min(rule.dayOfMonth, getDaysInMonth(current));
        current.setDate(targetDay);
      }
      break;
    case 'QUARTERLY':
      current.setMonth(current.getMonth() + 3 * interval);
      break;
    case 'YEARLY':
      current.setFullYear(current.getFullYear() + interval);
      break;
    default:
      return null;
  }

  return current;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// For manual triggering in development
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  // Reuse GET logic
  return GET(request);
}
