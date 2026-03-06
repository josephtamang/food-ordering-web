const BaseRepository = require('./BaseRepository');
const Category = require('../../models/Category');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findAllActive() {
    return this.model.find({ isActive: true }).sort('name');
  }
}

module.exports = new CategoryRepository();
