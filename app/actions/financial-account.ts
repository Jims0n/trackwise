"use server";

import { db } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for validating financial account creation
const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  balance: z.coerce.number().default(0),
  isDefault: z.boolean().default(false),
});

export type CreateAccountFormData = z.infer<typeof createAccountSchema>;

export async function createFinancialAccount(formData: CreateAccountFormData) {
  try {
    // Validate the input data
    const validatedData = createAccountSchema.parse(formData);
    
    // Get the current user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "You must be logged in to create an account" };
    }
    
    // If this is the default account, unset any existing default accounts
    if (validatedData.isDefault) {
      await db.financialAccount.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    
    // Create the new financial account
    const account = await db.financialAccount.create({
      data: {
        name: validatedData.name,
        balance: validatedData.balance,
        isDefault: validatedData.isDefault,
        userId: session.user.id,
      },
    });
    
    // Serialize the account data for client components
    const serializedAccount = {
      ...account,
      balance: Number(account.balance),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
    
    // Revalidate the dashboard path to reflect the new account
    revalidatePath("/dashboard");
    
    return { success: true, account: serializedAccount };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create account. Please try again." };
  }
}

export async function getFinancialAccounts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "You must be logged in to view accounts" };
    }
    
    const accounts = await db.financialAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    
    // Convert Decimal to number for serialization
    const serializedAccounts = accounts.map(account => ({
      ...account,
      balance: Number(account.balance),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }));
    
    return { accounts: serializedAccounts };
  } catch (_error) {
    return { error: "Failed to fetch accounts" };
  }
}
