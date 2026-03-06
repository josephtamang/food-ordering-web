const BaseRepository = require('./BaseRepository');
const Order = require('../../models/Order');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async findWithPagination(filter, { page, limit }) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(filter).populate('user', 'name email').sort('-createdAt').skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findByIdPopulated(id) {
    return this.model.findById(id).populate('user', 'name email');
  }
}

module.exports = new OrderRepository();
