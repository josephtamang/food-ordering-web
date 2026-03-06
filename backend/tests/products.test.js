const request = require('supertest');
const app = require('../app');
const { connect, close, clear } = require('./db');
const { createAdmin, createUser, createCategory } = require('./helpers');

beforeAll(async () => { await connect(); });
afterAll(async () => { await close(); });
afterEach(async () => { await clear(); });

// ─── GET /api/products ───────────────────────────────────────────────────────

describe('GET /api/products', () => {
  it('returns paginated products list (public)', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('pages');
  });

  it('filters products by search query', async () => {
    const res = await request(app).get('/api/products?search=burger');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── GET /api/products/:id ───────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
  it('returns 404 for a non-existent product id', async () => {
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/products ──────────────────────────────────────────────────────

describe('POST /api/products', () => {
  it('creates a product when called by admin', async () => {
    const { token } = await createAdmin();
    const cat = await createCategory();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Paneer Tikka')
      .field('description', 'Delicious grilled paneer')
      .field('price', '320')
      .field('category', cat._id.toString())
      .field('isVeg', 'true');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.product.name).toBe('Paneer Tikka');
    expect(res.body.product.price).toBe(320);
  });

  it('returns 403 when a customer tries to create a product', async () => {
    const { token } = await createUser();
    const cat = await createCategory();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Hacked Product')
      .field('price', '1')
      .field('category', cat._id.toString());

    expect(res.statusCode).toBe(403);
  });

  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'No Auth Product', price: 100 });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Promotional Endpoints (public) ─────────────────────────────────────────

describe('GET /api/products/featured-items', () => {
  it('returns an array of featured products', async () => {
    const res = await request(app).get('/api/products/featured-items');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});

describe('GET /api/products/hot-deals', () => {
  it('returns an array of hot deals', async () => {
    const res = await request(app).get('/api/products/hot-deals');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});

// ─── DELETE /api/products/:id ────────────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
  it('allows admin to delete a product', async () => {
    const { token } = await createAdmin();
    const cat = await createCategory();

    // Create product first
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'To Delete')
      .field('price', '100')
      .field('category', cat._id.toString());

    const productId = createRes.body.product._id;

    const deleteRes = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
