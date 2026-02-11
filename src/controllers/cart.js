// src/controllers/cart.js
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id, items: [] });
  // Group by shop (for Flutter)
  const grouped = cart.items.reduce((acc, item) => {
    const shopId = item.shop.toString();
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(item);
    return acc;
  }, {});
  res.json({ success: true, cart: { ...cart.toObject(), grouped } });
};

export const addToCart = async (req, res) => {
  const { productId, quantity, shopId } = req.body;
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id, items: [] });

  const product = await Product.findById(productId);
  if (product.stock < quantity) return res.status(400).json({ message: 'Out of stock' });
  
  const index = cart.items.findIndex(i => i.product.toString() === productId);
  
  if (index > -1) cart.items[index].quantity += quantity || 1;
  else cart.items.push({ shop: shopId, product: productId, quantity: quantity || 1 });

  // Sort by addedAt desc
  cart.items.sort((a, b) => b.addedAt - a.addedAt);
  await cart.save();
  res.json({ success: true, cart });
};

export const removeItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true });
};

// Submit in next controller