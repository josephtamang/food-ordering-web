import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  // Promotional flags
  isFeatured: z.boolean().optional(),
  isHotDeal: z.boolean().optional(),
  isDailySpecial: z.boolean().optional(),
  isChefSpecial: z.boolean().optional(),
  // Discount fields
  discountType: z.enum(["none", "percentage", "fixed", "bogo", "combo"]).default("none").optional(),
  discountValue: z.coerce.number().min(0).optional(),
  offerLabel: z.string().optional(),
  offerValidUntil: z.string().optional(),
  // BOGO config
  bogoQuantity: z.coerce.number().min(0).optional(),
  bogoFreeQuantity: z.coerce.number().min(0).optional(),
});

export const orderCheckoutSchema = z.object({
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type OrderCheckoutInput = z.infer<typeof orderCheckoutSchema>;
