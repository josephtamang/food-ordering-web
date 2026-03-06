const request = require('supertest');
const app = require('../app');
const { connect, close, clear } = require('./db');
const { createUser, createAdmin, createCategory, createProduct, createCompletedOrder } = require('./helpers');

beforeAll(async () => { await connect(); });
afterAll(async () => { await close(); });
afterEach(async () => { await clear(); });

// ─── GET /api/reviews/product/:productId ─────────────────────────────────────

describe('GET /api/reviews/product/:productId', () => {
  it('returns reviews array for a product (public)', async () => {
    const cat = await createCategory();
    const product = await createProduct(cat._id);

    const res = await request(app).get(`/api/reviews/product/${product._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.reviews)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });
});

// ─── POST /api/reviews/product/:productId ─────────────────────────────────────

describe('POST /api/reviews/product/:productId', () => {
  it('allows a user with completed order to submit a review', async () => {
    const { token, user } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id);
    await createCompletedOrder(user._id, product._id);

    const res = await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'Absolutely delicious!' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.review.rating).toBe(5);
    expect(res.body.review.comment).toBe('Absolutely delicious!');
  });

  it('blocks a review when user has no completed order for that product', async () => {
    const { token } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id);

    const res = await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, comment: 'Nice' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/only review products you have ordered/i);
  });

  it('prevents a user from reviewing the same product twice', async () => {
    const { token, user } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id);
    await createCompletedOrder(user._id, product._id);

    await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'First review' });

    const res = await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3, comment: 'Second attempt' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/i);
  });

  it('returns 401 when not authenticated', async () => {
    const cat = await createCategory();
    const product = await createProduct(cat._id);
    const res = await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .send({ rating: 5 });
    expect(res.statusCode).toBe(401);
  });
});

// ─── PUT /api/reviews/:id ────────────────────────────────────────────────────

describe('PUT /api/reviews/:id', () => {
  it('allows the author to update their review', async () => {
    const { token, user } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id);
    await createCompletedOrder(user._id, product._id);

    const createRes = await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3, comment: 'Average' });

    const reviewId = createRes.body.review._id;

    const updateRes = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'Changed my mind, amazing!' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.review.rating).toBe(5);
    expect(updateRes.body.review.comment).toBe('Changed my mind, amazing!');
  });
});

// ─── DELETE /api/reviews/:id ─────────────────────────────────────────────────

describe('DELETE /api/reviews/:id', () => {
  it('allows the author to delete their own review', async () => {
    const { token, user } = await createUser();
    const cat = await createCategory();
    const product = await createProduct(cat._id);
    await createCompletedOrder(user._id, product._id);

    const createRes = await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 });

    const reviewId = createRes.body.review._id;

    const deleteRes = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it('prevents a different user from deleting another user review', async () => {
    const { token: authorToken, user: author } = await createUser();
    const { token: otherToken } = await createUser({ email: `other_${Date.now()}@foody.com` });
    const cat = await createCategory();
    const product = await createProduct(cat._id);
    await createCompletedOrder(author._id, product._id);

    const createRes = await request(app)
      .post(`/api/reviews/product/${product._id}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ rating: 4 });

    const reviewId = createRes.body.review._id;

    const deleteRes = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(deleteRes.statusCode).toBe(403);
  });
});
