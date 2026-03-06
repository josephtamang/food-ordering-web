const { z } = require('zod');

const createBillSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'upi'], {
    error: 'Payment method must be: cash, card, upi',
  }).default('cash'),
});

// Query params — all strings from req.query, coerce where needed
const billQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isPaid: z.enum(['true', 'false']).optional(),
});

function buildBillFilter(parsed) {
  const filter = {};
  if (parsed.isPaid !== undefined) filter.isPaid = parsed.isPaid === 'true';
  return filter;
}

module.exports = { createBillSchema, billQuerySchema, buildBillFilter };
