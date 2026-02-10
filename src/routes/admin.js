// src/routes/admin.js
import express from 'express';
import { getReports, resolveReport, getUsers, seedAdmin } from '../controllers/admin.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();
router.get('/reports', authMiddleware, isAdmin, getReports);
router.patch('/reports/:reportId/resolve', authMiddleware, isAdmin, resolveReport);
router.get('/users', authMiddleware, isAdmin, getUsers);
router.post('/seed-admin', seedAdmin); // Unprotected for initial setup

export default router;