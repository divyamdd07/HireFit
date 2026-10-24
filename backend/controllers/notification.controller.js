import Notification from "../models/Notification.js";

export async function getMyNotifications(req, res, next) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    // user bhi filter mein: kisi aur ki notification nahi badal sakte
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}