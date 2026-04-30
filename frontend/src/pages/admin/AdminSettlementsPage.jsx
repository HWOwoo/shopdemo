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

const TABS = [
  { key: 'REQUESTED', label: '신청 검토' },
  { key: 'PENDING',   label: '송금 대기' },
  { key: 'PAID',      label: '정산 완료' },
  { key: 'REJECTED',  label: '거절' },
  { key: 'ALL',       label: '전체' },
];

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sellerId: '', periodStart: '', periodEnd: '' });
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState('REQUESTED');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

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

  const filtered = tab === 'ALL' ? settlements : settlements.filter((s) => s.status === tab);

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'ALL' ? settlements.length : settlements.filter((s) => s.status === t.key).length;
    return acc;
  }, {});

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

  const handleApprove = async (id) => {
    if (!await confirm('이 정산 신청을 승인하시겠습니까?', '승인 후 송금 대기 상태로 전환됩니다.')) return;
    try {
      const res = await axiosClient.post(`/admin/settlements/${id}/approve`);
      setSettlements((prev) => prev.map((s) => s.id === id ? res.data.data : s));
      show('신청을 승인했습니다.', 'success');
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  const handleOpenReject = (id) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      show('거절 사유를 입력해 주세요.', 'error');
      return;
    }
    try {
      const res = await axiosClient.post(`/admin/settlements/${rejectingId}/reject`, { reason: rejectReason.trim() });
      setSettlements((prev) => prev.map((s) => s.id === rejectingId ? res.data.data : s));
      setRejectingId(null);
      show('신청을 거절했습니다.', 'success');
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  const handlePay = async (id) => {
    if (!await confirm('정산 완료 처리하시겠습니까?', '실제 송금 후 진행해주세요.')) return;
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
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">정산 관리</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '취소' : '+ 직접 생성'}
        </Button>
      </div>

      {/* 직접 생성 폼 (수동 백업 흐름) */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <p className="text-xs text-gray-500 mb-3">
            * 일반적으로는 판매자 신청을 승인하는 방식이며, 이 폼은 어드민이 직접 생성하는 백업용입니다.
          </p>
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

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${tab === t.key ? 'opacity-80' : 'text-gray-400'}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
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
                  <th className="px-4 py-3 text-center">신청/완료일</th>
                  <th className="px-4 py-3 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => {
                  const st = STATUS_STYLE[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-500' };
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700">{s.sellerUsername}</td>
                      <td className="px-4 py-3 text-gray-600">{s.periodStart} ~ {s.periodEnd}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{s.orderCount}건</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{Number(s.amount).toLocaleString()}원</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        {s.status === 'REJECTED' && s.rejectedReason && (
                          <p className="text-xs text-red-500 mt-1">{s.rejectedReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        {s.status === 'PAID' && s.paidAt
                          ? `완료: ${new Date(s.paidAt).toLocaleDateString('ko-KR')}`
                          : s.requestedAt
                            ? `신청: ${new Date(s.requestedAt).toLocaleDateString('ko-KR')}`
                            : new Date(s.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.status === 'REQUESTED' && (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleApprove(s.id)}
                              className="px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleOpenReject(s.id)}
                              className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
                            >
                              거절
                            </button>
                          </div>
                        )}
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
            {filtered.map((s) => {
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
                  {s.status === 'REQUESTED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(s.id)}
                        className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleOpenReject(s.id)}
                        className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {s.status === 'PENDING' && (
                    <button
                      onClick={() => handlePay(s.id)}
                      className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      정산 완료
                    </button>
                  )}
                  {s.paidAt && <p className="text-xs text-green-500 mt-2">정산 완료: {new Date(s.paidAt).toLocaleDateString('ko-KR')}</p>}
                  {s.status === 'REJECTED' && s.rejectedReason && (
                    <p className="text-xs text-red-500 mt-1">거절 사유: {s.rejectedReason}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 거절 사유 입력 모달 */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-5 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-3">정산 신청 거절</h2>
            <p className="text-sm text-gray-500 mb-3">거절 사유를 판매자에게 알림으로 전달합니다.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="예: 정산 정보 누락, 분쟁 진행 중 등"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
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
