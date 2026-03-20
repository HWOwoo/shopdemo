import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';

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

const ROLE_LABEL = { BUYER: '구매자', SELLER: '판매자', ADMIN: '관리자' };

export default function Navbar() {
  const { isAuthenticated, user, dispatch } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-4">

        {/* 로고 */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">다</span>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">다굿즈</span>
        </Link>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="굿즈 검색"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </form>

        <div className="flex-1" />

        {/* 셀러: 굿즈 등록 버튼 */}
        {isAuthenticated && user?.role === 'SELLER' && (
          <Link
            to="/seller/goods/new"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + 굿즈 등록
          </Link>
        )}

        {/* 관리자: 심사 링크 */}
        {isAuthenticated && user?.role === 'ADMIN' && (
          <Link
            to="/admin/goods/pending"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            심사 대기
          </Link>
        )}

        {/* 유저 영역 */}
        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(user?.username)} flex items-center justify-center text-white text-xs font-bold hover:opacity-85 transition-opacity ring-2 ring-transparent hover:ring-indigo-200`}
            >
              {getInitials(user?.username)}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                {/* 유저 정보 */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABEL[user?.role] ?? user?.role}</p>
                </div>

                {/* BUYER */}
                {user?.role === 'BUYER' && (
                  <>
                    <Link to="/my/orders" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span className="text-base">🧾</span> 구매 내역
                    </Link>
                    <Link to="/seller/apply" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span className="text-base">🏪</span> 판매자 신청
                    </Link>
                  </>
                )}

                {/* SELLER */}
                {user?.role === 'SELLER' && (
                  <>
                    <Link to="/my/orders" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span className="text-base">🧾</span> 구매 내역
                    </Link>
                    <Link to="/seller/dashboard" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span className="text-base">📊</span> 판매자 대시보드
                    </Link>
                    <Link to="/seller/goods/new" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors sm:hidden">
                      <span className="text-base">➕</span> 굿즈 등록
                    </Link>
                  </>
                )}

                {/* ADMIN */}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link to="/admin/dashboard" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span className="text-base">🛠</span> 관리자 대시보드
                    </Link>
                    <Link to="/admin/goods/pending" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors sm:hidden">
                      <span className="text-base">⏳</span> 굿즈 심사 대기
                    </Link>
                    <Link to="/admin/seller-applications" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span className="text-base">📋</span> 판매자 신청 관리
                    </Link>
                  </>
                )}

                <Link to="/profile/edit" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="text-base">✏️</span> 프로필 편집
                </Link>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="text-base">🚪</span> 로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              로그인
            </Link>
            <Link
              to="/register"
              className="text-sm bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
