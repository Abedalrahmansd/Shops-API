// src/controllers/shop.js
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import { slugify } from '../utils/slugify.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import Report from '../models/Report.js';

export const createShop = asyncHandler(async (req, res) => {
  const { title, description, tags, category, phone, uniqueId } = req.body;
  
  if (!title || !phone) {
    return res.status(400).json({ message: 'Title and phone are required' });
  }

  let finalUniqueId = uniqueId || slugify(title);

  // Check uniqueness
  let existing = await Shop.findOne({ uniqueId: finalUniqueId });
  while (existing) {
    finalUniqueId = slugify(title) + '-' + Math.floor(Math.random() * 1000);
    existing = await Shop.findOne({ uniqueId: finalUniqueId });
  }

  const shop = new Shop({
    owner: req.user.id,
    title,
    description,
    tags: tags || [],
    category,
    phone,
    uniqueId: finalUniqueId,
  });
  await shop.save();

  // Add to user's shops and set primary if first
  const user = await User.findById(req.user.id);
  user.shops.push(shop._id);
  if (!user.primaryShop) user.primaryShop = shop._id;
  await user.save();

  res.status(201).json({ success: true, shop });
});

export const getShop = asyncHandler(async (req, res) => {
  const query = {};
  
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    query.$or = [{ uniqueId: req.params.id }, { _id: req.params.id }];
  } else {
    query.uniqueId = req.params.id;
  }

  const shop = await Shop.findOne(query)
    .populate('owner', 'name avatar')
    .populate('sections.products', 'title price images');

  if (!shop || !shop.isActive) {
    return res.status(404).json({ message: 'Shop not found or closed' });
  }

  // Track views for authenticated users
  if (req.user?.id && !shop.views.includes(req.user.id)) {
    shop.views.push(req.user.id);
    await shop.save();
  }

  res.json({ success: true, shop });
});

export const updateShop = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  const shop = await Shop.findByIdAndUpdate(
    req.params.shopId, 
    updates, 
    { new: true, runValidators: true }
  );

  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  res.json({ success: true, shop });
});

export const deactivateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(
    req.params.shopId, 
    { isActive: false },
    { new: true }
  );
  
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  res.json({ success: true, message: 'Shop deactivated', shop });
});

export const getMyShops = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('shops');
  res.json({ success: true, shops: user.shops || [] });
});

export const setPrimary = asyncHandler(async (req, res) => {
  const { shopId } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({ message: 'Invalid shop ID' });
  }

  const user = await User.findById(req.user.id);
  if (!user.shops.includes(shopId)) {
    return res.status(400).json({ message: 'Not your shop' });
  }

  user.primaryShop = shopId;
  await user.save();
  res.json({ success: true, message: 'Primary shop updated' });
});

export const followShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const index = shop.followers.indexOf(req.user.id);
  if (index === -1) {
    shop.followers.push(req.user.id);
  } else {
    shop.followers.splice(index, 1);
  }
  await shop.save();

  res.json({ success: true, followers: shop.followers.length, following: index === -1 });
});

export const likeShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const index = shop.likes.indexOf(req.user.id);
  if (index === -1) {
    shop.likes.push(req.user.id);
  } else {
    shop.likes.splice(index, 1);
  }
  await shop.save();

  res.json({ success: true, likes: shop.likes.length, liked: index === -1 });
});

export const shareShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(
    req.params.id, 
    { $inc: { shares: 1 } }, 
    { new: true }
  );
  
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  res.json({ success: true, shares: shop.shares });
});

export const reportShop = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  if (!reason || reason.length < 10) {
    return res.status(400).json({ message: 'Reason must be at least 10 characters' });
  }

  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const report = new Report({
    reporter: req.user.id,
    targetType: 'shop',
    targetId: shop._id,
    reason,
  });
  await report.save();

  res.json({ success: true, message: 'Shop reported successfully' });
});

export const verifyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(
    req.params.id, 
    { isVerified: true },
    { new: true }
  );
  
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  res.json({ success: true, message: 'Shop verified', shop });
});