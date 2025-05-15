"use server";

import { db } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for validating transaction creation
const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  description: z.string().optional(),
  date: z.coerce.date(),
  category: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  nextRecurringDate: z.coerce.date().optional(),
});

export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;

export async function createTransaction(formData: CreateTransactionFormData) {
  try {
    // Validate the input data
    const validatedData = createTransactionSchema.parse(formData);
    
    // Get the current user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "You must be logged in to create a transaction" };
    }
    
    // Create the new transaction
    const transaction = await db.transaction.create({
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description || null,
        date: validatedData.date,
        category: validatedData.category,
        isRecurring: validatedData.isRecurring,
        recurringInterval: validatedData.isRecurring ? validatedData.recurringInterval : null,
        nextRecurringDate: validatedData.isRecurring ? validatedData.nextRecurringDate : null,
        status: "COMPLETED",
        userId: session.user.id,
        accountId: validatedData.accountId,
      },
    });
    
    // Update account balance
    const account = await db.financialAccount.findUnique({
      where: { id: validatedData.accountId },
    });
    
    if (account) {
      const balanceChange = validatedData.type === "INCOME" ? validatedData.amount : -validatedData.amount;
      await db.financialAccount.update({
        where: { id: validatedData.accountId },
        data: { balance: { increment: balanceChange } },
      });
    }
    
    // Revalidate the dashboard path to reflect the new transaction
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    
    return { success: true, transaction };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create transaction. Please try again." };
  }
}

export async function getTransactions() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "You must be logged in to view transactions" };
    }
    
    const transactions = await db.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      include: { account: true },
    });
    
    return { transactions };
  } catch (error) {
    return { error: "Failed to fetch transactions" };
  }
}

export async function getTransactionsByAccount(accountId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "You must be logged in to view transactions" };
    }
    
    const transactions = await db.transaction.findMany({
      where: { 
        userId: session.user.id,
        accountId: accountId
      },
      orderBy: { date: "desc" },
    });
    
    return { transactions };
  } catch (error) {
    return { error: "Failed to fetch transactions" };
  }
}
