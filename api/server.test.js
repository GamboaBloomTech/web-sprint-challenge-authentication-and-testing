const request = require('supertest');
const bcrypt = require('bcrypt'); // Ensure bcrypt is imported
const server = require('./server');
const db = require('../data/dbconfig');

beforeEach(async () => {
  await db('users').truncate(); // Clean up the users table before each test
});

describe('Auth endpoints', () => {
  describe('[POST] /api/auth/register', () => {
    it('should register a user with valid credentials', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ username: 'Captain Marvel', password: 'foobar' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('username', 'Captain Marvel');
    });

    it('should return a 400 error if username or password is missing', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ username: 'Captain Marvel' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'username and password required');
    });
  });

  describe('[POST] /api/auth/login', () => {
    beforeEach(async () => {
      await db('users').insert({ username: 'Captain Marvel', password: bcrypt.hashSync('foobar', 8) });
    });

    it('should login a user and return a token with valid credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ username: 'Captain Marvel', password: 'foobar' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'welcome, Captain Marvel');
      expect(res.body).toHaveProperty('token');
    });

    it('should return a 400 error if username or password is missing', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ username: 'Captain Marvel' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'username and password required');
    });

    it('should return a 401 error if credentials are invalid', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ username: 'Captain Marvel', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'invalid credentials');
    });
  });
});

describe('Jokes endpoint', () => {
  let token;
  beforeEach(async () => {
    await db('users').truncate();
    await request(server).post('/api/auth/register').send({ username: 'Captain Marvel', password: 'foobar' });
    const res = await request(server).post('/api/auth/login').send({ username: 'Captain Marvel', password: 'foobar' });
    token = res.body.token;
  });

  it('should return a 401 error if no token is provided', async () => {
    const res = await request(server).get('/api/jokes');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'token required');
  });

  it('should return a 401 error if the token is invalid', async () => {
    const res = await request(server)
      .get('/api/jokes')
      .set('Authorization', 'invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'token invalid');
  });

  it('should return jokes if a valid token is provided', async () => {
    const res = await request(server)
      .get('/api/jokes')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array); // Assuming jokes is an array
  });
});
