const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');

class CartController {
  async getCart(req, res) {
    try {
      const cart = await CartRepository.findOrCreate(req.user._id);
      const populated = await CartRepository.getPopulated(req.user._id);
      res.status(200).json({ success: true, cart: populated || cart });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addToCart(req, res) {
    try {
      const { productId, quantity = 1 } = req.body;
      if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

      const product = await ProductRepository.findById(productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const cart = await CartRepository.findOrCreate(req.user._id);
      const existing = cart.items.find(i => i.product.toString() === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
      const populated = await CartRepository.getPopulated(req.user._id);
      res.status(200).json({ success: true, cart: populated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateCartItem(req, res) {
    try {
      const { quantity } = req.body;
      const cart = await CartRepository.findOrCreate(req.user._id);
      const item = cart.items.find(i => i.product.toString() === req.params.productId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });

      if (quantity <= 0) {
        cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
      } else {
        item.quantity = quantity;
      }

      await cart.save();
      const populated = await CartRepository.getPopulated(req.user._id);
      res.status(200).json({ success: true, cart: populated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeFromCart(req, res) {
    try {
      const cart = await CartRepository.findOrCreate(req.user._id);
      cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
      await cart.save();
      const populated = await CartRepository.getPopulated(req.user._id);
      res.status(200).json({ success: true, cart: populated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async clearCart(req, res) {
    try {
      const cart = await CartRepository.findOrCreate(req.user._id);
      cart.items = [];
      await cart.save();
      res.status(200).json({ success: true, cart });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CartController();
