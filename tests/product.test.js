// tests/product.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import Shop from '../src/models/Shop.js';
import Product from '../src/models/Product.js';
import bcrypt from 'bcryptjs';

const request = supertest(app);

// Helper to generate unique email
const generateUniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

describe('Product Endpoints', () => {
  let accessToken;
  let shopId;
  let productId;
  let userId;

  const basePassword = 'Password123';
  const baseName = 'Shop Owner';

  const testProduct = {
    name: 'Test Product',
    description: 'Test product description',
    price: 99.99,
    stock: 10,
    category: 'Electronics',
    images: ['image1.jpg']
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

    // Create shop
    const shop = await Shop.create({
      title: 'Test Shop',
      owner: userId,
      description: 'Shop for testing',
      phone: '1234567890'
    });
    shopId = shop._id;
  });

  describe('POST /api/v1/product/add', () => {
    it('should add a new product', async () => {
      const res = await request
        .post('/api/v1/product/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          shopId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.product.name).toBe(testProduct.name);

      productId = res.body.product._id;
    });

    it('should fail without required fields', async () => {
      const res = await request
        .post('/api/v1/product/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ shopId });

      expect(res.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const res = await request
        .post('/api/v1/product/add')
        .send({
          ...testProduct,
          shopId
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/product', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/product/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          shopId
        });

      productId = res.body.product._id;
    });

    it('should get all products with pagination', async () => {
      const res = await request
        .get('/api/v1/product?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should search products by name', async () => {
      const res = await request
        .get('/api/v1/product?search=Test')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const res = await request
        .get('/api/v1/product?category=Electronics')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/product/:id', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/product/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          shopId
        });

      productId = res.body.product._id;
    });

    it('should get product by ID', async () => {
      const res = await request
        .get(`/api/v1/product/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product._id.toString()).toBe(productId.toString());
    });

    it('should fail with invalid product ID', async () => {
      const res = await request
        .get('/api/v1/product/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(500);
    });
  });

  describe('PATCH /api/v1/product/:id', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/product/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          shopId
        });

      productId = res.body.product._id;
    });

    it('should update product', async () => {
      const res = await request
        .patch(`/api/v1/product/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Product Name',
          price: 149.99
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.name).toBe('Updated Product Name');
    });

    it('should fail if not product owner', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'Password123',
        name: 'Other User',
        isVerified: true
      });

      const loginRes = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Password123'
        });

      const res = await request
        .patch(`/api/v1/product/${productId}`)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({
          name: 'Hacked Product'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/product/:id', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/product/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          shopId
        });

      productId = res.body.product._id;
    });

    it('should delete product', async () => {
      const res = await request
        .delete(`/api/v1/product/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const product = await Product.findById(productId);
      expect(product).toBeNull();
    });
  });

  describe('POST /api/v1/product/:id/like', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/product/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          shopId
        });

      productId = res.body.product._id;
    });

    it('should like a product', async () => {
      const res = await request
        .post(`/api/v1/product/${productId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const product = await Product.findById(productId);
      expect(product.likes.includes(userId)).toBe(true);
    });

    it('should unlike a product if already liked', async () => {
      await request
        .post(`/api/v1/product/${productId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request
        .post(`/api/v1/product/${productId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const product = await Product.findById(productId);
      expect(product.likes.includes(userId)).toBe(false);
    });
  });
});