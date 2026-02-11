// tests/setup.js
import mongoose from 'mongoose';

beforeEach(async () => {
  // Clear specific test collections but preserve users for auth flow
  const collections = mongoose.connection.collections;
  const collectionsToClean = ['products', 'shops', 'orders', 'carts', 'notifications', 'messages', 'reviews', 'reports'];
  
  for (const collectionName of collectionsToClean) {
    if (collections[collectionName]) {
      await collections[collectionName].deleteMany({});
    }
  }
});

afterEach(async () => {
  // Clean up test collections after each test too
  const collections = mongoose.connection.collections;
  const collectionsToClean = ['products', 'shops', 'orders', 'carts', 'notifications', 'messages', 'reviews', 'reports'];
  
  for (const collectionName of collectionsToClean) {
    if (collections[collectionName]) {
      await collections[collectionName].deleteMany({});
    }
  }
});