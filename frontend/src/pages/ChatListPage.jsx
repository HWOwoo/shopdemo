import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRooms } from '../api/chat';

const AVATAR_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-pink-400 to-rose-600',
  'from-emerald-400 to-teal-600',
  'from-orange-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-indigo-400 to-blue-600',
  'from-fuchsia-400 to-pink-600',
  'from-cyan-400 to-sky-600',
];

function getAvatarGradient(username) {
  const hash = (username || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function getInitials(username) {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('ko-KR', { weekday: 'short' });
  }
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRooms = () => {
    getMyRooms()
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRooms();
    let interval = setInterval(fetchRooms, 5000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchRooms();
        interval = setInterval(fetchRooms, 5000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto px-0 sm:px-4">
      {/* 헤더 */}
      <div className="px-4 sm:px-0 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">메시지</h1>
        {!loading && rooms.length > 0 && (
          <p className="text-sm text-gray-400 mt-0.5">대화 {rooms.length}개</p>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">아직 대화가 없어요</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            판매자 페이지나 상품 페이지에서<br />메시지 버튼을 눌러 대화를 시작해보세요
          </p>
        </div>
      ) : (
        <div className="bg-white sm:rounded-2xl sm:border sm:border-gray-100 sm:shadow-sm overflow-hidden divide-y divide-gray-50">
          {rooms.map((room) => (
            <button
              key={room.roomId}
              onClick={() => navigate(`/chat/${room.roomId}`)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
            >
              {/* 아바타 */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(room.otherUsername)} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                  {getInitials(room.otherUsername)}
                </div>
                {room.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full" />
                )}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm font-semibold truncate ${room.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {room.otherUsername}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                    {formatTime(room.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${room.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {room.lastMessage ?? '아직 메시지가 없습니다'}
                  </p>
                  {room.unreadCount > 0 && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                      {room.unreadCount > 99 ? '99+' : room.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {/* 화살표 */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 group-hover:text-gray-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
