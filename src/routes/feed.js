// src/routes/feed.js
import express from 'express';
import { getFeed, getTrendingFeed, updateInterests } from '../controllers/feed.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';

const updateInterestsSchema = Joi.object({
  interests: Joi.array().items(Joi.string()).required(),
});

const router = express.Router();

router.get('/', authMiddleware, getFeed);
router.get('/trending', authMiddleware, getTrendingFeed);
router.patch('/interests', authMiddleware, validate(updateInterestsSchema), updateInterests);

export default router;