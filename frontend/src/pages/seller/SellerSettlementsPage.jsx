import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Toast, { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';

const STATUS_STYLE = {
  REQUESTED: { label: '신청 검토 중', cls: 'bg-amber-100 text-amber-700' },
  PENDING:   { label: '송금 대기',    cls: 'bg-yellow-100 text-yellow-700' },
  PAID:      { label: '정산 완료',    cls: 'bg-green-100 text-green-700' },
  REJECTED:  { label: '신청 거절',    cls: 'bg-red-100 text-red-600' },
};

export default function SellerSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [available, setAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const fetchAll = () => {
    Promise.all([
      axiosClient.get('/seller/settlements'),
      axiosClient.get('/seller/settlements/available'),
    ])
      .then(([sRes, aRes]) => {
        setSettlements(sRes.data.data || []);
        setAvailable(aRes.data.data || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRequest = async () => {
    if (!available || available.orderCount === 0) return;
    const ok = await confirm(
      `${Number(available.amount).toLocaleString()}원 (${available.orderCount}건)을 정산 신청하시겠습니까?`,
      '신청 후 어드민 승인을 거쳐 송금됩니다.'
    );
    if (!ok) return;
    setRequesting(true);
    try {
      await axiosClient.post('/seller/settlements/request');
      show('정산 신청이 접수되었습니다.', 'success');
      setLoading(true);
      fetchAll();
    } catch (err) {
      show(err.response?.data?.message || '신청에 실패했습니다.', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const totalPaid = settlements
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const totalPending = settlements
    .filter((s) => s.status === 'REQUESTED' || s.status === 'PENDING')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const canRequest = available && available.orderCount > 0 && !available.hasPendingRequest;

  return (
    <div>
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">정산 내역</h1>

      {/* 신청 가능 금액 카드 */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-indigo-500 font-semibold mb-1">신청 가능 금액</p>
            <p className="text-2xl font-bold text-gray-800">
              {Number(available?.amount ?? 0).toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500 mt-1">
              미정산 배송완료 주문 {available?.orderCount ?? 0}건
              {available?.oldestOrderDate && (
                <> · {available.oldestOrderDate} ~ {available.latestOrderDate}</>
              )}
            </p>
            {available?.hasPendingRequest && (
              <p className="text-xs text-amber-600 mt-2">
                ※ 이미 검토 중인 신청이 있어 추가 신청이 불가합니다.
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleRequest}
            disabled={!canRequest || requesting}
          >
            {requesting ? '신청 중...' : '정산 신청'}
          </Button>
        </div>
      </div>

      {/* 합계 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">정산 완료 합계</p>
          <p className="text-xl font-bold text-green-600">{totalPaid.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">정산 대기 합계</p>
          <p className="text-xl font-bold text-yellow-600">{totalPending.toLocaleString()}원</p>
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">아직 정산 내역이 없습니다.</div>
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">기간</th>
                  <th className="px-4 py-3 text-right">주문 수</th>
                  <th className="px-4 py-3 text-right">정산 금액</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3 text-center">정산 완료일</th>
                  <th className="px-4 py-3 text-center">생성일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map((s) => {
                  const st = STATUS_STYLE[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-500' };
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{s.periodStart} ~ {s.periodEnd}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{s.orderCount}건</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{Number(s.amount).toLocaleString()}원</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        {s.status === 'REJECTED' && s.rejectedReason && (
                          <p className="text-xs text-red-500 mt-1">{s.rejectedReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        {s.paidAt ? new Date(s.paidAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        {new Date(s.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="md:hidden flex flex-col gap-3">
            {settlements.map((s) => {
              const st = STATUS_STYLE[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-500' };
              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    <span className="font-bold text-gray-800">{Number(s.amount).toLocaleString()}원</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{s.periodStart} ~ {s.periodEnd}</p>
                  <p className="text-xs text-gray-400">{s.orderCount}건 | 생성: {new Date(s.createdAt).toLocaleDateString('ko-KR')}</p>
                  {s.paidAt && <p className="text-xs text-green-500 mt-1">정산 완료: {new Date(s.paidAt).toLocaleDateString('ko-KR')}</p>}
                  {s.status === 'REJECTED' && s.rejectedReason && (
                    <p className="text-xs text-red-500 mt-1">거절 사유: {s.rejectedReason}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
