import { z } from "zod";

export const reviewSchema = z.object({
  comment: z.string().max(500, "Comment cannot exceed 500 characters").optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
