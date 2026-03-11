import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosClient.get('/admin/users'),
      axiosClient.get('/admin/goods/pending'),
    ]).then(([usersRes, pendingRes]) => {
      setUsers(usersRes.data.data || []);
      setPendingCount((pendingRes.data.data || []).length);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">관리자 대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체 회원', value: users.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: '구매자', value: roleCounts.BUYER || 0, color: 'bg-blue-50 text-blue-700' },
          { label: '판매자', value: roleCounts.SELLER || 0, color: 'bg-purple-50 text-purple-700' },
          { label: '심사 대기 굿즈', value: pendingCount, color: 'bg-yellow-50 text-yellow-700' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <Link
          to="/admin/goods/pending"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          심사 대기 목록 보기 ({pendingCount})
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
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
    </div>
  );
}
