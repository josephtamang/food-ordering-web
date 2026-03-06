const BaseRepository = require('./BaseRepository');
const Review = require('../../models/Review');

class ReviewRepository extends BaseRepository {
  constructor() { super(Review); }

  async findByProduct(productId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find({ product: productId })
        .populate('user', 'name avatar')
        .sort('-createdAt').skip(skip).limit(limit),
      this.model.countDocuments({ product: productId }),
    ]);
    return { reviews: docs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async findByUserAndProduct(userId, productId) {
    return this.model.findOne({ user: userId, product: productId });
  }

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find({ user: userId })
        .populate('product', 'name image price')
        .sort('-createdAt').skip(skip).limit(limit),
      this.model.countDocuments({ user: userId }),
    ]);
    return { reviews: docs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async findAll({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find()
        .populate('user', 'name email avatar')
        .populate('product', 'name image')
        .sort('-createdAt').skip(skip).limit(limit),
      this.model.countDocuments(),
    ]);
    return { reviews: docs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}

module.exports = new ReviewRepository();
