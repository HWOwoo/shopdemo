import { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const PAYMENT_METHODS = [
  { key: 'card', label: '신용/체크카드', icon: '💳' },
  { key: 'kakaopay', label: '카카오페이', icon: '💛', color: 'bg-[#FEE500] text-[#3C1E1E]' },
  { key: 'naverpay', label: '네이버페이', icon: '🟢', color: 'bg-[#03C75A] text-white' },
  { key: 'tosspay', label: '토스페이', icon: '🔵', color: 'bg-[#0064FF] text-white' },
];

export default function PlatformPurchaseForm({ goods, quantities, options, totalPrice, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedItems = (options || []).filter((opt) => (quantities[opt.id] || 0) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMethod) return;
    setSubmitting(true);
    try {
      const res = await axiosClient.post(`/goods/${goods.id}/purchase`, {
        items: selectedItems.map((opt) => ({
          optionId: opt.id,
          quantity: quantities[opt.id],
        })),
        purchaseType: 'PLATFORM',
        paymentMethod: selectedMethod,
        totalPrice,
      });
      onSuccess?.(res.data.data);
    } catch (err) {
      onSuccess?.(err.response?.data?.message || '구매 신청에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
      {/* 안심거래 안내 */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <span className="text-xl mt-0.5">🛡</span>
        <div>
          <p className="text-sm font-semibold text-indigo-800">안심거래 보호</p>
          <p className="text-xs text-indigo-600 mt-0.5 leading-relaxed">
            플랫폼이 결제 금액을 보관하며, 배송 확인 후 판매자에게 정산됩니다.
            분쟁 발생 시 환불 보호를 받을 수 있습니다.
          </p>
        </div>
      </div>

      {/* 주문 금액 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
        {selectedItems.map((opt) => (
          <div key={opt.id} className="flex justify-between px-4 py-2.5 border-b border-gray-100 last:border-b-0">
            <span className="text-gray-600">{opt.name} × {quantities[opt.id]}</span>
            <span className="font-medium text-gray-800">
              {(Number(opt.price) * quantities[opt.id]).toLocaleString()}원
            </span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-2.5 border-t border-gray-100">
          <span className="text-gray-600">배송비</span>
          <span className="font-medium text-gray-800">
            {Number(goods.deliveryFee || 0) === 0
              ? '무료'
              : `${Number(goods.deliveryFee).toLocaleString()}원`}
          </span>
        </div>
        <div className="flex justify-between px-4 py-2.5 bg-indigo-50 border-t border-indigo-100">
          <span className="font-semibold text-indigo-700">총 결제금액</span>
          <span className="font-bold text-indigo-700">{totalPrice.toLocaleString()}원</span>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">결제 수단 선택</p>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedMethod(key)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                selectedMethod === key
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 준비 중 안내 */}
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-center gap-2">
        <span>⚠️</span>
        실제 결제 연동은 준비 중입니다. 현재는 구매 신청만 가능합니다.
      </div>

      <button
        type="submit"
        disabled={!selectedMethod || submitting}
        className="w-full py-3.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? '처리 중...' : `${totalPrice.toLocaleString()}원 결제하기`}
      </button>
    </form>
  );
}
