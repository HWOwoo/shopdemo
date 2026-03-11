import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';

const STATUS_BADGE = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL = { PENDING: '대기', APPROVED: '승인', REJECTED: '거절' };

export default function AdminSellerApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    axiosClient.get('/admin/seller-applications')
      .then((res) => setApplications(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL'
    ? applications
    : applications.filter((a) => a.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">판매자 신청 관리</h1>

      <div className="flex gap-2 mb-4">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? '전체' : STATUS_LABEL[s]}
            {s !== 'ALL' && (
              <span className="ml-1 opacity-70">
                ({applications.filter((a) => a.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">해당하는 신청이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">신청자</th>
                <th className="px-4 py-3 text-left">상호명</th>
                <th className="px-4 py-3 text-left">연락처</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-center">신청일</th>
                <th className="px-4 py-3 text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.username}</td>
                  <td className="px-4 py-3 text-gray-600">{a.shopName}</td>
                  <td className="px-4 py-3 text-gray-500">{a.contactPhone}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.status === 'PENDING' ? (
                      <Link
                        to={`/admin/seller-applications/${a.id}/review`}
                        className="inline-block bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        심사하기
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-300">처리 완료</span>
                    )}
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
