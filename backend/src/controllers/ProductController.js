const ProductRepository = require('../repositories/ProductRepository');
const { createProductSchema, updateProductSchema, productQuerySchema, buildProductFilter } = require('../dtos/product.dto');

class ProductController {
  async getAll(req, res) {
    try {
      const query = productQuerySchema.parse(req.query);
      const filter = buildProductFilter(query);
      const result = await ProductRepository.findWithFilters(filter, {
        page: query.page, limit: query.limit, sortBy: query.sortBy, order: query.order === 'asc' ? 1 : -1,
      });
      res.status(200).json({ success: true, products: result.docs, pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const product = await ProductRepository.findByIdPopulated(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const result = createProductSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      if (req.file) dto.image = `/uploads/${req.file.filename}`;
      const product = await ProductRepository.create(dto);
      res.status(201).json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = updateProductSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      if (req.file) dto.image = `/uploads/${req.file.filename}`;
      const product = await ProductRepository.updateById(req.params.id, dto);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const product = await ProductRepository.deleteById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getFeatured(req, res) {
    try {
      const products = await ProductRepository.findFeaturedProducts(req.query.limit || 6);
      res.status(200).json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHotDeals(req, res) {
    try {
      const products = await ProductRepository.findHotDeals(req.query.limit || 6);
      res.status(200).json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailySpecials(req, res) {
    try {
      const products = await ProductRepository.findDailySpecials(req.query.limit || 6);
      res.status(200).json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getChefSpecials(req, res) {
    try {
      const products = await ProductRepository.findChefSpecials(req.query.limit || 6);
      res.status(200).json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleFeatured(req, res) {
    try {
      const product = await ProductRepository.toggleFeatured(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product, message: `Product ${product.isFeatured ? 'marked as' : 'removed from'} featured` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleHotDeal(req, res) {
    try {
      const product = await ProductRepository.toggleHotDeal(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product, message: `Product ${product.isHotDeal ? 'marked as' : 'removed from'} hot deal` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleDailySpecial(req, res) {
    try {
      const product = await ProductRepository.toggleDailySpecial(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product, message: `Product ${product.isDailySpecial ? 'marked as' : 'removed from'} daily special` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleChefSpecial(req, res) {
    try {
      const product = await ProductRepository.toggleChefSpecial(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product, message: `Product ${product.isChefSpecial ? 'marked as' : 'removed from'} chef special` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async setDiscount(req, res) {
    try {
      const dto = {
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        bogoConfig: req.body.bogoConfig,
        comboItems: req.body.comboItems,
        comboPrice: req.body.comboPrice,
        offerLabel: req.body.offerLabel,
        offerValidUntil: req.body.offerValidUntil,
      };
      const product = await ProductRepository.setDiscount(req.params.id, dto);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product, message: 'Discount updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeDiscount(req, res) {
    try {
      const product = await ProductRepository.removeDiscount(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, product, message: 'Discount removed' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProductController();
