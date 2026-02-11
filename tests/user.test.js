// tests/user.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const request = supertest(app);

describe('User Endpoints', () => {
  let accessToken;
  let userId;

  const testUser = {
    email: 'user@example.com',
    password: 'Password123',
    name: 'User Test',
    bio: 'User bio'
  };

  beforeEach(async () => {
    const hashed = await bcrypt.hash(testUser.password, 10);
    const user = await User.create({
      email: testUser.email,
      password: hashed,
      name: testUser.name,
      isVerified: true
    });
    userId = user._id;

    const res = await request
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    accessToken = res.body.accessToken;
  });

  describe('GET /api/v1/user/me', () => {
    it('should get current user profile', async () => {
      const res = await request
        .get('/api/v1/user/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should fail without token', async () => {
      const res = await request.get('/api/v1/user/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/user/update-me', () => {
    it('should update user profile', async () => {
      const res = await request
        .put('/api/v1/user/update-me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
          bio: 'Updated bio'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Updated Name');
    });

    it('should fail with invalid input', async () => {
      const res = await request
        .put('/api/v1/user/update-me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: ''
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/user/change-password', () => {
    it('should change password', async () => {
      const res = await request
        .post('/api/v1/user/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: 'NewPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify new password works
      const loginRes = await request
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'NewPassword123'
        });

      expect(loginRes.status).toBe(200);
    });

    it('should fail with wrong old password', async () => {
      const res = await request
        .post('/api/v1/user/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'WrongPassword',
          newPassword: 'NewPassword123'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/user/delete', () => {
    it('should delete user account', async () => {
      const res = await request
        .delete('/api/v1/user/delete')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findById(userId);
      expect(user).toBeNull();
    });
  });

  describe('GET /api/v1/user/:userId', () => {
    it('should get user profile by ID', async () => {
      const res = await request
        .get(`/api/v1/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user._id.toString()).toBe(userId.toString());
    });

    it('should fail with invalid user ID', async () => {
      const res = await request
        .get('/api/v1/user/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(500);
    });
  });
});
