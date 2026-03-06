class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, populate = '') {
    return this.model.findById(id).populate(populate);
  }

  async findOne(filter, select = '') {
    return this.model.findOne(filter).select(select);
  }

  async find(filter = {}, { page = 1, limit = 10, sort = '-createdAt', populate = '' } = {}) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(filter).populate(populate).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);
    return { docs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async create(data) {
    return this.model.create(data);
  }

  async updateById(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

module.exports = BaseRepository;
