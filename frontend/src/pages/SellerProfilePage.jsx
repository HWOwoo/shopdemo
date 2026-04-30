import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { getOrCreateRoom } from '../api/chat';
import { useAuth } from '../store/authStore';
import Spinner from '../components/ui/Spinner';

const AVATAR_GRADIENTS = [
  'from-blue-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-green-400 to-teal-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-400 to-blue-500',
  'from-purple-400 to-pink-500',
  'from-teal-400 to-cyan-500',
];

function getAvatarGradient(username) {
  const hash = (username || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function getInitials(username) {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

export default function SellerProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleMessageClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setChatLoading(true);
    try {
      const room = await getOrCreateRoom(username);
      navigate(`/chat/${room.roomId}`);
    } catch {
      // ignore
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosClient.get(`/users/${username}/profile`),
      axiosClient.get(`/goods/seller/${username}`),
    ])
      .then(([pRes, gRes]) => {
        setProfile(pRes.data.data);
        setGoods(gRes.data.data || []);
      })
      .catch(() => setError('프로필을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!profile) return <div className="text-center py-16 text-gray-400">프로필을 찾을 수 없습니다.</div>;

  const snsLinks = [
    { url: profile.twitterUrl, label: 'Twitter / X', icon: '𝕏' },
    { url: profile.pixivUrl, label: 'Pixiv', icon: 'P' },
    { url: profile.instagramUrl, label: 'Instagram', icon: 'IG' },
  ].filter((l) => l.url);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 프로필 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarGradient(profile.username)} flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0`}>
            {getInitials(profile.username)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-800">{profile.username}</h1>
            {profile.role === 'SELLER' && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                Creator
              </span>
            )}
            {profile.bio && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            )}
            {snsLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                {snsLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <span className="font-bold">{link.icon}</span>
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            {currentUser?.username !== username && (
              <div className="mt-4 flex justify-center sm:justify-start">
                <button
                  onClick={handleMessageClick}
                  disabled={chatLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {chatLoading ? '연결 중...' : '메시지'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 굿즈 목록 */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        굿즈 목록
        <span className="ml-2 text-sm font-normal text-gray-400">{goods.length}개</span>
      </h2>

      {goods.length === 0 ? (
        <div className="text-center py-12 text-gray-400">등록된 굿즈가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {goods.map((g) => (
            <Link
              key={g.id}
              to={`/goods/${g.id}`}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {g.options?.[0]?.imageUrl ? (
                  <img
                    src={g.options[0].imageUrl}
                    alt={g.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                    🖼
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 truncate">{g.name}</p>
                <p className="text-sm font-bold text-indigo-600 mt-1">
                  {Number(g.price).toLocaleString()}원~
                </p>
                {g.soldOut && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                    품절
                  </span>
                )}
                {g.goodsType === 'PREORDER' && (
                  <span className="inline-block mt-1 ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    수요조사
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
