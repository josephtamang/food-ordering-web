const BaseRepository = require('./BaseRepository');
const Cart = require('../../models/Cart');

class CartRepository extends BaseRepository {
  constructor() {
    super(Cart);
  }

  async findByUser(userId) {
    return this.model.findOne({ user: userId }).populate('items.product');
  }

  async findOrCreate(userId) {
    let cart = await this.findByUser(userId);
    if (!cart) cart = await this.model.create({ user: userId, items: [] });
    return cart;
  }

  async getPopulated(userId) {
    return this.model.findOne({ user: userId }).populate('items.product');
  }
}

module.exports = new CartRepository();
