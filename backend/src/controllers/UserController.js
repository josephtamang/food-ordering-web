const UserRepository = require('../repositories/UserRepository');

class UserController {
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

      const result = await UserRepository.find(filter, { page, limit });
      res.status(200).json({ success: true, users: result.docs, pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUserRole(req, res) {
    try {
      const { role } = req.body;
      if (!['customer', 'staff', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      const user = await UserRepository.updateById(req.params.id, { role });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const user = await UserRepository.deleteById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await UserRepository.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserOrders(req, res) {
    try {
      const Order = require('../../models/Order');
      const orders = await Order.find({ user: req.params.id }).sort('-createdAt').limit(50);
      res.status(200).json({ success: true, orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required' });
      }
      const User = require('../../models/User');
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
      const user = await User.create({ name, email, password, role: role || 'customer' });
      user.password = undefined;
      res.status(201).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { name, email, role } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (role) updates.role = role;
      const user = await UserRepository.updateById(req.params.id, updates);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UserController();
