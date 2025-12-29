"use server";

import { db } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Category, TransactionType } from "@/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants/categories";

// Serialize category from DB to client format
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

// Create default categories for a new user
export async function createDefaultCategoriesForUser(userId: string) {
  const categories: any[] = [];

  // Create income categories
  for (const cat of DEFAULT_CATEGORIES.INCOME) {
    categories.push({
      userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: 'INCOME',
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
      type: 'EXPENSE',
      isSystem: true,
      isActive: true,
    });
  }

  await db.category.createMany({
    data: categories,
    skipDuplicates: true,
  });

  return categories.length;
}

// Get all categories for the current user
export async function getCategories(type?: TransactionType) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Check if user has categories, create defaults if not
    const existingCount = await db.category.count({
      where: { userId: session.user.id },
    });

    if (existingCount === 0) {
      await createDefaultCategoriesForUser(session.user.id);
    }

    const where: any = {
      userId: session.user.id,
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    const categories = await db.category.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return { categories: categories.map(serializeCategory) };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { error: "Failed to fetch categories" };
  }
}

// Create a custom category
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  parentId: z.string().optional(),
});

export async function createCategory(input: z.infer<typeof createCategorySchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const validatedData = createCategorySchema.parse(input);

    const category = await db.category.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        icon: validatedData.icon,
        color: validatedData.color,
        type: validatedData.type,
        parentId: validatedData.parentId,
        isSystem: false,
        isActive: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, category: serializeCategory(category) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Failed to create category:", error);
    return { error: "Failed to create category" };
  }
}

// Update a category (only custom categories)
export async function updateCategory(
  categoryId: string,
  data: Partial<z.infer<typeof createCategorySchema>>
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Verify ownership and that it's not a system category
    const existing = await db.category.findFirst({
      where: { 
        id: categoryId, 
        userId: session.user.id,
        isSystem: false,
      },
    });

    if (!existing) {
      return { error: "Category not found or cannot be edited" };
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.icon && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });

    revalidatePath("/dashboard");
    return { success: true, category: serializeCategory(category) };
  } catch (error) {
    return { error: "Failed to update category" };
  }
}

// Delete/deactivate a category (only custom categories)
export async function deleteCategory(categoryId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Verify ownership and that it's not a system category
    const existing = await db.category.findFirst({
      where: { 
        id: categoryId, 
        userId: session.user.id,
        isSystem: false,
      },
    });

    if (!existing) {
      return { error: "Category not found or cannot be deleted" };
    }

    // Soft delete by marking as inactive
    await db.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
}

// Get category by ID
export async function getCategoryById(categoryId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const category = await db.category.findFirst({
      where: { 
        id: categoryId,
        userId: session.user.id,
      },
    });

    if (!category) {
      return { error: "Category not found" };
    }

    return { category: serializeCategory(category) };
  } catch (error) {
    return { error: "Failed to fetch category" };
  }
}
