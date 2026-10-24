import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 1) AUTHENTICATION: is the user logged in?
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Please log in." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User no longer exists." });
    if (user.isBlocked) return res.status(403).json({ message: "Your account has been blocked." });
    req.user = user; // available in the next controllers
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

// 2) AUTHORIZATION (RBAC): does the user have the right role?
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You don't have permission to do this." });
  }
  next();
};