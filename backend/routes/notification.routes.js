import { Router } from "express";
import { getMyNotifications, markAllRead, markRead } from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect); // teeno roles ke liye

router.get("/", getMyNotifications);
router.patch("/read-all", markAllRead); // "/:id/read" se pehle
router.patch("/:id/read", markRead);

export default router;