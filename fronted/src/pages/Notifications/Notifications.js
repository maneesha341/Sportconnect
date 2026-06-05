import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Notifications.css';

const TYPE_ICONS = {
  booking: '📅',
  message: '💬',
  review:  '⭐',
  status:  '✅',
  report:  '📊',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    await api.delete('/notifications/clear');
    setNotifications([]);
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      await api.put(`/notifications/${notif._id}/read`);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
    }
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notif-page">
      <h1>Notifications {unreadCount > 0 && <span style={{color:'var(--accent)',fontSize:28}}>({unreadCount})</span>}</h1>
      <p className="notif-subtitle">Stay updated on bookings, messages and reviews</p>

      {notifications.length > 0 && (
        <div className="notif-actions">
          {unreadCount > 0 && (
            <button className="btn-outline" style={{fontSize:13,padding:'8px 16px'}} onClick={markAllRead}>
              ✓ Mark all as read
            </button>
          )}
          <button className="btn-outline" style={{fontSize:13,padding:'8px 16px',color:'var(--danger)',borderColor:'rgba(255,71,87,0.3)'}} onClick={clearAll}>
            🗑 Clear all
          </button>
        </div>
      )}

      {loading ? (
        <p style={{color:'var(--text-secondary)'}}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">🔔</div>
          <h3>All caught up!</h3>
          <p>No notifications yet. Activity will appear here.</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`notif-item ${!notif.read ? 'unread' : ''}`}
              onClick={() => handleClick(notif)}
            >
              <div className={`notif-icon-wrap ${notif.type}`}>
                {TYPE_ICONS[notif.type] || '🔔'}
              </div>
              <div className="notif-body">
                <div className="notif-title">{notif.title}</div>
                <div className="notif-msg">{notif.message}</div>
                <div className="notif-time">{timeAgo(notif.createdAt)}</div>
              </div>
              {!notif.read && <div className="notif-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}