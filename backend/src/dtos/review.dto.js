const { z } = require('zod');

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(500, 'Comment cannot exceed 500 characters').optional().default(''),
});

const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5').optional(),
  comment: z.string().trim().max(500, 'Comment cannot exceed 500 characters').optional(),
});

module.exports = { createReviewSchema, updateReviewSchema };
