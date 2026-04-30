import { Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';

const MENU_ITEMS = [
  {
    to: '/my/orders',
    icon: '🧾',
    label: '구매 내역',
    desc: '주문 현황 및 배송 조회',
  },
  {
    to: '/my/wishlist',
    icon: '🤍',
    label: '찜 목록',
    desc: '관심 굿즈 모아보기',
  },
  {
    to: '/my/preorders',
    icon: '📋',
    label: '수요조사 신청',
    desc: '내가 신청한 수요조사 목록',
  },
  {
    to: '/my/reviews',
    icon: '⭐',
    label: '내 리뷰',
    desc: '작성한 리뷰 및 리뷰 작성',
  },
];

export default function MyPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">마이페이지</h1>
      <p className="text-sm text-gray-400 mb-6">{user?.username}</p>

      <div className="grid grid-cols-2 gap-3">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col gap-2 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-1">
        <Link
          to="/profile/edit"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>✏️</span> 프로필 편집
        </Link>
        {user?.role === 'BUYER' && (
          <Link
            to="/seller/apply"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span>🏪</span> 판매자 신청
          </Link>
        )}
      </div>
    </div>
  );
}
