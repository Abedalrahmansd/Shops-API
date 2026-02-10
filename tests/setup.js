// tests/setup.js
import mongoose from 'mongoose';

afterEach(async () => {
  await mongoose.connection.dropDatabase(); // Clear data after each test
}); 