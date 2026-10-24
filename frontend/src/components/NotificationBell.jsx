import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (n) => {
    if (!n.read) markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative text-xl" aria-label="Notifications">
        🔔
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-40 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center p-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 && <p className="p-4 text-sm text-gray-400">No notifications yet.</p>}

          {items.map((n) => (
            <button key={n._id} onClick={() => handleClick(n)}
              className={`block w-full text-left p-3 border-b hover:bg-gray-50 ${n.read ? "" : "bg-blue-50"}`}>
              <div className="text-sm font-medium">{n.title}</div>
              <div className="text-xs text-gray-600">{n.message}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}