import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import api, { API_URL } from "../api/axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
const SOCKET_URL = API_URL;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);

  // Login hone par: purani notifications lao + socket connect karo
  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return;
    }

    let active = true;
    api.get("/notifications")
      .then((res) => {
        if (!active) return;
        setItems(res.data.notifications);
        setUnread(res.data.unreadCount);
      })
      .catch(() => {});

    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem("token") } });
    socket.on("notification", (n) => {
      setItems((prev) => [n, ...prev].slice(0, 30));
      setUnread((count) => count + 1);
      setToast(n);
    });

    // Logout ya component hatne par connection band
    return () => {
      active = false;
      socket.disconnect();
    };
  }, [user?.id]);

  // Toast 5 sec baad apne aap gayab
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((count) => Math.max(0, count - 1));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      /* UI pehle hi update ho chuka, dobara load pe sahi ho jayega */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await api.patch("/notifications/read-all");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ items, unread, markRead, markAllRead }}>
      {children}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white p-4 rounded-xl shadow-lg max-w-sm">
          <div className="font-semibold text-sm">{toast.title}</div>
          <div className="text-xs text-gray-300">{toast.message}</div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);