import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function AdminReviewPage() {
  const { id } = useParams();
  const [goods, setGoods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get(`/admin/goods/${id}`)
      .then((res) => {
        const g = res.data.data;
        setGoods(g);
        if (g.options?.length > 0) setSelectedOption(g.options[0]);
      })
      .catch(() => navigate('/admin/goods/pending'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleReview = async (approved) => {
    if (!approved && !rejectionReason.trim()) {
      setError('거절 사유를 입력해주세요.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await axiosClient.post(`/admin/goods/${id}/review`, {
        approved,
        rejectionReason: approved ? undefined : rejectionReason,
      });
      navigate('/admin/goods/pending');
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!goods) return null;

  const options = goods.options || [];

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors mb-6">
        ← 뒤로가기
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">굿즈 심사</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {/* 선택 물품 이미지 */}
        {selectedOption?.imageUrl ? (
          <img src={selectedOption.imageUrl} alt={selectedOption.name} className="w-full h-48 object-cover rounded-lg mb-4" />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl rounded-lg mb-4">
            🛍
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h2 className="text-xl font-bold text-gray-800">{goods.name}</h2>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${goods.goodsType === 'PREORDER' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
            {goods.goodsType === 'PREORDER' ? '수요조사' : '통판'}
          </span>
        </div>
        <p className="text-gray-500 text-sm">판매자: {goods.sellerUsername}</p>

        {/* 판매 물품 목록 */}
        {options.length > 0 && (
          <div className="mt-4">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 text-left transition-colors ${
                      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {opt.imageUrl ? (
                      <img src={opt.imageUrl} alt={opt.name} className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0 text-lg">🛍</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.name}</p>
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

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">최저가</div>
            <div className="font-bold text-indigo-600 mt-1">{Number(goods.price).toLocaleString()}원~</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">저작권 허가</div>
            <div className="font-medium mt-1">{goods.requiresCopyrightPermission ? '필요' : '불필요'}</div>
          </div>
          {goods.rightsHolderEmail && (
            <div className="bg-yellow-50 rounded-lg p-3 col-span-2">
              <div className="text-yellow-600 text-xs">원작자 이메일</div>
              <div className="font-medium mt-1">{goods.rightsHolderEmail}</div>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">결제 수단</div>
            <div className="font-medium mt-1">
              {goods.paymentType === 'BANK_TRANSFER'
                ? `계좌이체 (${goods.bankName})`
                : '플랫폼 결제'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">등록일</div>
            <div className="font-medium mt-1">{new Date(goods.createdAt).toLocaleDateString('ko-KR')}</div>
          </div>
        </div>

        {goods.description && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 mb-2">상품 설명</p>
            <div
              className="rich-content text-gray-600 text-sm border border-gray-100 rounded-lg p-3"
              dangerouslySetInnerHTML={{ __html: goods.description }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-700 mb-4">심사 결과</h3>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            거절 사유 (거절 시 필수)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="저작권 허가가 확인되지 않았습니다..."
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="success"
            disabled={submitting}
            onClick={() => handleReview(true)}
            className="flex-1"
          >
            {submitting ? '처리 중...' : '승인'}
          </Button>
          <Button
            variant="danger"
            disabled={submitting}
            onClick={() => handleReview(false)}
            className="flex-1"
          >
            {submitting ? '처리 중...' : '거절'}
          </Button>
        </div>
      </div>
    </div>
  );
}
