import { useState } from 'react';

function maskName(name) {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

export default function PurchaseCompleteView({ goods, totalPrice, orderNumber, onClose }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(goods.bankAccount).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onClose?.(), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-7">
          {/* 헤더 */}
          <p className="text-sm font-semibold text-gray-500 mb-3">입금폼 제출 완료 🎉</p>

          {/* 메인 경고 문구 */}
          <h2 className="text-xl font-extrabold text-gray-900 leading-snug mb-5">
            바로 입금을 진행해주세요<br />
            <span className="text-gray-800">주문이 취소될 수 있습니다.</span>
          </h2>

          {/* 주문 요약 */}
          <div className="flex flex-col gap-1 mb-5 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 w-16 shrink-0">주문번호</span>
              <span className="font-medium text-gray-700 font-mono">{orderNumber}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 w-16 shrink-0">입금금액</span>
              <span className="font-bold text-red-500">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>

          {/* 입금처 정보 */}
          <div className="border border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              🏦 입금처 정보
            </p>
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">은행</span>
                <span className="font-medium text-gray-800">{goods.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">예금주</span>
                <span className="font-medium text-gray-800">{maskName(goods.bankAccountHolder)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">입금 계좌</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 font-mono text-xs">{goods.bankAccount}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      copied
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {copied ? '복사됨' : '계좌복사'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              나중에 하기
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmed}
              className="flex-[2] py-3 bg-amber-400 text-white text-sm font-bold rounded-xl hover:bg-amber-500 disabled:opacity-70 transition-colors"
            >
              {confirmed ? '확인 완료 ✓' : '입금했어요'}
            </button>
          </div>

          {/* 안내 문구 */}
          <ul className="text-xs text-gray-400 space-y-1">
            <li>· 시간 내 입금하지 않으면 주문이 취소될 수 있습니다.</li>
            <li>· 취소를 원하신 경우 폼 양식 내에서 입금 정보를 확인하실 수 있습니다.</li>
            <li>· 비회원인 경우 주문번호를 꼭 기억해주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
