const { z } = require('zod');

const DISCOUNT_TYPES = ['none', 'percentage', 'fixed', 'bogo', 'combo'];

const bogoConfigSchema = z.object({
  buyQuantity: z.coerce.number().int().min(0).default(0),
  getQuantity: z.coerce.number().int().min(0).default(0),
}).default({ buyQuantity: 0, getQuantity: 0 });

const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required'),
  description: z.string().trim().default(''),
  price: z.coerce.number().positive('Valid price is required'),
  category: z.string().min(1, 'Category is required'),
  isVeg: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  isAvailable: z.preprocess((v) => v !== 'false' && v !== false, z.boolean()).default(true),

  discountType: z.enum(DISCOUNT_TYPES, { error: 'Invalid discount type' }).default('none'),
  discountValue: z.coerce.number().min(0, 'Discount value cannot be negative').default(0),
  bogoConfig: bogoConfigSchema,
  comboItems: z.array(z.string()).default([]),
  comboPrice: z.coerce.number().min(0).default(0),

  isFeatured: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  isHotDeal: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  isDailySpecial: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  isChefSpecial: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),

  offerLabel: z.string().trim().default(''),
  offerValidUntil: z.preprocess(
    (v) => (v ? new Date(v) : null),
    z.date().nullable().default(null)
  ),
});

const updateProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').optional(),
  description: z.string().trim().optional(),
  price: z.coerce.number().positive('Valid price is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  isVeg: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  isAvailable: z.preprocess((v) => v !== 'false' && v !== false, z.boolean()).optional(),

  discountType: z.enum(DISCOUNT_TYPES, { error: 'Invalid discount type' }).optional(),
  discountValue: z.coerce.number().min(0, 'Discount value cannot be negative').optional(),
  bogoConfig: bogoConfigSchema.optional(),
  comboItems: z.array(z.string()).optional(),
  comboPrice: z.coerce.number().min(0).optional(),

  isFeatured: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  isHotDeal: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  isDailySpecial: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  isChefSpecial: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),

  offerLabel: z.string().trim().optional(),
  offerValidUntil: z.preprocess(
    (v) => (v !== undefined ? (v ? new Date(v) : null) : undefined),
    z.date().nullable().optional()
  ),
});

const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional().default(''),
  category: z.string().optional().default(''),
  isVeg: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  isFeatured: z.string().optional(),
  isHotDeal: z.string().optional(),
  isDailySpecial: z.string().optional(),
  isChefSpecial: z.string().optional(),
  onOffer: z.string().optional(),
});

function buildProductFilter(parsed) {
  const filter = {};
  if (parsed.search) {
    filter.$or = [
      { name: { $regex: parsed.search, $options: 'i' } },
      { description: { $regex: parsed.search, $options: 'i' } },
    ];
  }
  if (parsed.category) filter.category = parsed.category;
  if (parsed.isVeg !== undefined) filter.isVeg = parsed.isVeg === 'true';
  if (parsed.minPrice !== undefined || parsed.maxPrice !== undefined) {
    filter.price = {};
    if (parsed.minPrice !== undefined) filter.price.$gte = parsed.minPrice;
    if (parsed.maxPrice !== undefined) filter.price.$lte = parsed.maxPrice;
  }
  if (parsed.isFeatured === 'true') filter.isFeatured = true;
  if (parsed.isHotDeal === 'true') filter.isHotDeal = true;
  if (parsed.isDailySpecial === 'true') filter.isDailySpecial = true;
  if (parsed.isChefSpecial === 'true') filter.isChefSpecial = true;
  if (parsed.onOffer === 'true') filter.discountType = { $ne: 'none' };
  return filter;
}

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  buildProductFilter,
};
