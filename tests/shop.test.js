// tests/shop.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import Shop from '../src/models/Shop.js';
import bcrypt from 'bcryptjs';

const request = supertest(app);

// Helper to generate unique email
const generateUniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

describe('Shop Endpoints', () => {
  let accessToken;
  let shopId;
  let userId;

  const basePassword = 'Password123';
  const baseName = 'Shop Owner';

  const testShop = {
    title: 'Test Shop',
    description: 'Test shop description',
    phone: '1234567890'
  };

  beforeEach(async () => {
    const testEmail = generateUniqueEmail();
    
    // Create user
    const hashed = await bcrypt.hash(basePassword, 10);
    const user = await User.create({
      email: testEmail,
      password: hashed,
      name: baseName,
      isVerified: true
    });
    userId = user._id;

    // Login
    const res = await request
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: basePassword
      });

    accessToken = res.body.accessToken;
  });

  describe('POST /api/v1/shop/add', () => {
    it('should create a new shop', async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testShop);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.shop.title).toBe(testShop.title);

      shopId = res.body.shop._id;
    });

    it('should fail without required fields', async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Shop Only' });

      expect(res.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const res = await request
        .post('/api/v1/shop')
        .send(testShop);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/shop', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testShop);

      shopId = res.body.shop._id;
    });

    it('should get all shops with pagination', async () => {
      const res = await request
        .get('/api/v1/shop?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.shops)).toBe(true);
    });

    it('should search shops', async () => {
      const res = await request
        .get('/api/v1/shop?search=Test')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/shop/:id', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testShop);

      shopId = res.body.shop._id;
    });

    it('should get shop by ID', async () => {
      const res = await request
        .get(`/api/v1/shop/${shopId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.shop._id.toString()).toBe(shopId.toString());
    });
  });

  describe('PATCH /api/v1/shop/:id', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testShop);

      shopId = res.body.shop._id;
    });

    it('should update shop', async () => {
      const res = await request
        .patch(`/api/v1/shop/${shopId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Shop Name',
          description: 'Updated description'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.shop.title).toBe('Updated Shop Name');
    });
  });

  describe('DELETE /api/v1/shop/:id', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testShop);

      shopId = res.body.shop._id;
    });

    it('should delete shop', async () => {
      const res = await request
        .delete(`/api/v1/shop/${shopId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/shop/:id/follow', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testShop);

      shopId = res.body.shop._id;
    });

    it('should follow shop', async () => {
      const res = await request
        .post(`/api/v1/shop/${shopId}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const shop = await Shop.findById(shopId);
      expect(shop.followers.includes(userId)).toBe(true);
    });

    it('should unfollow shop if already followed', async () => {
      await request
        .post(`/api/v1/shop/${shopId}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request
        .post(`/api/v1/shop/${shopId}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const shop = await Shop.findById(shopId);
      expect(shop.followers.includes(userId)).toBe(false);
    });
  });

  describe('POST /api/v1/shop/:id/like', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/shop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testShop);

      shopId = res.body.shop._id;
    });

    it('should like shop', async () => {
      const res = await request
        .post(`/api/v1/shop/${shopId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});