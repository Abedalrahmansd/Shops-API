// src/utils/cron.js
import cron from 'cron';
import User from '../models/User.js';
import Cart from '../models/Cart.js';

const purgeJob = new cron.CronJob('0 0 * * *', async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await User.deleteMany({ isActive: false, deactivationDate: { $lt: thirtyDaysAgo } });
  // Optional: Clean old carts (e.g., >90 days inactive)
  await Cart.deleteMany({ updatedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } });
});

export const startCron = () => purgeJob.start();