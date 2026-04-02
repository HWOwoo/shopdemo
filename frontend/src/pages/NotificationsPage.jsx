import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Toast, { useToast } from '../components/ui/Toast';

const TYPE_CONFIG = {
  PAYMENT_CONFIRMED: { icon: '✅', cls: 'bg-green-50 border-green-200' },
  ORDER_SHIPPED:     { icon: '🚚', cls: 'bg-blue-50 border-blue-200' },
  ORDER_DELIVERED:   { icon: '📦', cls: 'bg-purple-50 border-purple-200' },
  ORDER_CANCELLED:   { icon: '❌', cls: 'bg-red-50 border-red-200' },
  REVIEW_RECEIVED:   { icon: '⭐', cls: 'bg-yellow-50 border-yellow-200' },
};

function NotificationCard({ notification, onMarkRead }) {
  const config = TYPE_CONFIG[notification.type] ?? { icon: '🔔', cls: 'bg-gray-50 border-gray-200' };

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        notification.read ? 'bg-white border-gray-100 opacity-60' : config.cls
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-semibold ${notification.read ? 'text-gray-500' : 'text-gray-800'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
            )}
          </div>
          <p className={`text-sm ${notification.read ? 'text-gray-400' : 'text-gray-600'}`}>
            {notification.message}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400">
              {new Date(notification.createdAt).toLocaleString('ko-KR')}
            </span>
            {notification.goodsId && (
              <Link
                to={`/goods/${notification.goodsId}`}
                className="text-xs text-indigo-500 hover:underline"
              >
                상품 보기
              </Link>
            )}
            {!notification.read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                읽음 처리
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD
  const { toast, show, hide } = useToast();

  useEffect(() => {
    axiosClient.get('/notifications')
      .then((res) => setNotifications(res.data.data || []))
      .catch(() => show('알림을 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      show('읽음 처리에 실패했습니다.', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      show('전체 읽음 처리되었습니다.', 'success');
    } catch {
      show('처리에 실패했습니다.', 'error');
    }
  };

  const filtered = filter === 'UNREAD'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <Toast toast={toast} onClose={hide} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">알림</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-indigo-600 hover:underline"
          >
            전체 읽음 처리
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'ALL', label: '전체', count: notifications.length },
          { key: 'UNREAD', label: '읽지 않음', count: unreadCount },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs ${filter === key ? 'opacity-80' : 'text-gray-400'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p>{filter === 'UNREAD' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );
}
