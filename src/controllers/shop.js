// src/controllers/shop.js
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import { slugify } from '../utils/slugify.js';

export const createShop = async (req, res) => {
  const { title, description, tags, category, phone, uniqueId } = req.body;
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
    tags,
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
};

export const getShop = async (req, res) => {
  const shop = await Shop.findOne({ uniqueId: req.params.id } || { _id: req.params.id }).populate('owner', 'name');
  if (!shop || !shop.isActive) return res.status(404).json({ message: 'Shop not found or closed' });
  if (!shop.views.includes(req.user.id)) {
    shop.views.push(req.user.id);
  }
  await shop.save();
  res.json({ success: true, shop });
};

export const updateShop = async (req, res) => {
  const updates = req.body; // incl. customization, icon, messageTemplate
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, updates, { new: true });
  res.json({ success: true, shop });
};

export const deactivateShop = async (req, res) => {
  await Shop.findByIdAndUpdate(req.params.shopId, { isActive: false });
  res.json({ success: true, message: 'Shop deactivated' });
};

export const getMyShops = async (req, res) => {
  const user = await User.findById(req.user.id).populate('shops');
  res.json({ success: true, shops: user.shops });
};

export const setPrimary = async (req, res) => {
  const { shopId } = req.body;
  const user = await User.findById(req.user.id);
  if (!user.shops.includes(shopId)) return res.status(400).json({ message: 'Not your shop' });
  user.primaryShop = shopId;
  await user.save();
  res.json({ success: true });
};

export const followShop = async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  const index = shop.followers.indexOf(req.user.id);
  if (index === -1) {
    shop.followers.push(req.user.id);
  } else {
    shop.followers.splice(index, 1);
  }
  await shop.save();
  res.json({ success: true, followers: shop.followers.length });
};

export const likeShop = async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  const index = shop.likes.indexOf(req.user.id);
  if (index === -1) {
    shop.likes.push(req.user.id);
  } else {
    shop.likes.splice(index, 1);
  }
  await shop.save();
  res.json({ success: true, likes: shop.likes.length });
};

export const shareShop = async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
  res.json({ success: true, shares: shop.shares });
};

export const reportShop = async (req, res) => {
  const { reason } = req.body;
  // Create Report (model not yet, but placeholder)
  // For now: 
  console.log(`Report: ${reason}`);
  res.json({ success: true, message: 'Reported' });
};

export const verifyShop = async (req, res) => {
  await Shop.findByIdAndUpdate(req.params.id, { isVerified: true });
  res.json({ success: true });
};