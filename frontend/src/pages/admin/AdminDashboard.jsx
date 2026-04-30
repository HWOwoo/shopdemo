import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingSellerCount, setPendingSellerCount] = useState(0);
  const [cancelRequestCount, setCancelRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axiosClient.get('/admin/users'),
      axiosClient.get('/admin/goods/pending'),
      axiosClient.get('/admin/seller-applications'),
      axiosClient.get('/admin/orders/cancel-requests'),
    ]).then(([usersRes, pendingRes, sellerRes, cancelRes]) => {
      setUsers(usersRes.data.data || []);
      setPendingCount((pendingRes.data.data || []).length);
      setPendingSellerCount((sellerRes.data.data || []).filter((a) => a.status === 'PENDING').length);
      setCancelRequestCount((cancelRes.data.data || []).length);
    }).catch(() => {
      setError('데이터를 불러오는 데 실패했습니다.');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-100 px-6">{error}</div>;

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">관리자 대시보드</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: '전체 회원', value: users.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: '구매자', value: roleCounts.BUYER || 0, color: 'bg-blue-50 text-blue-700' },
          { label: '판매자', value: roleCounts.SELLER || 0, color: 'bg-purple-50 text-purple-700' },
          { label: '심사 대기 굿즈', value: pendingCount, color: 'bg-yellow-50 text-yellow-700' },
          { label: '판매자 신청 대기', value: pendingSellerCount, color: 'bg-orange-50 text-orange-700' },
          { label: '주문 취소 요청', value: cancelRequestCount, color: 'bg-red-50 text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/admin/goods/pending"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          심사 대기 굿즈 ({pendingCount})
        </Link>
        <Link
          to="/admin/seller-applications"
          className="bg-orange-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          판매자 신청 관리 {pendingSellerCount > 0 && `(대기 ${pendingSellerCount})`}
        </Link>
        <Link
          to="/admin/orders/cancel-requests"
          className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
        >
          주문 취소 요청 {cancelRequestCount > 0 && `(${cancelRequestCount})`}
        </Link>
        <Link
          to="/admin/goods"
          className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          굿즈 전체 조회
        </Link>
        <Link
          to="/admin/orders"
          className="bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          전체 주문 조회
        </Link>
        <Link
          to="/admin/users"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          회원 관리
        </Link>
        <Link
          to="/admin/notices"
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          공지사항 관리
        </Link>
        <Link
          to="/admin/settlements"
          className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          정산 관리
        </Link>
      </div>

      {/* 데스크탑: 테이블 */}
      <div className="hidden sm:block bg-white rounded-xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">전체 회원 목록</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">아이디</th>
              <th className="px-4 py-3 text-left">이메일</th>
              <th className="px-4 py-3 text-center">역할</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{u.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    u.role === 'ADMIN' ? 'bg-gray-800 text-white' :
                    u.role === 'SELLER' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{u.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일: 카드 리스트 */}
      <div className="sm:hidden">
        <h2 className="font-semibold text-gray-700 mb-3">전체 회원 목록</h2>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{u.username}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                u.role === 'ADMIN' ? 'bg-gray-800 text-white' :
                u.role === 'SELLER' ? 'bg-purple-100 text-purple-700' :
                'bg-blue-100 text-blue-700'
              }`}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
