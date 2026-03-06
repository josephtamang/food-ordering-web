const ReviewRepository = require('../repositories/ReviewRepository');
const OrderRepository = require('../repositories/OrderRepository');
const { createReviewSchema, updateReviewSchema } = require('../dtos/review.dto');
const Review = require('../../models/Review');

class ReviewController {
  async create(req, res) {
    try {
      const result = createReviewSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const productId = req.params.productId;

      // Check if user already reviewed this product
      const existing = await ReviewRepository.findByUserAndProduct(req.user._id, productId);
      if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });

      // Verify user has ordered this product (completed order)
      const Order = require('../../models/Order');
      const hasOrdered = await Order.findOne({
        user: req.user._id,
        'items.product': productId,
        status: { $in: ['completed', 'served'] },
      });
      if (!hasOrdered) return res.status(400).json({ success: false, message: 'You can only review products you have ordered' });

      const review = await ReviewRepository.create({
        user: req.user._id,
        product: productId,
        order: hasOrdered._id,
        rating: dto.rating,
        comment: dto.comment,
      });

      const populated = await Review.findById(review._id).populate('user', 'name avatar');
      res.status(201).json({ success: true, review: populated });
    } catch (error) {
      if (error.code === 11000) return res.status(400).json({ success: false, message: 'You already reviewed this product' });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getByProduct(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await ReviewRepository.findByProduct(req.params.productId, { page: parseInt(page), limit: parseInt(limit) });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const review = await ReviewRepository.findById(req.params.id);
      if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
      if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const result = updateReviewSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const updates = {};
      if (dto.rating !== undefined) updates.rating = dto.rating;
      if (dto.comment !== undefined) updates.comment = dto.comment;

      const updated = await ReviewRepository.updateById(req.params.id, updates);
      await Review.calcAverageRating(updated.product);
      const populated = await Review.findById(updated._id).populate('user', 'name avatar');
      res.status(200).json({ success: true, review: populated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const review = await ReviewRepository.findById(req.params.id);
      if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
      if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const productId = review.product;
      await Review.findByIdAndDelete(req.params.id);
      await Review.calcAverageRating(productId);
      res.status(200).json({ success: true, message: 'Review deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyReviews(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await ReviewRepository.findByUser(req.user._id, { page: parseInt(page), limit: parseInt(limit) });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await ReviewRepository.findAll({ page: parseInt(page), limit: parseInt(limit) });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ReviewController();
