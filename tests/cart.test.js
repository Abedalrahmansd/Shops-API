// tests/cart.test.js
import supertest from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Shop from '../src/models/Shop.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

let token;
let userId;
let shopId;
let productId;

describe('Cart Endpoints', () => {
  beforeAll(async () => {
    const hashed = await bcrypt.hash('password', 10);
    const user = new User({ email: 'cart@test.com', password: hashed, name: 'Test' });
    await user.save();
    userId = user._id;
    token = jwt.sign({ id: user._id }, config.JWT_SECRET);

    const shop = new Shop({ owner: userId, title: 'Test Shop', phone: '123', uniqueId: 'test-shop' });
    await shop.save();
    shopId = shop._id;

    const product = new Product({ shop: shopId, title: 'Cart Product', price: 10 });
    await product.save();
    productId = product._id;
  });

  afterAll(async () => {
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await Shop.deleteMany({});
    await User.deleteMany({});
  });

  it('should get empty cart (200)', async () => {
    const res = await supertest(app)
      .get('/api/carts/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cart.items.length).toBe(0);
  });

  it('should add to cart (200)', async () => {
    const res = await supertest(app)
      .post('/api/carts/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 2, shopId });
    expect(res.status).toBe(200);
    expect(res.body.cart.items[0].quantity).toBe(2);
  });

  it('should fail add without auth (401)', async () => {
    const res = await supertest(app).post('/api/carts/add').send({ productId });
    expect(res.status).toBe(401);
  });

  it('should remove item (200)', async () => {
    const res = await supertest(app)
      .delete(`/api/carts/item/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});