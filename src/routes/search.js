// src/routes/search.js
import express from 'express';
import { search } from '../controllers/search.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, search);

export default router;