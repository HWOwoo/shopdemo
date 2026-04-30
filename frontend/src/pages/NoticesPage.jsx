import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listNotices } from '../api/notice';
import Spinner from '../components/ui/Spinner';

export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listNotices()
      .then(setNotices)
      .catch(() => setError('공지사항을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">공지사항</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {notices.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {notices.map((n) => (
            <Link
              key={n.id}
              to={`/notices/${n.id}`}
              className="flex items-center gap-3 px-4 py-4 sm:px-5 hover:bg-gray-50 transition-colors"
            >
              {n.pinned && (
                <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                  고정
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-800 truncate">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString('ko-KR')} · 조회 {n.viewCount ?? 0}
                </p>
              </div>
              <span className="text-gray-300 text-xl leading-none">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
