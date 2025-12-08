"use server";

import { db } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toMinorUnits, fromMinorUnits } from "@/types";
import type { Transaction, TransactionType, TransactionStatus, Category } from "@/types";

// Schema for validating transaction creation
const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  description: z.string().optional(),
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  toAccountId: z.string().optional(), // For transfers
  notes: z.string().optional(),
});

export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;

// Serialize transaction from DB to client format
function serializeTransaction(tx: any, category?: any): Transaction {
  return {
    id: tx.id,
    userId: tx.userId,
    accountId: tx.accountId,
    type: tx.type as TransactionType,
    status: tx.status as TransactionStatus,
    amount: fromMinorUnits(tx.amount),
    currency: tx.currency,
    description: tx.description || undefined,
    categoryId: tx.categoryId,
    category: category ? serializeCategory(category) : undefined,
    notes: tx.notes || undefined,
    date: tx.date.toISOString(),
    postedDate: tx.postedDate?.toISOString(),
    receiptUrl: tx.receiptUrl || undefined,
    recurringRuleId: tx.recurringRuleId || undefined,
    transferPairId: tx.transferPairId || undefined,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

function serializeCategory(cat: any): Category {
  return {
    id: cat.id,
    userId: cat.userId || undefined,
    name: cat.name,
    icon: cat.icon,
    color: cat.color || undefined,
    type: cat.type as TransactionType,
    parentId: cat.parentId || undefined,
    isSystem: cat.isSystem,
    isActive: cat.isActive,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  };
}

export async function createTransaction(formData: CreateTransactionFormData) {
  try {
    const validatedData = createTransactionSchema.parse(formData);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in to create a transaction" };
    }
    
    // Use atomic transaction for data integrity
    const result = await db.$transaction(async (tx) => {
      // Get account to verify ownership and get currency
      const account = await tx.financialAccount.findFirst({
        where: { id: validatedData.accountId, userId: session.user.id },
      });
      
      if (!account) {
        throw new Error("Account not found");
      }
      
      const amountMinorUnits = toMinorUnits(validatedData.amount);
      
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          type: validatedData.type,
          amount: amountMinorUnits,
          currency: account.currency,
          description: validatedData.description || null,
          date: validatedData.date,
          categoryId: validatedData.categoryId,
          notes: validatedData.notes || null,
          status: "COMPLETED",
          userId: session.user.id,
          accountId: validatedData.accountId,
        },
        include: { category: true },
      });
      
      // Update account balance atomically
      if (validatedData.type === "INCOME") {
        await tx.financialAccount.update({
          where: { id: validatedData.accountId },
          data: { balance: { increment: amountMinorUnits } },
        });
      } else if (validatedData.type === "EXPENSE") {
        await tx.financialAccount.update({
          where: { id: validatedData.accountId },
          data: { balance: { decrement: amountMinorUnits } },
        });
      } else if (validatedData.type === "TRANSFER" && validatedData.toAccountId) {
        // Handle transfer
        const transferId = crypto.randomUUID();
        
        // Debit source account
        await tx.financialAccount.update({
          where: { id: validatedData.accountId },
          data: { balance: { decrement: amountMinorUnits } },
        });
        
        // Credit destination account
        await tx.financialAccount.update({
          where: { id: validatedData.toAccountId },
          data: { balance: { increment: amountMinorUnits } },
        });
        
        // Update source transaction with transfer ID
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { transferPairId: transferId },
        });
        
        // Create matching transaction for destination
        await tx.transaction.create({
          data: {
            type: "TRANSFER",
            amount: amountMinorUnits,
            currency: account.currency,
            description: validatedData.description || null,
            date: validatedData.date,
            categoryId: validatedData.categoryId,
            status: "COMPLETED",
            userId: session.user.id,
            accountId: validatedData.toAccountId,
            transferPairId: transferId,
          },
        });
      }
      
      return transaction;
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/insights");
    
    return { success: true, transaction: serializeTransaction(result, result.category) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Failed to create transaction:", error);
    return { error: "Failed to create transaction. Please try again." };
  }
}

export async function getTransactions(options?: {
  limit?: number;
  offset?: number;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in to view transactions" };
    }
    
    const where: any = { userId: session.user.id };
    
    if (options?.accountId) where.accountId = options.accountId;
    if (options?.categoryId) where.categoryId = options.categoryId;
    if (options?.type) where.type = options.type;
    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options?.startDate) where.date.gte = options.startDate;
      if (options?.endDate) where.date.lte = options.endDate;
    }
    
    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { 
        category: true,
        account: true,
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
    
    const serialized = transactions.map(tx => ({
      ...serializeTransaction(tx, tx.category),
      account: tx.account ? {
        id: tx.account.id,
        name: tx.account.name,
        currency: tx.account.currency,
      } : undefined,
    }));
    
    return { transactions: serialized };
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return { error: "Failed to fetch transactions" };
  }
}

export async function getTransactionsByAccount(accountId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in to view transactions" };
    }
    
    const transactions = await db.transaction.findMany({
      where: { 
        userId: session.user.id,
        accountId,
      },
      orderBy: { date: "desc" },
      include: { category: true },
    });
    
    return { transactions: transactions.map(tx => serializeTransaction(tx, tx.category)) };
  } catch (error) {
    return { error: "Failed to fetch transactions" };
  }
}

export async function getTransactionStats(period: 'week' | 'month' | 'year' = 'month') {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const transactions = await db.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate },
        status: "COMPLETED",
      },
      include: { category: true },
    });
    
    let totalIncome = BigInt(0);
    let totalExpenses = BigInt(0);
    const categoryTotals: Record<string, { amount: bigint; category: any }> = {};
    
    for (const tx of transactions) {
      if (tx.type === "INCOME") {
        totalIncome += tx.amount;
      } else if (tx.type === "EXPENSE") {
        totalExpenses += tx.amount;
        
        // Track by category
        if (!categoryTotals[tx.categoryId]) {
          categoryTotals[tx.categoryId] = { amount: BigInt(0), category: tx.category };
        }
        categoryTotals[tx.categoryId].amount += tx.amount;
      }
    }
    
    const income = fromMinorUnits(totalIncome);
    const expenses = fromMinorUnits(totalExpenses);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    
    // Top spending categories
    const byCategory = Object.entries(categoryTotals)
      .map(([categoryId, data]) => ({
        categoryId,
        category: data.category?.name || 'Unknown',
        icon: data.category?.icon || '📦',
        color: data.category?.color || '#6B7280',
        amount: fromMinorUnits(data.amount),
        percentage: expenses > 0 ? (fromMinorUnits(data.amount) / expenses) * 100 : 0,
        transactionCount: transactions.filter(t => t.categoryId === categoryId).length,
      }))
      .sort((a, b) => b.amount - a.amount);
    
    return {
      income,
      expenses,
      savings,
      savingsRate,
      transactionCount: transactions.length,
      byCategory,
    };
  } catch (error) {
    console.error("Failed to get stats:", error);
    return { error: "Failed to get transaction stats" };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }
    
    // Use atomic transaction
    await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId: session.user.id },
      });
      
      if (!transaction) {
        throw new Error("Transaction not found");
      }
      
      // Reverse balance change
      if (transaction.type === "INCOME") {
        await tx.financialAccount.update({
          where: { id: transaction.accountId },
          data: { balance: { decrement: transaction.amount } },
        });
      } else if (transaction.type === "EXPENSE") {
        await tx.financialAccount.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: transaction.amount } },
        });
      }
      
      // Delete the transaction
      await tx.transaction.delete({ where: { id: transactionId } });
      
      // If it's a transfer, also delete the pair
      if (transaction.transferPairId) {
        const pair = await tx.transaction.findFirst({
          where: { 
            transferPairId: transaction.transferPairId,
            id: { not: transactionId },
          },
        });
        
        if (pair) {
          // Reverse pair balance
          await tx.financialAccount.update({
            where: { id: pair.accountId },
            data: { balance: { decrement: pair.amount } },
          });
          await tx.transaction.delete({ where: { id: pair.id } });
        }
      }
    });
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { error: "Failed to delete transaction" };
  }
}
