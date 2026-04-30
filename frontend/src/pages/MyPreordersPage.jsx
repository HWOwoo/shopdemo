import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Toast, { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/ConfirmModal';

export default function MyPreordersPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const fetchEntries = () => {
    setLoading(true);
    axiosClient.get('/goods/preorder/my')
      .then((res) => setEntries(res.data.data || []))
      .catch(() => show('데이터를 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleCancel = async (goodsId) => {
    if (!await confirm('수요조사 신청을 취소하시겠습니까?')) return;
    try {
      await axiosClient.delete(`/goods/${goodsId}/preorder`);
      show('신청이 취소되었습니다.', 'success');
      fetchEntries();
    } catch (err) {
      show(err.response?.data?.message || '취소에 실패했습니다.', 'error');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">내 수요조사 신청</h1>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>아직 신청한 수요조사가 없습니다.</p>
          <Link to="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            굿즈 둘러보기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-start gap-3">
                {entry.goodsImageUrl ? (
                  <Link to={`/goods/${entry.goodsId}`} className="flex-shrink-0">
                    <img src={entry.goodsImageUrl} alt={entry.goodsName} className="w-16 h-16 rounded-xl object-cover" />
                  </Link>
                ) : (
                  <Link to={`/goods/${entry.goodsId}`} className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                    📋
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/goods/${entry.goodsId}`} className="text-sm font-semibold text-gray-800 hover:text-indigo-600 truncate block">
                    {entry.goodsName}
                  </Link>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {entry.items.map((item) => (
                      <span key={item.optionId} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        {item.optionName} x {item.quantity}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <button
                      onClick={() => handleCancel(entry.goodsId)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      신청 취소
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
