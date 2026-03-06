const request = require('supertest');
const app = require('../app');
const { connect, close, clear } = require('./db');
const { createUser } = require('./helpers');

beforeAll(async () => { await connect(); });
afterAll(async () => { await close(); });
afterEach(async () => { await clear(); });

// ─── Registration ───────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user and returns token + user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Joseph Doe',
      email: 'joseph@foody.com',
      password: 'secure123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('joseph@foody.com');
    expect(res.body.user.password).toBeUndefined(); // password must not be exposed
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'dup@foody.com',
      password: 'pass1234',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'dup@foody.com',
      password: 'pass1234',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

// ─── Login ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and returns token', async () => {
    await createUser({ email: 'login@foody.com', password: 'mypassword' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@foody.com',
      password: 'mypassword',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    await createUser({ email: 'wrongpw@foody.com', password: 'correct123' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpw@foody.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@foody.com',
      password: 'whatever',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Get Current User ────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    const { token } = await createUser({ email: 'me@foody.com' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('me@foody.com');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── Update Profile ──────────────────────────────────────────────────────────

describe('PUT /api/auth/me', () => {
  it('updates the user name when authenticated', async () => {
    const { token } = await createUser({ email: 'update@foody.com' });
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });
});
