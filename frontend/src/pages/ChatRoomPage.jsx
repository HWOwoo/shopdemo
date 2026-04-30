import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { getMessages, sendMessage, getMyRooms } from '../api/chat';

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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDay.getTime() === today.getTime()) return '오늘';
  if (msgDay.getTime() === yesterday.getTime()) return '어제';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateKey(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUsername, setOtherUsername] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // 방 목록에서 상대방 이름 가져오기 (메시지 없어도 표시)
  useEffect(() => {
    getMyRooms()
      .then((rooms) => {
        const room = rooms.find((r) => String(r.roomId) === String(roomId));
        if (room) setOtherUsername(room.otherUsername);
      })
      .catch(() => {});
  }, [roomId]);

  const fetchMessages = (scrollToBottom = false) => {
    getMessages(roomId)
      .then((msgs) => {
        setMessages(msgs);
        if (msgs.length > 0 && !otherUsername) {
          const other = msgs.find((m) => m.senderUsername !== user?.username);
          if (other) setOtherUsername(other.senderUsername);
        }
        if (scrollToBottom) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchMessages(true);
    let interval = setInterval(() => fetchMessages(false), 3000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchMessages(false);
        interval = setInterval(() => fetchMessages(false), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [roomId]);

  // textarea 자동 높이 조절
  const handleContentChange = (e) => {
    setContent(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(roomId, content.trim());
      setMessages((prev) => [...prev, msg]);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  let lastDateKey = null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate('/chat')}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {otherUsername && (
          <Link
            to={`/seller/${otherUsername}`}
            className="flex items-center gap-2.5 flex-1 min-w-0 group"
          >
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(otherUsername)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
              {getInitials(otherUsername)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                {otherUsername}
              </p>
              <p className="text-xs text-gray-400">프로필 보기</p>
            </div>
          </Link>
        )}
        {!otherUsername && (
          <div className="flex-1">
            <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-0.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-8">
            {otherUsername && (
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarGradient(otherUsername)} flex items-center justify-center text-white text-xl font-bold shadow-md mb-1`}>
                {getInitials(otherUsername)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-600">
                {otherUsername ? `${otherUsername}님과의 대화` : '새 대화'}
              </p>
              <p className="text-xs text-gray-400 mt-1">첫 메시지를 보내보세요</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.senderUsername === user?.username;
          const dateKey = formatDateKey(msg.createdAt);
          const showDateDivider = dateKey !== lastDateKey;
          lastDateKey = dateKey;

          const nextMsg = messages[idx + 1];
          const isLastInGroup =
            !nextMsg ||
            nextMsg.senderUsername !== msg.senderUsername ||
            formatDateKey(nextMsg.createdAt) !== dateKey;

          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium bg-white px-2">
                    {formatDate(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
                {/* 상대방 아바타 */}
                {!isMine && (
                  <div className="flex-shrink-0 w-7">
                    {isLastInGroup ? (
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(msg.senderUsername)} flex items-center justify-center text-white text-[10px] font-bold`}>
                        {getInitials(msg.senderUsername)}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md shadow-sm'
                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* 시간 */}
                {isLastInGroup && (
                  <span className="text-[10px] text-gray-400 flex-shrink-0 mb-0.5 tabular-nums">
                    {formatTime(msg.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 sm:px-4 py-3">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
              ref={(el) => {
                textareaRef.current = el;
                inputRef.current = el;
              }}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
              style={{ minHeight: '22px', maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              content.trim() && !sending
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md active:scale-95'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-[11px] text-gray-300 mt-1.5 text-center">Enter로 전송 · Shift+Enter로 줄바꿈</p>
      </div>
    </div>
  );
}
