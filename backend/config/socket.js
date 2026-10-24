import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { allowedOrigins } from "./cors.js";

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
  });

  // Har connection pe pehle JWT check (authentication)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id isBlocked");
      if (!user || user.isBlocked) return next(new Error("Not allowed"));

      socket.data.userId = user._id.toString();
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Sirf apne room mein. Client se room ka naam kabhi nahi lete
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
}

// Null ho sakta hai (socket start hone se pehle), isliye use karne wale ?. lagayen
export const getIO = () => io;