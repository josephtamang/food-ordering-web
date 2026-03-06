const request = require('supertest');
const app = require('../app');
const { connect, close, clear } = require('./db');
const { createAdmin, createUser } = require('./helpers');

beforeAll(async () => { await connect(); });
afterAll(async () => { await close(); });
afterEach(async () => { await clear(); });

// ─── GET /api/announcements (public) ─────────────────────────────────────────

describe('GET /api/announcements', () => {
  it('returns active announcements for everyone (public)', async () => {
    const res = await request(app).get('/api/announcements');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.announcements)).toBe(true);
  });

  it('does not include inactive announcements in the public list', async () => {
    const { token } = await createAdmin();

    // Create an inactive announcement
    await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hidden', body: 'Not visible', type: 'notice', isActive: false });

    // Create an active announcement
    await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Visible', body: 'You can see me', type: 'offer', isActive: true });

    const res = await request(app).get('/api/announcements');
    expect(res.body.announcements.every((a) => a.isActive)).toBe(true);
    const titles = res.body.announcements.map((a) => a.title);
    expect(titles).not.toContain('Hidden');
    expect(titles).toContain('Visible');
  });
});

// ─── POST /api/announcements ─────────────────────────────────────────────────

describe('POST /api/announcements', () => {
  it('allows admin to create an announcement', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Happy Hour Today!',
        body: 'Buy 2 get 1 free on all beverages from 5–7 PM.',
        type: 'offer',
        isPinned: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.announcement.title).toBe('Happy Hour Today!');
    expect(res.body.announcement.isPinned).toBe(true);
    expect(res.body.announcement.type).toBe('offer');
  });

  it('returns 400 when title is missing', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Body without title' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 403 when a customer tries to create an announcement', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hack', body: 'Not allowed', type: 'notice' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .send({ title: 'No auth', body: 'Test' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── PUT /api/announcements/:id ──────────────────────────────────────────────

describe('PUT /api/announcements/:id', () => {
  it('allows admin to update an announcement', async () => {
    const { token } = await createAdmin();
    const createRes = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original', body: 'Original body', type: 'notice' });

    const id = createRes.body.announcement._id;

    const updateRes = await request(app)
      .put(`/api/announcements/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', isActive: false });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.announcement.title).toBe('Updated Title');
    expect(updateRes.body.announcement.isActive).toBe(false);
  });
});

// ─── DELETE /api/announcements/:id ───────────────────────────────────────────

describe('DELETE /api/announcements/:id', () => {
  it('allows admin to delete an announcement', async () => {
    const { token } = await createAdmin();
    const createRes = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete', body: 'Will be gone', type: 'notice' });

    const id = createRes.body.announcement._id;

    const deleteRes = await request(app)
      .delete(`/api/announcements/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Confirm it no longer appears in the public list
    const listRes = await request(app).get('/api/announcements');
    const ids = listRes.body.announcements.map((a) => a._id);
    expect(ids).not.toContain(id);
  });
});

// ─── GET /api/announcements/all ──────────────────────────────────────────────

describe('GET /api/announcements/all', () => {
  it('returns all announcements (including inactive) for admin', async () => {
    const { token } = await createAdmin();

    await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Active', body: 'Active body', type: 'notice', isActive: true });
    await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Inactive', body: 'Hidden body', type: 'closure', isActive: false });

    const res = await request(app)
      .get('/api/announcements/all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.announcements.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 403 for customer accessing admin endpoint', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get('/api/announcements/all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });
});
