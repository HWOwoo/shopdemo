import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Toast, { useToast } from '../../components/ui/Toast';

const STATUS_STYLE = {
  PENDING: { label: '정산 대기', cls: 'bg-yellow-100 text-yellow-700' },
  PAID:    { label: '정산 완료', cls: 'bg-green-100 text-green-700' },
};

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sellerId: '', periodStart: '', periodEnd: '' });
  const [creating, setCreating] = useState(false);
  const { toast, show, hide } = useToast();

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      axiosClient.get('/admin/settlements'),
      axiosClient.get('/admin/users'),
    ])
      .then(([sRes, uRes]) => {
        setSettlements(sRes.data.data || []);
        const sellers = (uRes.data.data || []).filter((u) => u.role === 'SELLER');
        setUsers(sellers);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.sellerId || !form.periodStart || !form.periodEnd) {
      show('모든 필드를 입력해 주세요.', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await axiosClient.post('/admin/settlements', {
        sellerId: Number(form.sellerId),
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
      });
      setSettlements((prev) => [res.data.data, ...prev]);
      setShowForm(false);
      setForm({ sellerId: '', periodStart: '', periodEnd: '' });
      show('정산 내역이 생성되었습니다.', 'success');
    } catch (err) {
      show(err.response?.data?.message || '생성에 실패했습니다.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handlePay = async (id) => {
    if (!confirm('정산 완료 처리하시겠습니까?')) return;
    try {
      const res = await axiosClient.post(`/admin/settlements/${id}/pay`);
      setSettlements((prev) => prev.map((s) => s.id === id ? res.data.data : s));
      show('정산이 완료 처리되었습니다.', 'success');
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <Toast toast={toast} onClose={hide} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">정산 관리</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '취소' : '+ 정산 생성'}
        </Button>
      </div>

      {/* 정산 생성 폼 */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">판매자</label>
              <select
                value={form.sellerId}
                onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">판매자 선택</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">시작일</label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">종료일</label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? '생성 중...' : '정산 내역 생성'}
          </Button>
        </form>
      )}

      {settlements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">정산 내역이 없습니다.</div>
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">판매자</th>
                  <th className="px-4 py-3 text-left">기간</th>
                  <th className="px-4 py-3 text-right">주문 수</th>
                  <th className="px-4 py-3 text-right">정산 금액</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3 text-center">정산 완료일</th>
                  <th className="px-4 py-3 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map((s) => {
                  const st = STATUS_STYLE[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-500' };
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700">{s.sellerUsername}</td>
                      <td className="px-4 py-3 text-gray-600">{s.periodStart} ~ {s.periodEnd}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{s.orderCount}건</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{Number(s.amount).toLocaleString()}원</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        {s.paidAt ? new Date(s.paidAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.status === 'PENDING' && (
                          <button
                            onClick={() => handlePay(s.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                          >
                            정산 완료
                          </button>
                        )}
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
                    <span className="font-medium text-gray-700">{s.sellerUsername}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{s.periodStart} ~ {s.periodEnd}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{s.orderCount}건</span>
                    <span className="font-bold text-gray-800">{Number(s.amount).toLocaleString()}원</span>
                  </div>
                  {s.status === 'PENDING' && (
                    <button
                      onClick={() => handlePay(s.id)}
                      className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      정산 완료
                    </button>
                  )}
                  {s.paidAt && <p className="text-xs text-green-500 mt-2">정산 완료: {new Date(s.paidAt).toLocaleDateString('ko-KR')}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
