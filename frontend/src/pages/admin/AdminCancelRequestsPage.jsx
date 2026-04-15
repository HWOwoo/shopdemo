import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{value}</span>
    </div>
  );
}

export default function AdminCancelRequestsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast, show, hide } = useToast();

  const fetchOrders = () => {
    setLoading(true);
    axiosClient.get('/admin/orders/cancel-requests')
      .then((res) => setOrders(res.data.data || []))
      .catch(() => show('목록을 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleApprove = async (orderId) => {
    if (!confirm('취소 요청을 승인하시겠습니까? 주문이 취소되고 재고가 복구됩니다.')) return;
    setSubmitting(true);
    try {
      await axiosClient.post(`/admin/orders/${orderId}/cancel-approve`);
      show('취소 요청이 승인되었습니다.', 'success');
      setSelected(null);
      fetchOrders();
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (orderId) => {
    if (!confirm('취소 요청을 거절하시겠습니까? 주문이 이전 상태로 복구됩니다.')) return;
    setSubmitting(true);
    try {
      await axiosClient.post(`/admin/orders/${orderId}/cancel-reject`);
      show('취소 요청이 거절되었습니다.', 'success');
      setSelected(null);
      fetchOrders();
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">주문 취소 요청 관리</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">처리 대기 중인 취소 요청이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">주문번호</th>
                <th className="px-4 py-3 text-left">상품명</th>
                <th className="px-4 py-3 text-left">판매자</th>
                <th className="px-4 py-3 text-left">구매자</th>
                <th className="px-4 py-3 text-right">금액</th>
                <th className="px-4 py-3 text-center">요청일</th>
                <th className="px-4 py-3 text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.orderNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{o.goodsName}</td>
                  <td className="px-4 py-3 text-gray-500">{o.sellerUsername ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{o.buyerUsername}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{Number(o.totalPrice).toLocaleString()}원</td>
                  <td className="px-4 py-3 text-center text-gray-400">{new Date(o.updatedAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleApprove(o.id)}
                        disabled={submitting}
                        className="px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(o.id)}
                        disabled={submitting}
                        className="px-2.5 py-1 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        거절
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                <Row label="금액" value={<span className="font-bold text-indigo-600">{Number(selected.totalPrice).toLocaleString()}원</span>} />
                <Row label="주문일" value={new Date(selected.createdAt).toLocaleString('ko-KR')} />
                {selected.items?.length > 0 && (
                  <div className="flex gap-3 text-sm">
                    <span className="text-gray-400 shrink-0">옵션</span>
                    <div className="flex flex-col gap-0.5 text-right">
                      {selected.items.map((i) => (
                        <span key={i.optionId} className="text-gray-700">{i.optionName} × {i.quantity}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
              <section className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">구매자 정보</p>
                <Row label="구매자 ID" value={selected.buyerUsername} />
                <Row label="주문자명" value={selected.ordererName || '-'} />
                <Row label="연락처" value={selected.ordererPhone || '-'} />
              </section>
              {selected.recipientName && (
                <section className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">배송지</p>
                  <Row label="수령자" value={selected.recipientName} />
                  <Row label="주소" value={[selected.postalCode, selected.address, selected.addressDetail].filter(Boolean).join(' ') || '-'} />
                </section>
              )}
            </div>
            <div className="p-5 border-t flex gap-2">
              <button
                onClick={() => handleApprove(selected.id)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                취소 승인
              </button>
              <button
                onClick={() => handleReject(selected.id)}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
