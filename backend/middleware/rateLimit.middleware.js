import rateLimit from "express-rate-limit";

const make = (minutes, limit, message) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

export const generalLimiter = make(15, 600, "Too many requests. Please slow down.");
export const authLimiter = make(15, 20, "Too many login attempts. Try again in 15 minutes.");
export const runLimiter = make(1, 30, "Too many code runs. Wait a minute.");
// AI calls mehngi aur slow hain
export const aiLimiter = make(60, 30, "AI usage limit reached. Try again later.");