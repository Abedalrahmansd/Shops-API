// src/controllers/product.js
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';

export const createProduct = async (req, res) => {
  const { title, description, price, currency, stock, sectionName } = req.body;
  const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

  const product = new Product({
    shop: req.params.shopId,
    title,
    description,
    price,
    currency,
    images,
    stock,
  });
  await product.save();

  // Add to shop section
  const shop = await Shop.findById(req.params.shopId);
  let section = shop.sections.find(s => s.name === sectionName);
  if (!section) {
    section = { name: sectionName || 'Default', products: [] };
    shop.sections.push(section);
  }
  section.products.push(product._id);
  await shop.save();

  res.status(201).json({ success: true, product });
};

export const getProducts = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const query = { shop: req.params.shopId };
  const products = await Product.find(query)
    .skip(all ? 0 : (page - 1) * limit)
    .limit(all ? Infinity : parseInt(limit));
  res.json({ success: true, products });
};

export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (!product.views.includes(req.user.id)) {
    product.views.push(req.user.id);
  }
  await product.save();
  res.json({ success: true, product });
};

export const updateProduct = async (req, res) => {
  const updates = req.body;
  if (req.files) updates.images = req.files.map(file => `/uploads/products/${file.filename}`);
  const product = await Product.findByIdAndUpdate(req.params.productId, updates, { new: true });
  res.json({ success: true, product });
};

export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.productId);
  // Remove from shop sections (optional: loop and splice)
  res.json({ success: true });
};

export const likeProduct = async (req, res) => {
  const product = await Product.findById(req.params.productId);
  const index = product.likes.indexOf(req.user.id);
  if (index === -1) product.likes.push(req.user.id);
  else product.likes.splice(index, 1);
  await product.save();
  res.json({ success: true, likes: product.likes.length });
};