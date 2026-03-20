import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Toast, { useToast } from '../components/ui/Toast';

const STATUS = {
  PENDING_PAYMENT:  { label: '입금 대기',  cls: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  PAYMENT_CONFIRMED:{ label: '입금 확인',  cls: 'bg-green-100 text-green-700',   icon: '✅' },
  CANCELLED:        { label: '취소됨',     cls: 'bg-gray-100 text-gray-500',     icon: '❌' },
};

const PURCHASE_TYPE = {
  DIRECT:  { label: '직접구매 (계좌이체)', icon: '🏦' },
  PLATFORM:{ label: '안심거래',            icon: '🛡' },
};

function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500', icon: '' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 text-gray-400">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const pt = PURCHASE_TYPE[order.purchaseType] ?? { label: order.purchaseType, icon: '' };
  const address = [order.postalCode, order.address, order.addressDetail].filter(Boolean).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={order.status} />
            <span className="text-xs text-gray-400">{pt.icon} {pt.label}</span>
          </div>
          <p className="font-bold text-gray-800 text-base truncate">{order.goodsName}</p>
          {order.items && order.items.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {order.items.map((i) => `${i.optionName} × ${i.quantity}`).join(', ')}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-indigo-600">
            {Number(order.totalPrice).toLocaleString()}원
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* 주문번호 + 요약 */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono">주문번호: {order.orderNumber}</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-indigo-500 hover:underline"
        >
          {expanded ? '접기 ▲' : '상세보기 ▼'}
        </button>
      </div>

      {/* 입금 대기 안내 */}
      {order.status === 'PENDING_PAYMENT' && order.purchaseType === 'DIRECT' && (
        <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
          <span className="text-base leading-none">⚠️</span>
          <div>
            <p className="font-semibold">입금을 진행해 주세요</p>
            <p className="mt-0.5 text-amber-600">빠른 시일 내에 입금하지 않으면 주문이 취소될 수 있습니다.</p>
          </div>
        </div>
      )}

      {/* 상세 정보 */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-5">

          {/* 주문 정보 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">주문 정보</p>
            <div className="space-y-1.5">
              <InfoRow label="주문번호" value={order.orderNumber} />
              <InfoRow label="주문일시" value={new Date(order.createdAt).toLocaleString('ko-KR')} />
              <InfoRow label="상품명" value={order.goodsName} />
              {order.items && order.items.length > 0 && (
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-400 w-20 shrink-0">주문 항목</span>
                  <div className="flex flex-col gap-0.5">
                    {order.items.map((i) => (
                      <span key={i.optionId} className="text-gray-700">
                        {i.optionName} × {i.quantity} ({Number(i.subtotal).toLocaleString()}원)
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <InfoRow label="결제금액" value={`${Number(order.totalPrice).toLocaleString()}원`} />
              {order.paymentMethod && (
                <InfoRow label="결제수단" value={order.paymentMethod} />
              )}
            </div>
          </section>

          {/* 입금 정보 (직접구매) */}
          {order.purchaseType === 'DIRECT' && (order.depositorName || order.depositorDate) && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">입금 정보</p>
              <div className="space-y-1.5">
                <InfoRow label="입금자명" value={order.depositorName} />
                <InfoRow label="입금 예정일" value={order.depositorDate} />
              </div>
            </section>
          )}

          {/* 주문자 정보 */}
          {(order.ordererName || order.ordererEmail || order.ordererPhone) && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">주문자 정보</p>
              <div className="space-y-1.5">
                <InfoRow label="이름" value={order.ordererName} />
                <InfoRow label="이메일" value={order.ordererEmail} />
                <InfoRow label="연락처" value={order.ordererPhone} />
              </div>
            </section>
          )}

          {/* 배송지 정보 */}
          {order.recipientName && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">배송지 정보</p>
              <div className="space-y-1.5">
                <InfoRow label="수령자" value={order.recipientName} />
                <InfoRow label="연락처" value={order.recipientPhone} />
                <InfoRow label="주소" value={address || '-'} />
                <InfoRow label="배송메모" value={order.deliveryMemo} />
              </div>
            </section>
          )}

          {/* 굿즈 페이지 링크 */}
          <Link
            to={`/goods/${order.goodsId}`}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
          >
            상품 페이지 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}

const FILTER_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING_PAYMENT', label: '입금 대기' },
  { key: 'PAYMENT_CONFIRMED', label: '입금 확인' },
  { key: 'CANCELLED', label: '취소' },
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { toast, show, hide } = useToast();

  useEffect(() => {
    axiosClient.get('/seller/orders/my')
      .then((res) => setOrders(res.data.data || []))
      .catch(() => show('구매 내역을 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterStatus === 'ALL'
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const counts = Object.fromEntries(
    FILTER_TABS.map(({ key }) => [
      key,
      key === 'ALL' ? orders.length : orders.filter((o) => o.status === key).length,
    ])
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-2xl font-bold text-gray-800 mb-6">구매 내역</h1>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterStatus === key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs ${filterStatus === key ? 'opacity-80' : 'text-gray-400'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filterStatus === 'ALL' ? (
            <>
              <p className="text-4xl mb-3">🛍</p>
              <p>아직 구매 내역이 없습니다.</p>
              <Link to="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                굿즈 둘러보기 →
              </Link>
            </>
          ) : (
            <p>해당 상태의 주문이 없습니다.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
