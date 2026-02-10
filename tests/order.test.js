// tests/order.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Shop from '../src/models/Shop.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

let token;
let userId;
let shopId;
let productId;
let orderId;

describe('Order Endpoints', () => {
  beforeAll(async () => {
    const hashed = await bcrypt.hash('password', 10);
    const user = new User({ email: 'order@test.com', password: hashed, name: 'Test' });
    await user.save();
    userId = user._id;
    token = jwt.sign({ id: user._id }, config.JWT_SECRET);

    const shop = new Shop({ owner: userId, title: 'Test Shop', phone: '123', uniqueId: 'test-shop' });
    await shop.save();
    shopId = shop._id;

    const product = new Product({ shop: shopId, title: 'Order Product', price: 10, currency: 'USD' });
    await product.save();
    productId = product._id;

    // Add to cart for submit test
    const cart = new Cart({ user: userId, items: [{ shop: shopId, product: productId, quantity: 1 }] });
    await cart.save();
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await Shop.deleteMany({});
    await User.deleteMany({});
  });

  it('should submit order (200)', async () => {
    const res = await supertest(app)
      .post(`/api/orders/submit/${shopId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.order.total).toBe(10);
    expect(res.body.waUrl).toContain('whatsapp://send');
    orderId = res.body.order._id;
  });

  it('should fail submit empty cart (400)', async () => {
    const res = await supertest(app)
      .post(`/api/orders/submit/${shopId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('should get my orders (200)', async () => {
    const res = await supertest(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBe(1);
  });

  it('should get shop orders (200)', async () => {
    const res = await supertest(app)
      .get(`/api/orders/shop/${shopId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBe(1);
  });

  it('should approve order (200)', async () => {
    const res = await supertest(app)
      .patch(`/api/orders/${orderId}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should decline order (200)', async () => {
    // Assume another order or update status back
    await Order.findByIdAndUpdate(orderId, { status: 'pending' });
    const res = await supertest(app)
      .patch(`/api/orders/${orderId}/decline`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should delete order (200)', async () => {
    const res = await supertest(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should fail actions without auth (401)', async () => {
    const res = await supertest(app).get('/api/orders/my');
    expect(res.status).toBe(401);
  });

  it('should fail owner-only actions if not owner (403)', async () => {
    const wrongToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, config.JWT_SECRET);
    const res = await supertest(app)
      .get(`/api/orders/shop/${shopId}`)
      .set('Authorization', `Bearer ${wrongToken}`);
    expect(res.status).toBe(403);
  });
});