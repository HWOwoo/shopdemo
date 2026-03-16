import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../store/authStore';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Toast, { useToast } from '../components/ui/Toast';
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

function SellerProfileCard({ username }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axiosClient.get(`/users/${username}/profile`)
      .then((res) => setProfile(res.data.data))
      .catch(() => {});
  }, [username]);

  return (
    <div className="mt-8 flex flex-col items-center text-center py-8 px-6 bg-gray-50 rounded-2xl border border-gray-100">
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarGradient(username)} flex items-center justify-center text-white text-xl font-bold shadow-sm mb-3`}>
        {getInitials(username)}
      </div>
      <p className="text-base font-semibold text-gray-800">{username}</p>
      {profile?.bio ? (
        <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-sm whitespace-pre-wrap">{profile.bio}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-300">아직 자기소개가 없습니다.</p>
      )}
    </div>
  );
}

export default function GoodsDetailPage() {
  const { id } = useParams();
  const [goods, setGoods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseSection, setShowPurchaseSection] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast, show, hide } = useToast();

  useEffect(() => {
    axiosClient.get(`/goods/${id}`)
      .then((res) => {
        const g = res.data.data;
        setGoods(g);
        if (g.options && g.options.length > 0) {
          setSelectedOption(g.options[0]);
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePurchase = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedOption) { show('옵션을 선택해주세요.', 'error'); return; }
    setShowPurchaseSection((prev) => !prev);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!goods) return null;

  const options = goods.options || [];
  const totalPrice = Number(selectedOption?.price || goods.price) + Number(goods.deliveryFee || 0);
  const isBuyer = user?.role === 'BUYER';
  const canPurchase = isAuthenticated && isBuyer;
  const optionSoldOut = selectedOption
    ? (selectedOption.stock !== null && selectedOption.stock !== undefined && selectedOption.stock === 0)
    : goods.soldOut;

  return (
    <div className="max-w-2xl mx-auto">
      <Toast toast={toast} onClose={hide} />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors mb-6"
      >
        ← 뒤로가기
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 선택 물품 이미지 */}
        {selectedOption?.imageUrl ? (
          <img
            src={selectedOption.imageUrl}
            alt={selectedOption.name}
            className="w-full h-72 object-cover transition-opacity duration-200"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-5xl">🛍</span>
          </div>
        )}

        <div className="p-7">
          <h1 className="text-2xl font-bold text-gray-800 leading-snug">{goods.name}</h1>
          {goods.description && (
            <div
              className="rich-content text-gray-600 mt-3"
              dangerouslySetInnerHTML={{ __html: goods.description }}
            />
          )}

          {/* 옵션 선택 */}
          {options.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">옵션 선택</p>
              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const isSoldOut = opt.stock !== null && opt.stock !== undefined && opt.stock === 0;
                  const isSelected = selectedOption?.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => !isSoldOut && setSelectedOption(opt)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : isSoldOut
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* 물품 썸네일 */}
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
                        <div>
                          <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {opt.name}
                          </span>
                          {opt.shortDescription && (
                            <p className="text-xs text-gray-400 mt-0.5">{opt.shortDescription}</p>
                          )}
                        </div>
                        {isSoldOut && (
                          <span className="text-xs text-red-400 font-medium">품절</span>
                        )}
                        {!isSoldOut && opt.stock !== null && opt.stock !== undefined && (
                          <span className="text-xs text-gray-400">재고 {opt.stock}개</span>
                        )}
                        {opt.stock === null || opt.stock === undefined ? (
                          <span className="text-xs text-green-600">수량 제한 없음</span>
                        ) : null}
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {Number(opt.price).toLocaleString()}원
                      </span>
                    </button>
                  );
                })}
              </div>
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
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">총 결제금액</p>
              <span className="text-2xl font-bold text-indigo-600">
                {selectedOption ? totalPrice.toLocaleString() : '-'}원
              </span>
              {selectedOption && Number(goods.deliveryFee) > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  상품 {Number(selectedOption.price).toLocaleString()} + 배송 {Number(goods.deliveryFee).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              {canPurchase && !optionSoldOut && (
                <Button onClick={handlePurchase} disabled={!selectedOption}>
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
            </div>
          </div>

          {/* 구매 방법 선택 섹션 */}
          {showPurchaseSection && isAuthenticated && selectedOption && (
            <PurchaseSection
              goods={goods}
              selectedOption={selectedOption}
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
    </div>
  );
}
