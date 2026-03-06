const BaseRepository = require('./BaseRepository');
const Product = require('../../models/Product');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async findWithFilters(filter, { page, limit, sortBy, order }) {
    const skip = (page - 1) * limit;
    // Always include _id as tiebreaker to guarantee stable ordering across pages
    const sort = { [sortBy]: order, _id: 1 };
    const [docs, total] = await Promise.all([
      this.model.find(filter).populate('category', 'name').sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findByIdPopulated(id) {
    return this.model.findById(id).populate('category', 'name').populate('comboItems', 'name price image finalPrice');
  }

  async findFeaturedProducts(limit = 6) {
    return this.model.find({ isFeatured: true, isAvailable: true })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findHotDeals(limit = 6) {
    return this.model.find({ isHotDeal: true, isAvailable: true })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findDailySpecials(limit = 6) {
    return this.model.find({ isDailySpecial: true, isAvailable: true })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findChefSpecials(limit = 6) {
    return this.model.find({ isChefSpecial: true, isAvailable: true })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findWithOffers() {
    return this.model.find({ discountType: { $ne: 'none' }, isAvailable: true })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
  }

  async toggleFeatured(id) {
    const product = await this.model.findById(id);
    if (!product) return null;
    product.isFeatured = !product.isFeatured;
    return product.save();
  }

  async toggleHotDeal(id) {
    const product = await this.model.findById(id);
    if (!product) return null;
    product.isHotDeal = !product.isHotDeal;
    return product.save();
  }

  async toggleDailySpecial(id) {
    const product = await this.model.findById(id);
    if (!product) return null;
    product.isDailySpecial = !product.isDailySpecial;
    return product.save();
  }

  async toggleChefSpecial(id) {
    const product = await this.model.findById(id);
    if (!product) return null;
    product.isChefSpecial = !product.isChefSpecial;
    return product.save();
  }

  async setDiscount(id, discountData) {
    return this.model.findByIdAndUpdate(id, discountData, { new: true });
  }

  async removeDiscount(id) {
    return this.model.findByIdAndUpdate(id, {
      discountType: 'none',
      discountValue: 0,
      bogoConfig: { buyQuantity: 0, getQuantity: 0 },
      comboItems: [],
      comboPrice: 0,
      offerLabel: '',
      offerValidUntil: null,
    }, { new: true });
  }
}

module.exports = new ProductRepository();
