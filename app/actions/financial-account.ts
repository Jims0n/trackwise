"use server";

import { db } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toMinorUnits, fromMinorUnits } from "@/types";
import type { AccountType, AccountStatus, FinancialAccount } from "@/types";

// Schema for validating financial account creation
const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "CASH", "INVESTMENT", "CRYPTO", "LOAN", "OTHER"]).default("CHECKING"),
  institution: z.string().optional(),
  balance: z.coerce.number().default(0), // User enters display amount
  currency: z.string().default("USD"),
  icon: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type CreateAccountFormData = z.infer<typeof createAccountSchema>;

// Serialize account from DB to client format
function serializeAccount(account: any): FinancialAccount {
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type as AccountType,
    institution: account.institution || undefined,
    balance: fromMinorUnits(account.balance), // Convert from minor units
    currency: account.currency,
    icon: account.icon || undefined,
    color: account.color || undefined,
    status: account.status as AccountStatus,
    isDefault: account.isDefault,
    sortOrder: account.sortOrder,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export async function createFinancialAccount(formData: CreateAccountFormData) {
  try {
    const validatedData = createAccountSchema.parse(formData);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in to create an account" };
    }
    
    // If this is the default account, unset any existing default accounts
    if (validatedData.isDefault) {
      await db.financialAccount.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    
    // Get max sort order for user
    const maxSort = await db.financialAccount.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    });
    
    // Create the new financial account with balance in minor units
    const account = await db.financialAccount.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        institution: validatedData.institution,
        balance: toMinorUnits(validatedData.balance), // Convert to minor units
        currency: validatedData.currency,
        icon: validatedData.icon,
        color: validatedData.color,
        isDefault: validatedData.isDefault,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
        userId: session.user.id,
      },
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    
    return { success: true, account: serializeAccount(account) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Failed to create account:", error);
    return { error: "Failed to create account. Please try again." };
  }
}

export async function getFinancialAccounts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in to view accounts" };
    }
    
    const accounts = await db.financialAccount.findMany({
      where: { 
        userId: session.user.id,
        status: "ACTIVE", // Only active accounts by default
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });
    
    return { accounts: accounts.map(serializeAccount) };
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return { error: "Failed to fetch accounts" };
  }
}

export async function getAccountById(accountId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }
    
    const account = await db.financialAccount.findFirst({
      where: { 
        id: accountId,
        userId: session.user.id,
      },
    });
    
    if (!account) {
      return { error: "Account not found" };
    }
    
    return { account: serializeAccount(account) };
  } catch (error) {
    return { error: "Failed to fetch account" };
  }
}

export async function updateFinancialAccount(
  accountId: string, 
  data: Partial<CreateAccountFormData>
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }
    
    // Verify ownership
    const existing = await db.financialAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    });
    
    if (!existing) {
      return { error: "Account not found" };
    }
    
    // Handle default account logic
    if (data.isDefault) {
      await db.financialAccount.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    
    const account = await db.financialAccount.update({
      where: { id: accountId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.institution !== undefined && { institution: data.institution }),
        ...(data.balance !== undefined && { balance: toMinorUnits(data.balance) }),
        ...(data.currency && { currency: data.currency }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    
    return { success: true, account: serializeAccount(account) };
  } catch (error) {
    return { error: "Failed to update account" };
  }
}

export async function archiveFinancialAccount(accountId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }
    
    const account = await db.financialAccount.updateMany({
      where: { id: accountId, userId: session.user.id },
      data: { status: "ARCHIVED" },
    });
    
    if (account.count === 0) {
      return { error: "Account not found" };
    }
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    
    return { success: true };
  } catch (error) {
    return { error: "Failed to archive account" };
  }
}

export async function getTotalBalance() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }
    
    const result = await db.financialAccount.aggregate({
      where: { 
        userId: session.user.id,
        status: "ACTIVE",
        type: { notIn: ["CREDIT_CARD", "LOAN"] }, // Assets only
      },
      _sum: { balance: true },
    });
    
    const liabilities = await db.financialAccount.aggregate({
      where: { 
        userId: session.user.id,
        status: "ACTIVE",
        type: { in: ["CREDIT_CARD", "LOAN"] },
      },
      _sum: { balance: true },
    });
    
    const assets = fromMinorUnits(result._sum.balance || BigInt(0));
    const debts = fromMinorUnits(liabilities._sum.balance || BigInt(0));
    
    return { 
      assets,
      liabilities: debts,
      netWorth: assets - debts,
    };
  } catch (error) {
    return { error: "Failed to calculate balance" };
  }
}
