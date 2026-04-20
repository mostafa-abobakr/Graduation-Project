import * as z from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  unit: z.string().min(1, "Unit of measurement is required"),
  unitPrice: z.number().min(0, "Price must be a positive value"),
  supplier: z.string().min(2, "Supplier is required"),
  
  // Expanded Schema elements
  category: z.string().min(2, "Category is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  reorderLevel: z.number().min(0, "Reorder level cannot be negative"),
  
  // Shelf Life handling
  isNonPerishable: z.boolean().default(false),
  shelfLife: z.number().nullable().optional(),
}).superRefine((data, ctx) => {
    // If it's a perishable item, require a shelf life greater than 0
    if (!data.isNonPerishable && (!data.shelfLife || data.shelfLife <= 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["shelfLife"],
            message: "Shelf life must be greater than zero for perishable items",
        });
    }
});

// For Menu Recipe handling
export const recipeIngredientSchema = z.object({
  ingredientId: z.number(),
  quantity: z.number().positive("Quantity must be greater than zero")
});

export const menuRecipeSchema = z.object({
  recipe: z.array(recipeIngredientSchema).min(1, "Recipe must have at least one ingredient")
});
