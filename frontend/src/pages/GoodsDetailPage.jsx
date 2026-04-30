import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../store/authStore';
import { toggleWishlist, checkWishlistStatus } from '../api/wishlist';
import { getOrCreateRoom } from '../api/chat';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Toast, { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/ConfirmModal';
import PurchaseSection from '../components/purchase/PurchaseSection';

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

function StarsReadOnly({ rating, size = 'sm' }) {
  const cls = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((v) => (
        <span key={v} className={`${cls} ${v <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </span>
  );
}

function ReviewsSection({ goodsId }) {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosClient.get(`/reviews/goods/${goodsId}/stats`).then((r) => r.data.data),
      axiosClient.get(`/reviews/goods/${goodsId}`).then((r) => r.data.data || []),
    ])
      .then(([s, list]) => { setStats(s); setReviews(list); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [goodsId]);

  if (loading) return null;
  if (!stats || stats.count === 0) {
    return (
      <section className="mt-10">
        <h2 className="text-base font-bold text-gray-800 mb-4">리뷰</h2>
        <p className="text-sm text-gray-400 py-12 text-center bg-gray-50 rounded-2xl border border-gray-100">
          아직 작성된 리뷰가 없습니다.
        </p>
      </section>
    );
  }

  const maxCount = Math.max(...Object.values(stats.distribution || {}));

  return (
    <section className="mt-10">
      <h2 className="text-base font-bold text-gray-800 mb-4">리뷰 ({stats.count})</h2>

      {/* 통계 헤더 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
        <div className="flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-gray-800">{stats.average?.toFixed(1)}</p>
          <StarsReadOnly rating={stats.average || 0} size="lg" />
          <p className="text-xs text-gray-400 mt-1">{stats.count}개의 리뷰</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((r) => {
            const c = stats.distribution?.[r] || 0;
            const pct = maxCount > 0 ? (c / maxCount) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-4">{r}점</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-gray-500 w-8 text-right">{c}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 리뷰 리스트 */}
      <div className="space-y-3">
        {reviews.map((rev) => (
          <div key={rev.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(rev.reviewerUsername)} flex items-center justify-center text-white text-[10px] font-bold`}>
                {getInitials(rev.reviewerUsername)}
              </div>
              <span className="text-sm font-semibold text-gray-700">{rev.reviewerUsername}</span>
              <StarsReadOnly rating={rev.rating} />
              <span className="ml-auto text-xs text-gray-400">{new Date(rev.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{rev.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SellerProfileCard({ username }) {
  const [profile, setProfile] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get(`/users/${username}/profile`)
      .then((res) => setProfile(res.data.data))
      .catch(() => {});
  }, [username]);

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

  const isSelf = currentUser?.username === username;

  return (
    <div className="mt-8 flex flex-col items-center text-center py-8 px-6 bg-gray-50 rounded-2xl border border-gray-100">
      <Link to={`/seller/${username}`} className="group">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarGradient(username)} flex items-center justify-center text-white text-xl font-bold shadow-sm mb-3 group-hover:ring-2 group-hover:ring-indigo-300 transition-all`}>
          {getInitials(username)}
        </div>
      </Link>
      <Link to={`/seller/${username}`} className="text-base font-semibold text-gray-800 hover:text-indigo-600 transition-colors">
        {username}
      </Link>
      {profile?.bio ? (
        <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-sm whitespace-pre-wrap">{profile.bio}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-300">아직 자기소개가 없습니다.</p>
      )}
      <div className="mt-4 flex gap-2">
        {!isSelf && (
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
        )}
        <Link
          to={`/seller/${username}`}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          판매자 페이지
        </Link>
      </div>
    </div>
  );
}

function GoodsImageGallery({ mainImage, additionalImages }) {
  const allImages = [mainImage, ...additionalImages].filter(Boolean);
  const [activeIdx, setActiveIdx] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
        <span className="text-5xl">🛍</span>
      </div>
    );
  }

  return (
    <div>
      {/* 메인 이미지 */}
      <img
        src={allImages[activeIdx]}
        alt={`이미지 ${activeIdx + 1}`}
        className="w-full h-56 sm:h-72 object-cover transition-opacity duration-200"
      />
      {/* 썸네일 바 (추가 이미지 있을 때만) */}
      {allImages.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                activeIdx === idx ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              <img src={img} alt={`썸네일 ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  PENDING_PAYMENT:   { text: '입금 대기 중', cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  PAYMENT_CONFIRMED: { text: '입금 확인 완료', cls: 'text-green-700 bg-green-50 border-green-200' },
  SHIPPED:           { text: '배송 중', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  DELIVERED:         { text: '배송 완료', cls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  CANCEL_REQUESTED:  { text: '취소 요청 중', cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  CANCELLED:         { text: '취소됨', cls: 'text-gray-500 bg-gray-50 border-gray-200' },
};

export default function GoodsDetailPage() {
  const { id } = useParams();
  const [goods, setGoods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseSection, setShowPurchaseSection] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [preorderRegistered, setPreorderRegistered] = useState(false);
  const [preorderSubmitting, setPreorderSubmitting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  useEffect(() => {
    axiosClient.get(`/goods/${id}`)
      .then((res) => {
        setGoods(res.data.data);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // 자신이 구매한 이력 조회 (BUYER, SELLER 모두 - 단 자기 자신의 상품 제외)
    if (user?.role !== 'ADMIN') {
      axiosClient.get(`/seller/orders/my/goods/${id}`)
        .then((res) => setMyOrders(res.data.data || []))
        .catch(() => {});
    }
    // 수요조사 신청 여부 확인
    axiosClient.get(`/goods/${id}/preorder/check`)
      .then((res) => setPreorderRegistered(res.data.data?.registered ?? false))
      .catch(() => {});
    // 찜 여부 확인
    checkWishlistStatus(id)
      .then((res) => setWishlisted(res.wishlisted ?? false))
      .catch(() => {});
  }, [id, isAuthenticated]);

  const setQty = (optionId, val, maxStock) => {
    const maxQty = maxStock != null ? maxStock : 999;
    const newQty = Math.max(0, Math.min(Math.floor(val) || 0, maxQty));
    setQuantities((prev) => ({ ...prev, [optionId]: newQty }));
  };

  const hasAnyQty = Object.values(quantities).some((q) => q > 0);

  const handlePurchase = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!hasAnyQty) { show('수량을 1개 이상 선택해주세요.', 'error'); return; }
    setShowPurchaseSection((prev) => !prev);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!goods) return null;

  const options = goods.options || [];

  const itemsTotal = options.reduce((sum, opt) => {
    return sum + Number(opt.price) * (quantities[opt.id] || 0);
  }, 0);
  const totalPrice = itemsTotal + Number(goods.deliveryFee || 0);

  const isPreorder = goods.goodsType === 'PREORDER';
  const isOwnGoods = isAuthenticated && user?.username === goods.sellerUsername;
  const canPurchase = isAuthenticated && !isOwnGoods && user?.role !== 'ADMIN';

  // 수요조사 마감 여부
  const preorderExpired = isPreorder && goods.preorderDeadline && new Date(goods.preorderDeadline) < new Date();

  // 수요조사 신청
  const handlePreorderRegister = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!hasAnyQty) { show('수량을 1개 이상 선택해주세요.', 'error'); return; }
    setPreorderSubmitting(true);
    try {
      const items = options
        .filter((opt) => (quantities[opt.id] || 0) > 0)
        .map((opt) => ({ optionId: opt.id, quantity: quantities[opt.id] }));
      await axiosClient.post(`/goods/${id}/preorder`, { items });
      show('수요조사 신청이 완료되었습니다!', 'success');
      setPreorderRegistered(true);
    } catch (err) {
      show(err.response?.data?.message || '신청에 실패했습니다.', 'error');
    } finally {
      setPreorderSubmitting(false);
    }
  };

  const handlePreorderCancel = async () => {
    if (!await confirm('수요조사 신청을 취소하시겠습니까?')) return;
    try {
      await axiosClient.delete(`/goods/${id}/preorder`);
      show('신청이 취소되었습니다.', 'success');
      setPreorderRegistered(false);
    } catch (err) {
      show(err.response?.data?.message || '취소에 실패했습니다.', 'error');
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      const res = await toggleWishlist(id);
      setWishlisted(res.wishlisted);
      show(res.wishlisted ? '찜 목록에 추가되었습니다.' : '찜 목록에서 삭제되었습니다.', 'success');
    } catch {
      show('처리에 실패했습니다.', 'error');
    }
  };

  const allSoldOut = options.length > 0 && options.every(
    (opt) => opt.stock !== null && opt.stock !== undefined && opt.stock === 0,
  );
  const optionSoldOut = allSoldOut || goods.soldOut;

  const previewOption = options.find((opt) => (quantities[opt.id] || 0) > 0) || options[0];

  return (
    <div className="max-w-2xl mx-auto">
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors mb-4 sm:mb-6"
      >
        ← 뒤로가기
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 메인 이미지 + 갤러리 */}
        <GoodsImageGallery
          mainImage={previewOption?.imageUrl}
          additionalImages={goods.additionalImages || []}
        />

        <div className="p-4 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-snug">{goods.name}</h1>
            {isAuthenticated && (
              <button
                onClick={handleWishlistToggle}
                className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
                  wishlisted
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'
                }`}
                title={wishlisted ? '찜 취소' : '찜하기'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24"
                  fill={wishlisted ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* 태그/카테고리 */}
          {(goods.category || goods.tags) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {goods.category && (
                <button
                  onClick={() => navigate(`/?q=${encodeURIComponent(goods.category)}`)}
                  className="px-2.5 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full hover:bg-indigo-200 transition-colors"
                >
                  {goods.category}
                </button>
              )}
              {goods.tags && goods.tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/?q=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* 수요조사 정보 배너 */}
          {isPreorder && (
            <div className="mt-3 rounded-xl border px-4 py-3 bg-indigo-50 border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📋</span>
                <span className="text-sm font-semibold text-indigo-800">사전수요조사</span>
                {preorderExpired ? (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">마감</span>
                ) : (
                  <span className="px-2 py-0.5 bg-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">진행 중</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-indigo-600">
                {goods.preorderDeadline && (
                  <span>마감: {new Date(goods.preorderDeadline).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                )}
                {goods.preorderCount != null && (
                  <span className="font-semibold">{goods.preorderCount}명 신청</span>
                )}
              </div>
              {preorderRegistered && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full">신청 완료</span>
                  {!preorderExpired && (
                    <button onClick={handlePreorderCancel} className="text-xs text-gray-400 hover:text-red-500">신청 취소</button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 구매 이력 알림 */}
          {myOrders.length > 0 && (
            <div className="mt-3 rounded-xl border px-4 py-3 flex items-start gap-3 bg-indigo-50 border-indigo-200">
              <span className="text-xl leading-none mt-0.5">📦</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-800">
                  이전에 구매한 상품입니다 ({myOrders.length}건)
                </p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {myOrders.map((o) => {
                    const s = STATUS_LABEL[o.status] ?? { text: o.status, cls: 'text-gray-500 bg-gray-50 border-gray-200' };
                    return (
                      <div key={o.id} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-indigo-400">{o.orderNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded-full border text-xs font-medium ${s.cls}`}>
                          {s.text}
                        </span>
                        {o.trackingNumber && (
                          <span className="text-indigo-500">
                            · {o.courierName} {o.trackingNumber}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Link
                to="/my/orders"
                className="shrink-0 text-xs text-indigo-600 hover:underline font-medium"
              >
                내역 보기 →
              </Link>
            </div>
          )}

          {goods.description && (
            <div
              className="rich-content text-gray-600 mt-3"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(goods.description) }}
            />
          )}

          {/* 수량 선택 */}
          {options.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">수량 선택</p>
              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const isSoldOut = opt.stock !== null && opt.stock !== undefined && opt.stock === 0;
                  const qty = quantities[opt.id] || 0;
                  return (
                    <div
                      key={opt.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-3 rounded-xl border-2 transition-colors gap-2 sm:gap-0 ${
                        qty > 0
                          ? 'border-indigo-500 bg-indigo-50'
                          : isSoldOut
                          ? 'border-gray-100 bg-gray-50 opacity-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {opt.imageUrl ? (
                          <img
                            src={opt.imageUrl}
                            alt={opt.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300 text-lg">
                            🛍
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className={`text-sm font-medium ${qty > 0 ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {opt.name}
                          </span>
                          {opt.shortDescription && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{opt.shortDescription}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isSoldOut ? (
                              <span className="text-xs text-red-400 font-medium">품절</span>
                            ) : opt.stock !== null && opt.stock !== undefined ? (
                              <span className="text-xs text-gray-400">재고 {opt.stock}개</span>
                            ) : (
                              <span className="text-xs text-green-600">수량 제한 없음</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className={`text-sm font-bold ${qty > 0 ? 'text-indigo-600' : 'text-gray-600'}`}>
                          {Number(opt.price).toLocaleString()}원
                        </span>
                        {!isSoldOut ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setQty(opt.id, qty - 1, opt.stock)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={opt.stock ?? undefined}
                              value={qty}
                              onChange={(e) => setQty(opt.id, parseInt(e.target.value), opt.stock)}
                              className="w-10 text-center text-sm border border-gray-300 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                            <button
                              type="button"
                              onClick={() => setQty(opt.id, qty + 1, opt.stock)}
                              disabled={opt.stock !== null && opt.stock !== undefined && qty >= opt.stock}
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 w-[74px] text-center">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasAnyQty && (
                <div className="mt-2 text-right text-xs text-gray-500">
                  선택 {Object.values(quantities).reduce((a, b) => a + b, 0)}개 · 상품금액 {itemsTotal.toLocaleString()}원
                </div>
              )}
            </div>
          )}

          {/* 배송비 */}
          {Number(goods.deliveryFee) > 0 && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">배송비</span>
              <span className="text-sm font-semibold text-gray-700">
                {Number(goods.deliveryFee).toLocaleString()}원
              </span>
            </div>
          )}
          {Number(goods.deliveryFee) === 0 && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-green-50 rounded-xl">
              <span className="text-sm text-gray-500">배송비</span>
              <span className="text-sm font-semibold text-green-600">무료</span>
            </div>
          )}

          {/* 총 결제금액 + 구매 버튼 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100 gap-3 sm:gap-0">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">총 결제금액</p>
              <span className="text-2xl font-bold text-indigo-600">
                {hasAnyQty ? totalPrice.toLocaleString() : '-'}원
              </span>
              {hasAnyQty && Number(goods.deliveryFee) > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  상품 {itemsTotal.toLocaleString()} + 배송 {Number(goods.deliveryFee).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              {isPreorder ? (
                <>
                  {preorderExpired ? (
                    <span className="text-sm text-gray-400 font-medium">수요조사 마감</span>
                  ) : preorderRegistered ? (
                    <span className="text-sm text-green-600 font-semibold">신청 완료</span>
                  ) : isAuthenticated && !isOwnGoods ? (
                    <Button onClick={handlePreorderRegister} disabled={!hasAnyQty || preorderSubmitting}>
                      {preorderSubmitting ? '신청 중...' : '수요조사 신청'}
                    </Button>
                  ) : !isAuthenticated ? (
                    <Button onClick={() => navigate('/login')}>로그인 후 신청</Button>
                  ) : null}
                </>
              ) : (
                <>
                  {canPurchase && !optionSoldOut && (
                    <Button onClick={handlePurchase} disabled={!hasAnyQty}>
                      구매 신청하기
                    </Button>
                  )}
                  {canPurchase && optionSoldOut && (
                    <span className="text-sm text-gray-400">품절</span>
                  )}
                  {!isAuthenticated && (
                    <Button onClick={() => navigate('/login')}>
                      로그인 후 구매
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 구매 방법 선택 섹션 */}
          {showPurchaseSection && isAuthenticated && hasAnyQty && (
            <PurchaseSection
              goods={goods}
              quantities={quantities}
              options={options}
              onClose={() => setShowPurchaseSection(false)}
              onSuccess={(msg, type = 'success') => {
                setShowPurchaseSection(false);
                show(msg, type);
              }}
            />
          )}
        </div>
      </div>

      {/* 판매자 프로필 */}
      <SellerProfileCard username={goods.sellerUsername} />

      {/* 리뷰 */}
      <ReviewsSection goodsId={goods.id} />
    </div>
  );
}
