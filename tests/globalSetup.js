// tests/globalSetup.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns/promises';

dotenv.config({ path: '.env.test' });
dns.setServers(['1.1.1.1']);

export default async () => {
  try {
    const dbUri = process.env.DB_URI_TEST || 'mongodb://localhost:27017/shops-api-test';
    await mongoose.connect(dbUri);
    console.log('Test database connected');
  } catch (err) {
    console.error('Failed to connect to test database:', err);
    process.exit(1);
  }
};