// tests/product.test.js
import supertest from 'supertest';
import app from '../src/index.js'; // Your main app file
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Shop from '../src/models/Shop.js';
import Product from '../src/models/Product.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

let token;
let userId;
let shopId;
let productId;

describe('Product Endpoints', () => {
  beforeAll(async () => {
    // Create test user
    const hashed = await bcrypt.hash('password', 10);
    const user = new User({ email: 'product@test.com', password: hashed, name: 'Test' });
    await user.save();
    userId = user._id;

    // Login for token
    token = jwt.sign({ id: user._id, isAdmin: false }, config.JWT_SECRET, { expiresIn: '15m' });

    // Create shop
    const shop = new Shop({ owner: userId, title: 'Test Shop', phone: '123', uniqueId: 'test-shop' });
    await shop.save();
    shopId = shop._id;
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Shop.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a product (201)', async () => {
    const res = await supertest(app)
      .post(`/api/products/shops/${shopId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Product')
      .field('price', 10)
      .field('currency', 'USD')
      .attach('images', Buffer.from('fakeimage'), 'test.jpg'); // Mock file or use real path
    expect(res.status).toBe(201);
    expect(res.body.product.title).toBe('Test Product');
    productId = res.body.product._id;
  });

  it('should fail create without auth (401)', async () => {
    const res = await supertest(app)
      .post(`/api/products/shops/${shopId}`)
      .field('title', 'Unauthorized');
    expect(res.status).toBe(401);
  });

  it('should fail create if not owner (403)', async () => {
    const wrongToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, config.JWT_SECRET); // Fake user
    const res = await supertest(app)
      .post(`/api/products/shops/${shopId}`)
      .set('Authorization', `Bearer ${wrongToken}`)
      .field('title', 'Not Owner');
    expect(res.status).toBe(403);
  });

  it('should get shop products (200)', async () => {
    const res = await supertest(app).get(`/api/products/shops/${shopId}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it('should get single product (200)', async () => {
    const res = await supertest(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.product.title).toBe('Test Product');
  });

  it('should fail get non-existent product (404)', async () => {
    const res = await supertest(app).get(`/api/products/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  it('should update product (200)', async () => {
    const res = await supertest(app)
      .patch(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 20 });
    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(20);
  });

  it('should delete product (200)', async () => {
    const res = await supertest(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should like product (200)', async () => {
    // Recreate for like test
    const tempProduct = new Product({ shop: shopId, title: 'Like Test', price: 10 });
    await tempProduct.save();
    const res = await supertest(app)
      .post(`/api/products/${tempProduct._id}/like`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.likes).toBe(1);
  });
});