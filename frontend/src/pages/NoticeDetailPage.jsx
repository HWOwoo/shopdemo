import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { getNotice } from '../api/notice';
import Spinner from '../components/ui/Spinner';

export default function NoticeDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getNotice(id)
      .then(setNotice)
      .catch((err) => setError(err.response?.data?.message || '공지사항을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (error) return <div className="max-w-3xl mx-auto p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>;
  if (!notice) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/notices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        ← 공지 목록
      </Link>

      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
        <header className="pb-5 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-3">
            {notice.pinned && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                고정
              </span>
            )}
            <span className="text-xs text-gray-400">{notice.authorUsername}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-snug">{notice.title}</h1>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notice.createdAt).toLocaleString('ko-KR')} · 조회 {notice.viewCount ?? 0}
          </p>
        </header>

        <div
          className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.content) }}
        />
      </article>
    </div>
  );
}
