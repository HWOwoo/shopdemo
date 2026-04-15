import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Toast, { useToast } from '../../components/ui/Toast';

const STATUS_LABEL = {
  PENDING:  { label: '심사 중',  cls: 'bg-gray-100 text-gray-600' },
  APPROVED: { label: '진행 중',  cls: 'bg-blue-100 text-blue-700' },
  CLOSED:   { label: '마감',     cls: 'bg-yellow-100 text-yellow-700' },
  REJECTED: { label: '반려',     cls: 'bg-red-100 text-red-600' },
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SellerPreordersPage() {
  const { goodsId } = useParams();
  const navigate = useNavigate();
  const { toast, show, hide } = useToast();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const fetchSummary = () => {
    setLoading(true);
    axiosClient.get(`/goods/my/${goodsId}/preorder-summary`)
      .then((res) => setSummary(res.data.data))
      .catch((err) => show(err.response?.data?.message || '불러오기 실패', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, [goodsId]);

  const handleConfirm = async () => {
    if (!confirm('생산을 확정하시겠습니까? 수요조사가 통판으로 전환되며 신청자에게 알림이 발송됩니다.')) return;
    setConfirming(true);
    try {
      await axiosClient.post(`/goods/my/${goodsId}/preorder-confirm`);
      show('생산이 확정되었습니다. 신청자에게 알림이 발송되었습니다.', 'success');
      fetchSummary();
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!summary) return null;

  const statusInfo = STATUS_LABEL[summary.goodsStatus] ?? { label: summary.goodsStatus, cls: 'bg-gray-100 text-gray-600' };
  const canConfirm = summary.goodsStatus === 'CLOSED';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Toast toast={toast} onClose={hide} />

      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</button>
        <h1 className="text-xl font-bold text-gray-800 flex-1">{summary.goodsName}</h1>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.cls}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
        <div className="flex-1">
          <p className="text-gray-400 text-xs mb-1">마감일</p>
          <p className="font-medium text-gray-800">{formatDate(summary.preorderDeadline)}</p>
        </div>
        <div className="flex-1">
          <p className="text-gray-400 text-xs mb-1">총 신청 인원</p>
          <p className="font-bold text-2xl text-indigo-600">{summary.totalEntries}<span className="text-sm font-normal text-gray-500 ml-1">명</span></p>
        </div>
      </div>

      {/* 옵션별 집계 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">옵션별 수요 집계</h2>
        {summary.optionAggregates.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">신청 내역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.optionAggregates.map((opt) => (
              <div key={opt.optionId} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-700 font-medium text-sm">{opt.optionName}</span>
                <span className="text-indigo-600 font-bold text-lg">{opt.totalQuantity}<span className="text-xs font-normal text-gray-400 ml-1">개</span></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 생산 확정 버튼 */}
      {canConfirm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-indigo-700 flex-1">수요조사가 마감되었습니다. 생산 여부를 결정해주세요.</p>
          <Button onClick={handleConfirm} disabled={confirming} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">
            {confirming ? '처리 중...' : '생산 확정'}
          </Button>
        </div>
      )}

      {/* 신청자 목록 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">신청자 목록</h2>
        {summary.entries.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">신청자가 없습니다.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {summary.entries.map((entry) => (
              <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{entry.username}</p>
                  <ul className="mt-1 space-y-0.5">
                    {entry.items.map((item) => (
                      <li key={item.optionId} className="text-xs text-gray-500">
                        {item.optionName} × {item.quantity}개
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(entry.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
