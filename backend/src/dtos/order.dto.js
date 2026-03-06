const { z } = require('zod');

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled'];

const createOrderSchema = z.object({
  tableNumber: z.string().trim().default(''),
  notes: z.string().trim().default(''),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    error: `Invalid status. Must be: ${ORDER_STATUSES.join(', ')}`,
  }),
});

const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional().default(''),
  search: z.string().optional().default(''),
});

function buildOrderFilter(parsed, userId = null) {
  const filter = {};
  if (userId) filter.user = userId;
  if (parsed.status) filter.status = parsed.status;
  if (parsed.search) {
    filter.$or = [
      { 'items.name': { $regex: parsed.search, $options: 'i' } },
      { tableNumber: { $regex: parsed.search, $options: 'i' } },
    ];
  }
  return filter;
}

module.exports = { createOrderSchema, updateOrderStatusSchema, orderQuerySchema, buildOrderFilter };
