import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';

const STATUS_STYLE = {
  PENDING: { label: '정산 대기', cls: 'bg-yellow-100 text-yellow-700' },
  PAID:    { label: '정산 완료', cls: 'bg-green-100 text-green-700' },
};

export default function SellerSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/seller/settlements')
      .then((res) => setSettlements(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = settlements
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const totalPending = settlements
    .filter((s) => s.status === 'PENDING')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">정산 내역</h1>

      {/* 요약 카드 */}
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
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
