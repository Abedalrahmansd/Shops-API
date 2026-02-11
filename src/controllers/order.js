// src/controllers/order.js
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { parseMessageTemplate } from '../utils/templateParser.js';
import { sendEmail } from '../utils/email.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Global io instance - pass from server or use socket manager
let io = null;

export const setIO = (ioInstance) => {
  io = ioInstance;
};

export const submitOrder = asyncHandler(async (req, res) => {
  const shopId = req.params.shopId;
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart || !cart.items.length) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const shopItems = cart.items.filter(i => i.shop.toString() === shopId);
  if (!shopItems.length) return res.status(400).json({ message: 'No items for this shop' });

  // Calc total
  let total = 0;
  const items = await Promise.all(shopItems.map(async i => {
    const product = await Product.findById(i.product);
    if (!product) throw new Error('Product not found');
    if (product.stock < i.quantity) throw new Error(`Insufficient stock for ${product.title}`);
    
    total += product.price * i.quantity;
    return { 
      product: i.product, 
      quantity: i.quantity, 
      price: product.price, 
      currency: product.currency 
    };
  }));

  const shop = await Shop.findById(shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const order = new Order({
    user: req.user.id,
    shop: shopId,
    items,
    total,
    currency: items[0]?.currency || 'USD',
  });
  await order.save();

  // Notify shop owner
  try {
    const notif = new Notification({
      user: shop.owner,
      type: 'order',
      content: `New order from customer - Total: ${total} ${items[0]?.currency}`,
      link: `/orders/${order._id}`,
      read: false,
    });
    await notif.save();

    if (io) {
      io.to(`user:${shop.owner}`).emit('notification', notif);
    }

    const owner = await User.findById(shop.owner);
    if (owner?.email) {
      await sendEmail(owner.email, 'New Order', notif.content);
    }
  } catch (err) {
    console.error('Error notifying owner:', err);
  }

  // Remove items from cart
  cart.items = cart.items.filter(i => i.shop.toString() !== shopId);
  await cart.save();

  // Generate WhatsApp msg
  try {
    const products = await Promise.all(items.map(async i => ({ 
      title: (await Product.findById(i.product))?.title, 
      quantity: i.quantity 
    })));
    const parsedMsg = parseMessageTemplate(shop.messageTemplate, { products, total });
    const waUrl = `whatsapp://send?phone=${encodeURIComponent(shop.phone)}&text=${encodeURIComponent(parsedMsg)}`;

    res.json({ success: true, order, waUrl });
  } catch (err) {
    res.json({ success: true, order, waUrl: null });
  }
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate('shop', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const getShopOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ shop: req.params.shopId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('user', 'name email')
    .populate('shop', 'title')
    .populate('items.product', 'title price');
  
  if (!order) return res.status(404).json({ message: 'Order not found' });
  
  // Check ownership
  if (order.user._id.toString() !== req.user.id && 
      (await Shop.findById(order.shop._id)).owner.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  res.json({ success: true, order });
});

export const approveOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const shop = await Shop.findById(order.shop);
  if (shop.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  order.status = 'approved';
  await order.save();

  // Notify customer
  if (io) {
    io.to(`user:${order.user}`).emit('notification', { 
      type: 'order_approved',
      orderId: order._id 
    });
  }

  res.json({ success: true, message: 'Order approved' });
});

export const declineOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const shop = await Shop.findById(order.shop);
  if (shop.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  order.status = 'declined';
  await order.save();

  // Notify customer
  if (io) {
    io.to(`user:${order.user}`).emit('notification', { 
      type: 'order_declined',
      orderId: order._id,
      reason 
    });
  }

  res.json({ success: true, message: 'Order declined' });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const shop = await Shop.findById(order.shop);
  if (shop.owner.toString() !== req.user.id && order.user.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await Order.findByIdAndDelete(req.params.orderId);
  res.json({ success: true, message: 'Order deleted' });
});