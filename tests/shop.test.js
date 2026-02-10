// tests/shop.test.js
import supertest from 'supertest';
import app from '../src/index.js';

describe('Shops', () => {
  let token; // Get from login test or mock
  it('creates shop', async () => {
    const res = await supertest(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Shop', phone: '123456' });
    expect(res.status).toBe(201);
  });
});