// tests/auth.test.js
import supertest from 'supertest';
import app from '../src/index.js'; // Adjust if needed

describe('Auth', () => {
  it('registers user', async () => {
    const res = await supertest(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '123456', name: 'Test' });
    expect(res.status).toBe(201);
  });
});