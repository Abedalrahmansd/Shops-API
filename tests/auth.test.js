// tests/auth.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const request = supertest(app);

// Helper to generate unique email
const generateUniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

describe('Auth Endpoints', () => {
  const basePassword = 'Password123';
  const baseName = 'Test User';
  const baseBio = 'Test bio';

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const testUser = {
        email: generateUniqueEmail(),
        password: basePassword,
        name: baseName,
        bio: baseBio
      };

      const res = await request
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('created');

      const user = await User.findOne({ email: testUser.email });
      expect(user).toBeDefined();
      expect(user.name).toBe(testUser.name);
    });

    it('should fail if user already exists', async () => {
      const testUser = {
        email: generateUniqueEmail(),
        password: basePassword,
        name: baseName,
        bio: baseBio
      };

      await request.post('/api/v1/auth/register').send(testUser);

      const res = await request
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const testUser = {
        email: 'invalid-email',
        password: basePassword,
        name: baseName,
        bio: baseBio
      };

      const res = await request
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
    });

    it('should fail with password < 6 characters', async () => {
      const testUser = {
        email: generateUniqueEmail(),
        password: '12345',
        name: baseName,
        bio: baseBio
      };

      const res = await request
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testEmail;

    beforeEach(async () => {
      testEmail = generateUniqueEmail();
      const hashed = await bcrypt.hash(basePassword, 10);
      await User.create({
        email: testEmail,
        password: hashed,
        name: baseName,
        isVerified: true
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: basePassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });

    it('should fail with non-existent user', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: basePassword
        });

      expect(res.status).toBe(401);
    });

    it('should fail without password', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({
          email: testEmail
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken;
    let testEmail;

    beforeEach(async () => {
      testEmail = generateUniqueEmail();
      const hashed = await bcrypt.hash(basePassword, 10);
      const user = await User.create({
        email: testEmail,
        password: hashed,
        name: baseName,
        isVerified: true
      });

      const res = await request
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: basePassword
        });

      refreshToken = res.body.refreshToken;
    });

    it('should return new access token with valid refresh token', async () => {
      const res = await request
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    let verificationCode;
    let testEmail;

    beforeEach(async () => {
      testEmail = generateUniqueEmail();
      verificationCode = '123456';
      const hashed = await bcrypt.hash(basePassword, 10);
      await User.create({
        email: testEmail,
        password: hashed,
        name: baseName,
        verificationCode,
        verificationExpiry: Date.now() + 3600000
      });
    });

    it('should verify email with correct code', async () => {
      const res = await request
        .post('/api/v1/auth/verify-email')
        .send({
          email: testEmail,
          code: verificationCode
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: testEmail });
      expect(user.isVerified).toBe(true);
    });

    it('should fail with incorrect code', async () => {
      const res = await request
        .post('/api/v1/auth/verify-email')
        .send({
          email: testEmail,
          code: 'wrong-code'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken;
    let testEmail;

    beforeEach(async () => {
      testEmail = generateUniqueEmail();
      const hashed = await bcrypt.hash(basePassword, 10);
      await User.create({
        email: testEmail,
        password: hashed,
        name: baseName,
        isVerified: true
      });

      const res = await request
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: basePassword
        });

      accessToken = res.body.accessToken;
    });

    it('should logout successfully', async () => {
      const res = await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail without token', async () => {
      const res = await request
        .post('/api/v1/auth/logout');

      expect(res.status).toBe(401);
    });
  });
});