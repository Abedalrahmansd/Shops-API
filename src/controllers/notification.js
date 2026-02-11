// src/controllers/notification.js
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { user: req.user.id };
  if (unreadOnly === 'true') query.read = false;

  const notifications = await Notification.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });

  res.json({ 
    success: true, 
    notifications,
    total,
    unreadCount,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });

  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  notification.read = true;
  await notification.save();

  res.json({ success: true, message: 'Marked as read' });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { read: true }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });

  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await Notification.findByIdAndDelete(notificationId);

  res.json({ success: true, message: 'Notification deleted' });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user.id });
  res.json({ success: true, message: 'All notifications cleared' });
});