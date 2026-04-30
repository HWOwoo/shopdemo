import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listNotices, deleteNotice } from '../../api/notice';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const fetchNotices = () => {
    setLoading(true);
    listNotices()
      .then(setNotices)
      .catch(() => show('목록을 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleDelete = async (id, title) => {
    if (!await confirm(`'${title}' 공지를 삭제하시겠습니까?`, '삭제 후 복구할 수 없습니다.')) return;
    try {
      await deleteNotice(id);
      show('공지가 삭제되었습니다.', 'success');
      fetchNotices();
    } catch (err) {
      show(err.response?.data?.message || '삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">공지사항 관리</h1>
        <Link
          to="/admin/notices/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 새 공지 작성
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          등록된 공지가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-center">고정</th>
                <th className="px-4 py-3 text-center">조회</th>
                <th className="px-4 py-3 text-center">작성일</th>
                <th className="px-4 py-3 text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{n.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-md truncate">{n.title}</td>
                  <td className="px-4 py-3 text-center">
                    {n.pinned ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                        고정
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{n.viewCount ?? 0}</td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        to={`/admin/notices/${n.id}/edit`}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded hover:bg-indigo-100 transition-colors"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(n.id, n.title)}
                        className="px-2.5 py-1 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
