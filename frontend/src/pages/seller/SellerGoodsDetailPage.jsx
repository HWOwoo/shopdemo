import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/goods/StatusBadge';
import Button from '../../components/ui/Button';

export default function SellerGoodsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goods, setGoods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    axiosClient.get(`/goods/my/${id}`)
      .then((res) => {
        const g = res.data.data;
        setGoods(g);
        if (g.options?.length > 0) setSelectedOption(g.options[0]);
      })
      .catch(() => navigate('/seller/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!goods) return null;

  const options = goods.options || [];
  const totalPrice = Number(selectedOption?.price || goods.price) + Number(goods.deliveryFee || 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          ← 대시보드로
        </button>
        {goods.status !== 'APPROVED' && (
          <Link to={`/seller/goods/${goods.id}/edit`}>
            <Button>수정하기</Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 선택 물품 이미지 */}
        {selectedOption?.imageUrl ? (
          <img src={selectedOption.imageUrl} alt={selectedOption.name} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
            🛍
          </div>
        )}

        <div className="p-6 flex flex-col gap-5">
          {/* 제목 + 상태 */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-800 leading-snug">{goods.name}</h1>
            <StatusBadge status={goods.status} />
          </div>

          {/* 거절 사유 */}
          {goods.status === 'REJECTED' && goods.rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              <span className="font-medium">거절 사유: </span>{goods.rejectionReason}
            </div>
          )}

          {/* 판매 물품 목록 */}
          {options.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">판매 물품 ({options.length}개)</p>
              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const isSelected = selectedOption?.id === opt.id;
                  const isSoldOut = opt.stock !== null && opt.stock !== undefined && opt.stock === 0;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.imageUrl ? (
                        <img src={opt.imageUrl} alt={opt.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">🛍</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {opt.name}
                        </p>
                        {opt.shortDescription && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{opt.shortDescription}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {opt.stock === null || opt.stock === undefined
                            ? '재고 제한 없음'
                            : isSoldOut ? '품절' : `재고 ${opt.stock}개`}
                        </p>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {Number(opt.price).toLocaleString()}원
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 가격 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">선택 가격</p>
              <p className="font-bold text-indigo-600">
                {selectedOption ? Number(selectedOption.price).toLocaleString() : '-'}원
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">배송비</p>
              <p className={`font-semibold ${Number(goods.deliveryFee) === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                {Number(goods.deliveryFee) === 0 ? '무료' : `${Number(goods.deliveryFee).toLocaleString()}원`}
              </p>
            </div>
          </div>

          {/* 결제 수단 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">결제 수단</span>
            <span className="font-medium text-gray-700">
              {goods.paymentType === 'BANK_TRANSFER' ? `계좌이체 (${goods.bankName} ${goods.bankAccount})` : '플랫폼 결제'}
            </span>
          </div>

          {/* 상품 설명 */}
          {goods.description && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">상품 설명</p>
              <div className="rich-content text-gray-600 text-sm border border-gray-100 rounded-xl p-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(goods.description) }} />
            </div>
          )}

          {/* 등록일 */}
          <p className="text-xs text-gray-400 text-right">
            등록일 {new Date(goods.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
}
