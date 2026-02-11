// src/routes/admin.js
import express from 'express';
import { getReports, resolveReport, getUsers, getShops, seedAdmin, banUser, unbanUser, suspendShop, unsuspendShop, getStats } from '../controllers/admin.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();

// Seed admin (unprotected for initial setup - should be removed in production)
router.post('/seed-admin', seedAdmin);

// Protected admin routes
router.get('/stats', authMiddleware, isAdmin, getStats);
router.get('/reports', authMiddleware, isAdmin, getReports);
router.patch('/reports/:reportId', authMiddleware, isAdmin, resolveReport);

router.get('/users', authMiddleware, isAdmin, getUsers);
router.post('/users/:userId/ban', authMiddleware, isAdmin, banUser);
router.post('/users/:userId/unban', authMiddleware, isAdmin, unbanUser);

router.get('/shops', authMiddleware, isAdmin, getShops);
router.post('/shops/:shopId/suspend', authMiddleware, isAdmin, suspendShop);
router.post('/shops/:shopId/unsuspend', authMiddleware, isAdmin, unsuspendShop);

export default router;