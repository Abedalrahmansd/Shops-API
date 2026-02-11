// src/controllers/cart.js
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'title price currency stock images')
    .populate('items.shop', 'title');

  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  // Group by shop
  const grouped = {};
  cart.items.forEach(item => {
    const shopId = item.shop._id.toString();
    if (!grouped[shopId]) {
      grouped[shopId] = {
        shop: item.shop,
        items: []
      };
    }
    grouped[shopId].items.push(item);
  });

  res.json({ success: true, cart: cart.toObject(), grouped });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, shopId } = req.body;

  if (!productId || !shopId) {
    return res.status(400).json({ message: 'Product ID and shop ID are required' });
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (product.stock < quantity) {
    return res.status(400).json({ message: `Only ${product.stock} items available` });
  }

  const index = cart.items.findIndex(i => i.product.toString() === productId);

  if (index > -1) {
    // Update quantity
    if (product.stock < cart.items[index].quantity + quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }
    cart.items[index].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({ 
      shop: shopId, 
      product: productId, 
      quantity,
      addedAt: new Date()
    });
  }

  // Sort by addedAt desc
  cart.items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  await cart.save();

  // Repopulate before response
  await cart.populate('items.product', 'title price currency stock images');
  await cart.populate('items.shop', 'title');

  res.json({ success: true, cart, message: 'Item added to cart' });
});

export const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const initialLength = cart.items.length;
  cart.items = cart.items.filter(i => i.product.toString() !== productId);

  if (cart.items.length === initialLength) {
    return res.status(404).json({ message: 'Item not in cart' });
  }

  await cart.save();
  res.json({ success: true, message: 'Item removed from cart' });
});

export const updateQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1' });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const item = cart.items.find(i => i.product.toString() === productId);
  if (!item) return res.status(404).json({ message: 'Item not in cart' });

  const product = await Product.findById(productId);
  if (product.stock < quantity) {
    return res.status(400).json({ message: `Only ${product.stock} items available` });
  }

  item.quantity = quantity;
  await cart.save();

  res.json({ success: true, message: 'Quantity updated' });
});

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [] }
  );
  res.json({ success: true, message: 'Cart cleared' });
});