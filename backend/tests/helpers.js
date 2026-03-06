const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

/**
 * Register a user and return { token, user }
 */
const createUser = async (overrides = {}) => {
  const data = {
    name: overrides.name || 'Test User',
    email: overrides.email || `test_${Date.now()}@foody.com`,
    password: overrides.password || 'password123',
  };
  const res = await request(app).post('/api/auth/register').send(data);
  return { token: res.body.token, user: res.body.user, credentials: data };
};

/**
 * Create an admin user directly via User model (role can't be set via register API)
 */
const createAdmin = async () => {
  const User = require('../models/User');
  const email = `admin_${Date.now()}@foody.com`;
  const user = await User.create({
    name: 'Admin User',
    email,
    password: 'admin1234',
    role: 'admin',
  });
  // Login to get token
  const res = await request(app).post('/api/auth/login').send({ email, password: 'admin1234' });
  return { token: res.body.token, user: res.body.user };
};

/**
 * Create a staff user directly
 */
const createStaff = async () => {
  const User = require('../models/User');
  const email = `staff_${Date.now()}@foody.com`;
  await User.create({
    name: 'Staff User',
    email,
    password: 'staff1234',
    role: 'staff',
  });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'staff1234' });
  return { token: res.body.token, user: res.body.user };
};

/**
 * Create a Category document
 */
const createCategory = async () => {
  const Category = require('../models/Category');
  return Category.create({ name: `Category_${Date.now()}`, isActive: true });
};

/**
 * Create a Product directly via model
 */
const createProduct = async (categoryId, overrides = {}) => {
  const Product = require('../models/Product');
  return Product.create({
    name: overrides.name || `Burger_${Date.now()}`,
    description: 'A tasty burger',
    price: overrides.price || 250,
    category: categoryId,
    isAvailable: true,
    isVeg: false,
    ...overrides,
  });
};

/**
 * Add a product to cart and place an order, then mark it completed
 */
const createCompletedOrder = async (userId, productId) => {
  const Cart = require('../models/Cart');
  const Order = require('../models/Order');

  // Add to cart
  await Cart.findOneAndUpdate(
    { user: userId },
    { $push: { items: { product: productId, quantity: 1 } } },
    { upsert: true, new: true }
  );

  // Create order directly
  const order = await Order.create({
    user: userId,
    items: [{ product: productId, name: 'Test Item', price: 250, quantity: 1, image: '' }],
    tableNumber: '5',
    subtotal: 250,
    tax: 13,
    total: 263,
    status: 'completed',
  });

  return order;
};

module.exports = { createUser, createAdmin, createStaff, createCategory, createProduct, createCompletedOrder };
