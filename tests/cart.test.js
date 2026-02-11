// tests/cart.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import Shop from '../src/models/Shop.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import bcrypt from 'bcryptjs';

const request = supertest(app);

// Helper to generate unique email
const generateUniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

describe('Cart Endpoints', () => {
  let accessToken;
  let userId;
  let shopId;
  let productId;

  const basePassword = 'Password123';
  const baseName = 'Cart User';

  const testProduct = {
    name: 'Cart Product',
    description: 'Product for cart',
    price: 49.99,
    stock: 20,
    category: 'Electronics',
    images: ['image.jpg']
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
      description: 'Test shop',
      phone: '1234567890'
    });
    shopId = shop._id;

    // Create product
    const productRes = await request
      .post('/api/v1/product/add')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...testProduct,
        shopId
      });
    productId = productRes.body.product._id;
  });

  describe('POST /api/v1/cart/add', () => {
    it('should add product to cart', async () => {
      const res = await request
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId,
          shopId,
          quantity: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cart = await Cart.findOne({ user: userId });
      expect(cart).toBeDefined();
      expect(cart.items.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const res = await request
        .post('/api/v1/cart/add')
        .send({
          productId,
          shopId,
          quantity: 1
        });

      expect(res.status).toBe(401);
    });

    it('should fail with invalid product', async () => {
      const res = await request
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId: 'invalid-id',
          shopId,
          quantity: 1
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/cart', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId,
          shopId,
          quantity: 1
        });
    });

    it('should get cart items', async () => {
      const res = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.cart)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const res = await request.get('/api/v1/cart');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/cart/remove/:productId', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId,
          shopId,
          quantity: 1
        });
    });

    it('should remove product from cart', async () => {
      const res = await request
        .delete(`/api/v1/cart/remove/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const res = await request
        .delete(`/api/v1/cart/remove/${productId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/cart/quantity/:productId', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId,
          shopId,
          quantity: 1
        });
    });

    it('should update product quantity', async () => {
      const res = await request
        .patch(`/api/v1/cart/quantity/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail with invalid quantity', async () => {
      const res = await request
        .patch(`/api/v1/cart/quantity/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 0 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/cart/clear', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId,
          shopId,
          quantity: 1
        });
    });

    it('should clear entire cart', async () => {
      const res = await request
        .delete('/api/v1/cart/clear')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cart = await Cart.findOne({ user: userId });
      expect(cart.items.length).toBe(0);
    });
  });
});