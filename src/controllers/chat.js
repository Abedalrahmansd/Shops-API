// src/controllers/chat.js
import Message from '../models/Message.js';
import Shop from '../models/Shop.js';
import { asyncHandler } from '../utils/asyncHandler.js';

let io = null;

export const setIO = (ioInstance) => {
  io = ioInstance;
};

export const getChats = asyncHandler(async (req, res) => {
  // Get all conversations for the user (as sender or recipient)
  const chats = await Message.aggregate([
    {
      $match: {
        $or: [
          { from: req.user.id },
          { to: req.user.id }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$from', req.user.id] },
            '$to',
            '$from'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    }
  ]);

  res.json({ success: true, chats });
});

export const getChatHistory = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { limit = 50, page = 1 } = req.query;

  const shop = await Shop.findById(shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({ shop: shopId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('from', 'name avatar')
    .populate('to', 'name avatar')
    .populate('productId', 'title price images');

  const total = await Message.countDocuments({ shop: shopId });

  res.json({ 
    success: true, 
    messages: messages.reverse(),
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { shopId, content, productId } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  const shop = await Shop.findById(shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const message = new Message({
    shop: shopId,
    from: req.user.id,
    to: shop.owner,
    content: content.trim(),
    productId: productId || null,
  });
  await message.save();
  await message.populate('from', 'name avatar');
  await message.populate('to', 'name avatar');
  await message.populate('productId', 'title price');

  // Emit via Socket.io in real-time
  if (io) {
    io.to(`shop:${shopId}`).emit('newMessage', message);
  }

  res.status(201).json({ success: true, message });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });

  // Only sender or recipient can delete
  if (message.from.toString() !== req.user.id && message.to.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await Message.findByIdAndDelete(messageId);
  res.json({ success: true, message: 'Message deleted' });
});