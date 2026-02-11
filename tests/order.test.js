// tests/order.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import Shop from '../src/models/Shop.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import bcrypt from 'bcryptjs';

const request = supertest(app);

// Helper to generate unique email
const generateUniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

describe('Order Endpoints', () => {
  let buyerToken;
  let sellerToken;
  let buyerId;
  let sellerId;
  let shopId;
  let productId;
  let orderId;

  const basePassword = 'Password123';

  const testProduct = {
    name: 'Order Product',
    description: 'Product for order',
    price: 99.99,
    stock: 10,
    category: 'Electronics',
    images: ['image.jpg']
  };

  beforeEach(async () => {
    const buyerEmail = generateUniqueEmail();
    const sellerEmail = generateUniqueEmail();
    
    // Create buyer
    const buyerHash = await bcrypt.hash(basePassword, 10);
    const buyer = await User.create({
      email: buyerEmail,
      password: buyerHash,
      name: 'Buyer User',
      isVerified: true
    });
    buyerId = buyer._id;

    // Create seller
    const sellerHash = await bcrypt.hash(basePassword, 10);
    const seller = await User.create({
      email: sellerEmail,
      password: sellerHash,
      name: 'Seller User',
      isVerified: true
    });
    sellerId = seller._id;

    // Login buyer
    const buyerRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: buyerEmail,
        password: basePassword
      });
    buyerToken = buyerRes.body.accessToken;

    // Login seller
    const sellerRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: sellerEmail,
        password: basePassword
      });
    sellerToken = sellerRes.body.accessToken;

    // Create shop
    const shop = await Shop.create({
      title: 'Test Shop',
      owner: sellerId,
      description: 'Test shop',
      phone: '1234567890'
    });
    shopId = shop._id;

    // Create product
    const res = await request
      .post('/api/v1/product/add')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        ...testProduct,
        shopId
      });
    productId = res.body.product._id;

    // Add to cart
    await request
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        productId,
        shopId,
        quantity: 1
      });
  });

  describe('POST /api/v1/order/submit', () => {
    it('should submit order', async () => {
      const res = await request
        .post('/api/v1/order/submit')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shopId,
          shippingAddress: '123 Main St',
          phone: '1234567890'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('pending');

      orderId = res.body.order._id;
    });

    it('should fail without authentication', async () => {
      const res = await request
        .post('/api/v1/order/submit')
        .send({
          shopId,
          shippingAddress: '123 Main St',
          phone: '1234567890'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/order/my', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/order/submit')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shopId,
          shippingAddress: '123 Main St',
          phone: '1234567890'
        });

      orderId = res.body.order._id;
    });

    it('should get buyer orders', async () => {
      const res = await request
        .get('/api/v1/order/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const res = await request.get('/api/v1/order/my');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/order/shop/:shopId', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/order/submit')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shopId,
          shippingAddress: '123 Main St',
          phone: '1234567890'
        });

      orderId = res.body.order._id;
    });

    it('should get shop orders for owner', async () => {
      const res = await request
        .get(`/api/v1/order/shop/${shopId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail for non-owner', async () => {
      const res = await request
        .get(`/api/v1/order/shop/${shopId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/order/:id/approve', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/order/submit')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shopId,
          shippingAddress: '123 Main St',
          phone: '1234567890'
        });

      orderId = res.body.order._id;
    });

    it('should approve order if shop owner', async () => {
      const res = await request
        .patch(`/api/v1/order/${orderId}/approve`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const order = await Order.findById(orderId);
      expect(order.status).toBe('approved');
    });

    it('should fail if not shop owner', async () => {
      const res = await request
        .patch(`/api/v1/order/${orderId}/approve`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/order/:id/decline', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/order/submit')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shopId,
          shippingAddress: '123 Main St',
          phone: '1234567890'
        });

      orderId = res.body.order._id;
    });

    it('should decline order if shop owner', async () => {
      const res = await request
        .patch(`/api/v1/order/${orderId}/decline`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const order = await Order.findById(orderId);
      expect(order.status).toBe('declined');
    });
  });

  describe('DELETE /api/v1/order/:id', () => {
    beforeEach(async () => {
      const res = await request
        .post('/api/v1/order/submit')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shopId,
          shippingAddress: '123 Main St',
          phone: '1234567890'
        });

      orderId = res.body.order._id;
    });

    it('should delete order', async () => {
      const res = await request
        .delete(`/api/v1/order/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const order = await Order.findById(orderId);
      expect(order).toBeNull();
    });
  });
});