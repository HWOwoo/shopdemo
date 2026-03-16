import { useState } from 'react';
import DirectPurchaseForm from './DirectPurchaseForm';
import PlatformPurchaseForm from './PlatformPurchaseForm';
import PurchaseCompleteView from './PurchaseCompleteView';

const TABS = [
  {
    key: 'platform',
    label: '중개구매',
    sub: '안심거래',
    icon: '🛡',
    desc: '플랫폼이 보호하는 안전한 결제',
  },
  {
    key: 'direct',
    label: '직접 구매',
    sub: '계좌이체',
    icon: '🏦',
    desc: '판매자 계좌로 직접 입금',
  },
];

function generateOrderNumber() {
  const a = Math.floor(100000 + Math.random() * 900000);
  const b = Math.floor(10000000000 + Math.random() * 89999999999);
  return `${a}-${b}`;
}

export default function PurchaseSection({ goods, selectedOption, onClose, onSuccess }) {
  const [tab, setTab] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  const totalPrice =
    Number(selectedOption?.price || goods.price) + Number(goods.deliveryFee || 0);

  const handleComplete = (msg, type = 'success') => {
    if (type === 'error') {
      onSuccess?.(msg, 'error');
      return;
    }
    setCompletedOrder({ orderNumber: generateOrderNumber(), totalPrice });
  };

  return (
    <>
      {/* 완료 모달 */}
      {completedOrder && (
        <PurchaseCompleteView
          goods={goods}
          totalPrice={completedOrder.totalPrice}
          orderNumber={completedOrder.orderNumber}
          onClose={() => {
            setCompletedOrder(null);
            onClose?.();
          }}
        />
      )}

      <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">구매 방법 선택</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 구매 방법 선택 카드 */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {TABS.map(({ key, label, sub, icon, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all ${
                tab === key
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className={`text-sm font-bold leading-tight ${tab === key ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {label}
                  </p>
                  <p className={`text-xs font-medium ${tab === key ? 'text-indigo-500' : 'text-gray-400'}`}>
                    {sub}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-snug">{desc}</p>
            </button>
          ))}
        </div>

        {/* 선택된 탭에 따른 폼 */}
        {tab === 'platform' && (
          <div className="border-t border-gray-100">
            <PlatformPurchaseForm
              goods={goods}
              selectedOption={selectedOption}
              onSuccess={handleComplete}
            />
          </div>
        )}

        {tab === 'direct' && (
          <div className="border-t border-gray-100">
            <DirectPurchaseForm
              goods={goods}
              selectedOption={selectedOption}
              onClose={onClose}
              onSuccess={handleComplete}
              embedded
            />
          </div>
        )}
      </div>
    </>
  );
}
