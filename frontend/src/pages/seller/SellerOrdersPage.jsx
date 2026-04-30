import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';

const COURIERS = ['CJ대한통운', '롯데택배', '한진택배', '우체국택배', '로젠택배', '경동택배', 'GS편의점택배', '기타'];

function TrackingModal({ order, onClose, onSaved }) {
  const [courierName, setCourierName] = useState(order.courierName || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const address = [order.postalCode, order.address, order.addressDetail].filter(Boolean).join(' ');

  const handleSave = async () => {
    if (!courierName) { setError('택배사를 선택해 주세요.'); return; }
    if (!trackingNumber.trim()) { setError('송장번호를 입력해 주세요.'); return; }
    setSaving(true);
    try {
      const res = await axiosClient.put(`/seller/orders/${order.id}/tracking`, {
        courierName,
        trackingNumber: trackingNumber.trim(),
      });
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-gray-800">송장 입력</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* 배송지 자동 입력 정보 (읽기 전용) */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">수령자 정보 (자동 입력)</p>
            <div className="flex gap-3">
              <span className="text-gray-400 w-14 shrink-0">수령자</span>
              <span className="font-medium text-gray-700">{order.recipientName || order.ordererName || '-'}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-14 shrink-0">연락처</span>
              <span className="font-medium text-gray-700">{order.recipientPhone || order.ordererPhone || '-'}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-14 shrink-0">주소</span>
              <span className="font-medium text-gray-700">{address || '-'}</span>
            </div>
            {order.deliveryMemo && (
              <div className="flex gap-3">
                <span className="text-gray-400 w-14 shrink-0">메모</span>
                <span className="text-gray-600">{order.deliveryMemo}</span>
              </div>
            )}
          </div>

          {/* 택배사 선택 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">택배사</label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">택배사 선택</option>
              {COURIERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 송장번호 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">송장번호</label>
            <input
              type="text"
              placeholder="송장번호 입력"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-[2] py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? '저장 중...' : '송장 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL = {
  PENDING_PAYMENT:   { label: '입금 대기',   cls: 'bg-yellow-100 text-yellow-700' },
  PAYMENT_CONFIRMED: { label: '입금 확인',   cls: 'bg-green-100 text-green-700' },
  SHIPPED:           { label: '배송 중',     cls: 'bg-blue-100 text-blue-700' },
  DELIVERED:         { label: '배송 완료',   cls: 'bg-indigo-100 text-indigo-700' },
  CANCEL_REQUESTED:  { label: '취소 요청중', cls: 'bg-orange-100 text-orange-700' },
  CANCELLED:         { label: '취소',        cls: 'bg-gray-100 text-gray-500' },
};

const TYPE_LABEL = {
  DIRECT:  { label: '직접구매', cls: 'bg-orange-100 text-orange-700' },
  PLATFORM:{ label: '안심거래', cls: 'bg-indigo-100 text-indigo-700' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function TypeBadge({ type }) {
  const t = TYPE_LABEL[type] ?? { label: type, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.cls}`}>{t.label}</span>;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{value}</span>
    </div>
  );
}

function OrderDetailDrawer({ order, onClose, onConfirm, onCancel }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto z-50">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-gray-800">주문 상세</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-5 flex flex-col gap-5 flex-1">
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">주문 정보</p>
            <div className="space-y-2 text-sm">
              <Row label="주문번호" value={<span className="font-mono">{order.orderNumber}</span>} />
              <Row label="주문일시" value={new Date(order.createdAt).toLocaleString('ko-KR')} />
              {order.items && order.items.length > 0 && (
                <div className="flex gap-3">
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
              <Row label="주문금액" value={<span className="font-bold text-indigo-600">{Number(order.totalPrice).toLocaleString()}원</span>} />
              <Row label="구매방식" value={<TypeBadge type={order.purchaseType} />} />
              {order.paymentMethod && <Row label="결제수단" value={order.paymentMethod} />}
              <Row label="상태" value={<StatusBadge status={order.status} />} />
            </div>
          </section>
          {order.purchaseType === 'DIRECT' && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">입금자 정보</p>
              <div className="space-y-2 text-sm">
                <Row label="입금자명" value={order.depositorName || '-'} />
                <Row label="입금 예정일" value={order.depositorDate || '-'} />
              </div>
            </section>
          )}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">주문자 정보</p>
            <div className="space-y-2 text-sm">
              <Row label="구매자 ID" value={order.buyerUsername} />
              <Row label="주문자명" value={order.ordererName || '-'} />
              <Row label="이메일" value={order.ordererEmail || '-'} />
              <Row label="연락처" value={order.ordererPhone || '-'} />
            </div>
          </section>
          {order.recipientName && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">배송지 정보</p>
              <div className="space-y-2 text-sm">
                <Row label="수령자" value={order.recipientName} />
                <Row label="연락처" value={order.recipientPhone || '-'} />
                <Row label="주소" value={[order.postalCode, order.address, order.addressDetail].filter(Boolean).join(' ') || '-'} />
                {order.deliveryMemo && <Row label="배송메모" value={order.deliveryMemo} />}
              </div>
            </section>
          )}
          {(order.courierName || order.trackingNumber) && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">배송 정보</p>
              <div className="space-y-2 text-sm">
                <Row label="택배사" value={order.courierName || '-'} />
                <Row label="송장번호" value={order.trackingNumber || '-'} />
              </div>
            </section>
          )}
        </div>
        {order.status === 'PENDING_PAYMENT' && (
          <div className="p-5 border-t flex gap-2">
            <button onClick={() => onConfirm(order.id)} className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">입금 확인</button>
            <button onClick={() => onCancel(order.id)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">취소 요청</button>
          </div>
        )}
        {order.status === 'PAYMENT_CONFIRMED' && (
          <div className="p-5 border-t">
            <button onClick={() => onCancel(order.id)} className="w-full py-2.5 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors">취소 요청</button>
          </div>
        )}
        {order.status === 'CANCEL_REQUESTED' && (
          <div className="p-5 border-t">
            <div className="text-center text-sm text-orange-500 font-medium py-1">취소 요청 처리 중 (관리자 승인 대기)</div>
          </div>
        )}
      </div>
    </div>
  );
}

// 주문을 goodsId 기준으로 그룹화
function groupByGoods(orders) {
  const map = new Map();
  for (const order of orders) {
    if (!map.has(order.goodsId)) {
      map.set(order.goodsId, { goodsId: order.goodsId, goodsName: order.goodsName, orders: [] });
    }
    map.get(order.goodsId).orders.push(order);
  }
  return Array.from(map.values());
}

function GoodsOrderGroup({ group, onSelectOrder, onConfirm, onCancel, onOpenTracking, filterStatus }) {
  const [expanded, setExpanded] = useState(true);

  const filtered = filterStatus === 'ALL'
    ? group.orders
    : group.orders.filter((o) => o.status === filterStatus);

  if (filtered.length === 0) return null;

  const pendingCount = group.orders.filter((o) => o.status === 'PENDING_PAYMENT').length;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {/* 굿즈 헤더 */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🛍</span>
          <div>
            <p className="font-semibold text-gray-800">{group.goodsName}</p>
            <p className="text-xs text-gray-400 mt-0.5">총 {group.orders.length}건</p>
          </div>
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-white text-xs font-bold rounded-full">
              입금대기 {pendingCount}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* 주문 목록 - 데스크탑 */}
      {expanded && (
        <>
          <div className="hidden md:block border-t border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">주문번호</th>
                  <th className="px-4 py-2.5 text-left">구매자</th>
                  <th className="px-4 py-2.5 text-left">입금자명</th>
                  <th className="px-4 py-2.5 text-left">옵션</th>
                  <th className="px-4 py-2.5 text-right">금액</th>
                  <th className="px-4 py-2.5 text-center">구매방식</th>
                  <th className="px-4 py-2.5 text-center">상태</th>
                  <th className="px-4 py-2.5 text-center">주문일</th>
                  <th className="px-4 py-2.5 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    onClick={() => onSelectOrder(order)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{order.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{order.buyerUsername}</td>
                    <td className="px-4 py-3 text-gray-500">{order.depositorName || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {order.items && order.items.length > 0
                        ? order.items.map((i) => `${i.optionName}×${i.quantity}`).join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {Number(order.totalPrice).toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center"><TypeBadge type={order.purchaseType} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {order.status === 'PENDING_PAYMENT' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => onConfirm(order.id)} className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors">입금확인</button>
                          <button onClick={() => onCancel(order.id)} className="px-2.5 py-1 border border-gray-300 text-gray-500 text-xs rounded hover:bg-gray-50 transition-colors">취소 요청</button>
                        </div>
                      )}
                      {order.status === 'PAYMENT_CONFIRMED' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenTracking(order); }}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                              order.trackingNumber
                                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {order.trackingNumber ? '송장 수정' : '송장 입력'}
                          </button>
                          <button onClick={() => onCancel(order.id)} className="px-2.5 py-1 border border-red-200 text-red-400 text-xs rounded hover:bg-red-50 transition-colors">취소 요청</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 주문 목록 - 모바일 카드 */}
          <div className="md:hidden border-t border-gray-100 divide-y divide-gray-100">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                onClick={() => onSelectOrder(order)}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <TypeBadge type={order.purchaseType} />
                  </div>
                  <span className="font-bold text-sm text-indigo-600">
                    {Number(order.totalPrice).toLocaleString()}원
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span className="font-mono text-gray-400">{order.orderNumber}</span>
                  <span>·</span>
                  <span className="font-medium text-gray-700">{order.buyerUsername}</span>
                </div>
                {order.items && order.items.length > 0 && (
                  <p className="text-xs text-gray-400 mb-2 truncate">
                    {order.items.map((i) => `${i.optionName}×${i.quantity}`).join(', ')}
                  </p>
                )}
                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'PENDING_PAYMENT' && (
                    <>
                      <button onClick={() => onConfirm(order.id)} className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700">입금확인</button>
                      <button onClick={() => onCancel(order.id)} className="px-2.5 py-1 border border-gray-300 text-gray-500 text-xs rounded hover:bg-gray-50">취소</button>
                    </>
                  )}
                  {order.status === 'PAYMENT_CONFIRMED' && (
                    <>
                      <button
                        onClick={() => onOpenTracking(order)}
                        className={`px-2.5 py-1 text-xs font-medium rounded ${
                          order.trackingNumber ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {order.trackingNumber ? '송장 수정' : '송장 입력'}
                      </button>
                      <button onClick={() => onCancel(order.id)} className="px-2.5 py-1 border border-red-200 text-red-400 text-xs rounded">취소</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const fetchOrders = () => {
    setLoading(true);
    axiosClient.get('/seller/orders')
      .then((res) => setOrders(res.data.data || []))
      .catch(() => show('주문 목록을 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateOrder = (updated) => {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    setSelectedOrder((prev) => prev?.id === updated.id ? updated : prev);
    setTrackingOrder((prev) => prev?.id === updated.id ? updated : prev);
  };

  const handleConfirm = async (orderId) => {
    try {
      const res = await axiosClient.put(`/seller/orders/${orderId}/confirm-payment`);
      show('입금이 확인되었습니다.', 'success');
      updateOrder(res.data.data);
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  const handleCancel = async (orderId) => {
    if (!await confirm('취소 요청을 접수하시겠습니까?', '관리자 승인 후 취소됩니다.')) return;
    try {
      const res = await axiosClient.put(`/seller/orders/${orderId}/cancel`);
      show('취소 요청이 접수되었습니다.', 'success');
      updateOrder(res.data.data);
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  const grouped = groupByGoods(orders);
  const counts = {
    ALL: orders.length,
    PENDING_PAYMENT: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
    PAYMENT_CONFIRMED: orders.filter((o) => o.status === 'PAYMENT_CONFIRMED').length,
    SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length,
    DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
    CANCEL_REQUESTED: orders.filter((o) => o.status === 'CANCEL_REQUESTED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  return (
    <div>
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />
      {trackingOrder && (
        <TrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onSaved={(updated) => {
            updateOrder(updated);
            setTrackingOrder(null);
            show('송장이 등록되었습니다.', 'success');
          }}
        />
      )}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">주문 관리</h1>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'ALL', label: '전체' },
          { key: 'PENDING_PAYMENT', label: '입금 대기' },
          { key: 'PAYMENT_CONFIRMED', label: '입금 확인' },
          { key: 'SHIPPED', label: '배송 중' },
          { key: 'DELIVERED', label: '배송 완료' },
          { key: 'CANCEL_REQUESTED', label: '취소 요청 중' },
          { key: 'CANCELLED', label: '취소' },
        ].map(({ key, label }) => (
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
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">아직 주문이 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((group) => (
            <GoodsOrderGroup
              key={group.goodsId}
              group={group}
              filterStatus={filterStatus}
              onSelectOrder={setSelectedOrder}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onOpenTracking={setTrackingOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
