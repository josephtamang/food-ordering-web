const OrderRepository = require('../repositories/OrderRepository');
const CartRepository = require('../repositories/CartRepository');
const { createOrderSchema, updateOrderStatusSchema, orderQuerySchema, buildOrderFilter } = require('../dtos/order.dto');

const TAX_RATE = 0.05;

class OrderController {
  async create(req, res) {
    try {
      const result = createOrderSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });
      const dto = result.data;

      const cart = await CartRepository.getPopulated(req.user._id);
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      const items = cart.items.map(i => ({
        product: i.product._id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image,
      }));

      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const tax = Math.round(subtotal * TAX_RATE);
      const total = subtotal + tax;

      const order = await OrderRepository.create({
        user: req.user._id, items, tableNumber: dto.tableNumber,
        notes: dto.notes, subtotal, tax, total,
      });

      cart.items = [];
      await cart.save();

      res.status(201).json({ success: true, order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyOrders(req, res) {
    try {
      const query = orderQuerySchema.parse(req.query);
      const filter = buildOrderFilter(query, req.user._id);
      const result = await OrderRepository.findWithPagination(filter, { page: query.page, limit: query.limit });
      res.status(200).json({ success: true, orders: result.docs, pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const order = await OrderRepository.findByIdPopulated(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (order.user._id.toString() !== req.user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      res.status(200).json({ success: true, order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const query = orderQuerySchema.parse(req.query);
      const filter = buildOrderFilter(query);
      const result = await OrderRepository.findWithPagination(filter, { page: query.page, limit: query.limit });
      res.status(200).json({ success: true, orders: result.docs, pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const result = updateOrderStatusSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0].message });

      const order = await OrderRepository.updateById(req.params.id, { status: result.data.status });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      res.status(200).json({ success: true, order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OrderController();
