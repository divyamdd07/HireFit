import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";

// Ek user ko notification. Kabhi throw nahi karta, taaki main kaam na ruke
export async function notify(userId, { type = "info", title, message = "", link = "" }) {
  try {
    const notification = await Notification.create({ user: userId, type, title, message, link });
    getIO()?.to(`user:${userId}`).emit("notification", notification);
  } catch (err) {
    console.error("Notification failed:", err.message);
  }
}

// Bahut saare users ko
export async function notifyMany(userIds, payload) {
  await Promise.all(userIds.map((id) => notify(id, payload)));
}