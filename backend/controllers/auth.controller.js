import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// The token stores only id + role. Never put the password in it.
const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    // Security: people can only self-register as candidate or recruiter. Never admin.
    const safeRole = role === "recruiter" ? "recruiter" : "candidate";

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: safeRole });

    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    const ok = user && (await bcrypt.compare(password, user.password));
    // Same message for both cases so attackers can't tell which emails exist
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });
    if (user.isBlocked) return res.status(403).json({ message: "Your account has been blocked." });
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({ user: publicUser(req.user) });
}