// src/controllers/product.js
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, currency, stock, sectionName } = req.body;
  const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

  if (!title || !price) {
    return res.status(400).json({ message: 'Title and price are required' });
  }

  const product = new Product({
    shop: req.params.shopId,
    title,
    description,
    price,
    currency: currency || 'USD',
    images,
    stock: stock || 0,
  });
  await product.save();

  // Add to shop section
  const shop = await Shop.findById(req.params.shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  let section = shop.sections.find(s => s.name === sectionName);
  if (!section) {
    section = { name: sectionName || 'Default', products: [] };
    shop.sections.push(section);
  }
  section.products.push(product._id);
  await shop.save();

  res.status(201).json({ success: true, product });
});

export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const query = { shop: req.params.shopId };
  
  const skip = all ? 0 : (parseInt(page) - 1) * parseInt(limit);
  const limit_int = all ? undefined : parseInt(limit);

  const products = await Product.find(query)
    .skip(skip)
    .limit(limit_int)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(query);

  res.json({ success: true, products, total, page: parseInt(page), limit: parseInt(limit) });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId)
    .populate('shop', 'title owner');
  
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // Track views only for authenticated users
  if (req.user?.id && !product.views.includes(req.user.id)) {
    product.views.push(req.user.id);
    await product.save();
  }

  res.json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.files) {
    updates.images = req.files.map(file => `/uploads/products/${file.filename}`);
  }

  const product = await Product.findByIdAndUpdate(
    req.params.productId, 
    updates, 
    { new: true, runValidators: true }
  );

  if (!product) return res.status(404).json({ message: 'Product not found' });

  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // Remove from shop sections
  const shop = await Shop.findById(product.shop);
  if (shop) {
    shop.sections.forEach(section => {
      section.products = section.products.filter(p => p.toString() !== req.params.productId);
    });
    shop.sections = shop.sections.filter(s => s.products.length > 0);
    await shop.save();
  }

  await Product.findByIdAndDelete(req.params.productId);
  res.json({ success: true, message: 'Product deleted' });
});

export const likeProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const index = product.likes.indexOf(req.user.id);
  if (index === -1) {
    product.likes.push(req.user.id);
  } else {
    product.likes.splice(index, 1);
  }
  await product.save();

  res.json({ success: true, likes: product.likes.length, liked: index === -1 });
});