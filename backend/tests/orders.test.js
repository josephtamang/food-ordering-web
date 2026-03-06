const request = require('supertest');
const app = require('../app');
const { connect, close, clear } = require('./db');
const { createUser, createAdmin, createCategory, createProduct } = require('./helpers');
const Cart = require('../models/Cart');

beforeAll(async () => { await connect(); });
afterAll(async () => { await close(); });
afterEach(async () => { await clear(); });

// ─── POST /api/orders ────────────────────────────────────────────────────────

describe('POST /api/orders', () => {
  it('creates an order from non-empty cart', async () => {
    const { token, user } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id, { price: 300 });

    // Add item to cart
    await Cart.create({ user: user._id, items: [{ product: product._id, quantity: 2 }] });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ tableNumber: '3', notes: 'Extra spicy' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.items).toHaveLength(1);
    expect(res.body.order.status).toBe('pending');
    expect(res.body.order.subtotal).toBe(600); // 300 × 2
  });

  it('returns 400 when cart is empty', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ tableNumber: '1' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cart is empty/i);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/orders').send({ tableNumber: '1' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/orders/my-orders ───────────────────────────────────────────────

describe('GET /api/orders/my-orders', () => {
  it('returns the current user orders array', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/orders/my-orders');
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/orders/all ─────────────────────────────────────────────────────

describe('GET /api/orders/all', () => {
  it('returns all orders for admin', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .get('/api/orders/all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('returns 403 for a regular customer', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get('/api/orders/all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─── PUT /api/orders/:id/status ──────────────────────────────────────────────

describe('PUT /api/orders/:id/status', () => {
  it('allows admin to update order status to confirmed', async () => {
    const { token: adminToken } = await createAdmin();
    const { token: userToken, user } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id);

    // Create cart + order
    await Cart.create({ user: user._id, items: [{ product: product._id, quantity: 1 }] });
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tableNumber: '7' });

    const orderId = orderRes.body.order._id;

    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('confirmed');
  });

  it('returns 400 for invalid status value', async () => {
    const { token: adminToken } = await createAdmin();
    const { token: userToken, user } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id);

    await Cart.create({ user: user._id, items: [{ product: product._id, quantity: 1 }] });
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tableNumber: '2' });

    const orderId = orderRes.body.order._id;

    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'flying' }); // invalid status

    expect(res.statusCode).toBe(400);
  });
});
