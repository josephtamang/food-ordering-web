const BaseRepository = require('./BaseRepository');
const Bill = require('../../models/Bill');

class BillRepository extends BaseRepository {
  constructor() {
    super(Bill);
  }

  async findByOrder(orderId) {
    return this.model.findOne({ order: orderId });
  }

  async findWithPagination(filter, { page, limit }) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(filter).populate('order').populate('user', 'name email').sort('-createdAt').skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findByIdFull(id) {
    return this.model.findById(id)
      .populate({ path: 'order', populate: { path: 'items.product' } })
      .populate('user', 'name email');
  }
}

module.exports = new BillRepository();
