import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';

export default function AdminPendingPage() {
  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/admin/goods/pending')
      .then((res) => setGoods(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">심사 대기 굿즈</h1>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : goods.length === 0 ? (
        <div className="text-center py-16 text-gray-400">심사 대기 중인 굿즈가 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">굿즈명</th>
                <th className="px-4 py-3 text-center">유형</th>
                <th className="px-4 py-3 text-right">가격</th>
                <th className="px-4 py-3 text-left">판매자</th>
                <th className="px-4 py-3 text-center">등록일</th>
                <th className="px-4 py-3 text-center">심사</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goods.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{g.name}</div>
                    {g.rightsHolderEmail && (
                      <div className="text-xs text-yellow-600 mt-0.5">저작권 이메일: {g.rightsHolderEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${g.goodsType === 'PREORDER' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {g.goodsType === 'PREORDER' ? '수요조사' : '통판'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{Number(g.price).toLocaleString()}원</td>
                  <td className="px-4 py-3 text-gray-500">{g.sellerUsername}</td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {new Date(g.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      to={`/admin/goods/${g.id}/review`}
                      className="inline-block bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      심사하기
                    </Link>
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
