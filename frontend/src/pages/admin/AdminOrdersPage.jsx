import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';

const STATUS_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING_PAYMENT', label: '입금 대기' },
  { key: 'PAYMENT_CONFIRMED', label: '입금 완료' },
  { key: 'SHIPPED', label: '배송 중' },
  { key: 'DELIVERED', label: '배송 완료' },
  { key: 'CANCEL_REQUESTED', label: '취소 요청' },
  { key: 'CANCELLED', label: '취소' },
];

const STATUS_STYLES = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCEL_REQUESTED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

const STATUS_LABEL = {
  PENDING_PAYMENT: '입금 대기',
  PAYMENT_CONFIRMED: '입금 완료',
  SHIPPED: '배송 중',
  DELIVERED: '배송 완료',
  CANCEL_REQUESTED: '취소 요청',
  CANCELLED: '취소',
};

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 text-right break-all">{value}</span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const { toast, show, hide } = useToast();

  const fetchOrders = (currentStatus) => {
    setLoading(true);
    const params = currentStatus === 'ALL' ? {} : { status: currentStatus };
    axiosClient.get('/admin/orders', { params })
      .then((res) => setOrders(res.data.data || []))
      .catch(() => show('목록을 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(status); }, [status]);

  const keyword = search.trim().toLowerCase();
  const filteredOrders = keyword
    ? orders.filter((o) =>
        (o.orderNumber || '').toLowerCase().includes(keyword)
        || (o.goodsName || '').toLowerCase().includes(keyword)
        || (o.buyerUsername || '').toLowerCase().includes(keyword)
        || (o.sellerUsername || '').toLowerCase().includes(keyword)
      )
    : orders;

  return (
    <div>
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">전체 주문 조회</h1>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              status === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="주문번호 / 상품명 / 구매자 / 판매자 검색"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-xs">
              취소
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          조회된 주문이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">주문번호</th>
                <th className="px-4 py-3 text-left">상품명</th>
                <th className="px-4 py-3 text-left">판매자</th>
                <th className="px-4 py-3 text-left">구매자</th>
                <th className="px-4 py-3 text-right">금액</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-center">주문일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(o)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.orderNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{o.goodsName}</td>
                  <td className="px-4 py-3 text-gray-500">{o.sellerUsername ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{o.buyerUsername}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {Number(o.totalPrice).toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">{filteredOrders.length}건 표시 중</p>

      {/* 상세 드로어 */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-gray-800">주문 상세</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 flex flex-col gap-5 flex-1">
              <section className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">주문 정보</p>
                <Row label="주문번호" value={<span className="font-mono text-xs">{selected.orderNumber}</span>} />
                <Row label="상품명" value={selected.goodsName} />
                <Row label="상태" value={
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[selected.status] || selected.status}
                  </span>
                } />
                <Row label="금액" value={<span className="font-bold text-indigo-600">{Number(selected.totalPrice).toLocaleString()}원</span>} />
                <Row label="주문일" value={new Date(selected.createdAt).toLocaleString('ko-KR')} />
                <Row label="구매 방식" value={selected.purchaseType === 'DIRECT' ? '직접 계좌이체' : '안심거래'} />
                {selected.items?.length > 0 && (
                  <div className="flex gap-3 text-sm">
                    <span className="text-gray-400 shrink-0">옵션</span>
                    <div className="flex flex-col gap-0.5 text-right flex-1">
                      {selected.items.map((i) => (
                        <span key={i.optionId} className="text-gray-700">{i.optionName} × {i.quantity}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">참여자</p>
                <Row label="판매자" value={selected.sellerUsername ?? '-'} />
                <Row label="구매자" value={selected.buyerUsername} />
                <Row label="주문자명" value={selected.ordererName || '-'} />
                <Row label="주문자 연락처" value={selected.ordererPhone || '-'} />
                <Row label="주문자 이메일" value={selected.ordererEmail || '-'} />
              </section>

              {selected.recipientName && (
                <section className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">배송지</p>
                  <Row label="수령자" value={selected.recipientName} />
                  <Row label="연락처" value={selected.recipientPhone || '-'} />
                  <Row label="주소" value={[selected.postalCode, selected.address, selected.addressDetail].filter(Boolean).join(' ') || '-'} />
                  {selected.deliveryMemo && <Row label="메모" value={selected.deliveryMemo} />}
                </section>
              )}

              {(selected.courierName || selected.trackingNumber) && (
                <section className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">배송 정보</p>
                  <Row label="택배사" value={selected.courierName || '-'} />
                  <Row label="송장번호" value={<span className="font-mono text-xs">{selected.trackingNumber || '-'}</span>} />
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
