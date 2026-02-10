// src/controllers/order.js
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import { parseMessageTemplate } from '../utils/templateParser.js';

export const submitOrder = async (req, res) => {
  const shopId = req.params.shopId;
  const cart = await Cart.findOne({ user: req.user.id });
  const shopItems = cart.items.filter(i => i.shop.toString() === shopId);
  if (!shopItems.length) return res.status(400).json({ message: 'No items for this shop' });

  // Calc total
  let total = 0;
  const items = await Promise.all(shopItems.map(async i => {
    const product = await Product.findById(i.product);
    total += product.price * i.quantity;
    return { product: i.product, quantity: i.quantity, price: product.price, currency: product.currency };
  }));

  const order = new Order({
    user: req.user.id,
    shop: shopId,
    items,
    total,
    currency: items[0].currency, // Assume same
  });
  await order.save();

  // Remove from cart
  cart.items = cart.items.filter(i => i.shop.toString() !== shopId);
  await cart.save();

  // Generate WhatsApp msg
  const shop = await Shop.findById(shopId);
  const products = await Promise.all(items.map(async i => ({ title: (await Product.findById(i.product)).title, quantity: i.quantity })));
  const parsedMsg = parseMessageTemplate(shop.messageTemplate, { products, total });
  const waUrl = `whatsapp://send?phone=${shop.phone}&text=${encodeURIComponent(parsedMsg)}`;

  res.json({ success: true, order, waUrl });
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate('shop', 'title');
  res.json({ success: true, orders });
};

export const getShopOrders = async (req, res) => {
  const orders = await Order.find({ shop: req.params.shopId }).populate('user', 'name');
  res.json({ success: true, orders });
};

export const approveOrder = async (req, res) => {
  await Order.findByIdAndUpdate(req.params.orderId, { status: 'approved' });
  res.json({ success: true });
};

export const declineOrder = async (req, res) => {
  await Order.findByIdAndUpdate(req.params.orderId, { status: 'declined' });
  res.json({ success: true });
};

export const deleteOrder = async (req, res) => {
  await Order.findByIdAndDelete(req.params.orderId);
  res.json({ success: true });
};