const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const User = require("../models/User");
const Notification = require("../models/Notification");

// GET /api/notifications — get logged-in user's notifications
router.get("/", protect, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark notifications as read" });
  }
});

// PATCH /api/notifications/:id/read — mark single as read
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
});

// POST /api/notifications/fcm-token — save user's FCM token
router.post("/fcm-token", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token required" });

    await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
    res.status(200).json({ success: true, message: "FCM token saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save FCM token" });
  }
});

// DELETE /api/notifications/fcm-token — remove FCM token on logout
router.delete("/fcm-token", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { fcmToken: null });
    res.status(200).json({ success: true, message: "FCM token removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove FCM token" });
  }
});

module.exports = router;
