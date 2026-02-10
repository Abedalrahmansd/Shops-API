// src/routes/search.js
import express from 'express';
import { search } from '../controllers/search.js';
// import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', search);

export default router;