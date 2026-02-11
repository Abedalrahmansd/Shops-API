// src/routes/search.js
import express from 'express';
import { search, getCategories, getTrending } from '../controllers/search.js';

const router = express.Router();

router.get('/', search);
router.get('/categories', getCategories);
router.get('/trending', getTrending);

export default router;