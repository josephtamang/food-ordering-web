const CategoryRepository = require('../repositories/CategoryRepository');

class CategoryController {
  async getAll(req, res) {
    try {
      const categories = await CategoryRepository.findAllActive();
      res.status(200).json({ success: true, categories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ success: false, message: 'Category name is required' });
      const image = req.file ? `/uploads/${req.file.filename}` : '';
      const category = await CategoryRepository.create({ name: name.trim(), image });
      res.status(201).json({ success: true, category });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name.trim();
      if (req.file) updates.image = `/uploads/${req.file.filename}`;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

      const category = await CategoryRepository.updateById(req.params.id, updates);
      if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
      res.status(200).json({ success: true, category });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const category = await CategoryRepository.deleteById(req.params.id);
      if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
      res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CategoryController();
