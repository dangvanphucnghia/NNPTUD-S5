const Notification = require('../models/notification');

const notificationController = {
  getByUser: async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 });
      res.json({ success: true, data: notifications });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi lấy thông báo', error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { userId, title, message, type } = req.body;
      const notification = await Notification.create({ userId, title, message, type });
      res.status(201).json({ success: true, data: notification });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi tạo thông báo', error: err.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      res.json({ success: true, data: notification });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi cập nhật trạng thái', error: err.message });
    }
  }
};

module.exports = notificationController;
