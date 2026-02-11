// tests/globalTeardown.js
import mongoose from 'mongoose';

export default async () => {
  try {
    // Clean up test database
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('Test database cleaned up');
    }
    await mongoose.disconnect();
    console.log('Test database disconnected');
  } catch (err) {
    console.error('Error during teardown:', err);
  }
};