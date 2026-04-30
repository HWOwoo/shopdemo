import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';

const STATUS_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING', label: '심사 대기' },
  { key: 'APPROVED', label: '판매 중' },
  { key: 'CLOSED', label: '마감' },
  { key: 'SOLDOUT', label: '품절' },
  { key: 'REJECTED', label: '반려' },
];

const STATUS_STYLES = {
  PENDING: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-yellow-100 text-yellow-700',
  SOLDOUT: 'bg-orange-100 text-orange-700',
  REJECTED: 'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  PENDING: '심사 대기',
  APPROVED: '판매 중',
  CLOSED: '마감',
  SOLDOUT: '품절',
  REJECTED: '반려',
};

export default function AdminGoodsPage() {
  const navigate = useNavigate();
  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const { toast, show, hide } = useToast();

  const fetchGoods = (currentStatus, q) => {
    setLoading(true);
    const params = {};
    if (currentStatus !== 'ALL') params.status = currentStatus;
    if (q && q.trim()) params.q = q.trim();
    axiosClient.get('/admin/goods', { params })
      .then((res) => setGoods(res.data.data || []))
      .catch(() => show('목록을 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGoods(status, ''); setSearch(''); }, [status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGoods(status, search);
  };

  return (
    <div>
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">전체 굿즈 조회</h1>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              status === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품명 / 판매자 / 카테고리 / 태그 검색 (Enter)"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchGoods(status, ''); }}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : goods.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          조회된 굿즈가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">굿즈명</th>
                <th className="px-4 py-3 text-center">유형</th>
                <th className="px-4 py-3 text-left">판매자</th>
                <th className="px-4 py-3 text-left">카테고리</th>
                <th className="px-4 py-3 text-right">가격</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-center">등록일</th>
                <th className="px-4 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goods.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/goods/${g.id}/review`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 max-w-xs truncate">{g.name}</div>
                    {g.rejectionReason && (
                      <div className="text-xs text-red-500 mt-0.5 truncate max-w-xs">반려: {g.rejectionReason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${g.goodsType === 'PREORDER' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {g.goodsType === 'PREORDER' ? '수요조사' : '통판'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{g.sellerUsername}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{g.category || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {Number(g.price).toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[g.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[g.status] || g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {new Date(g.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-indigo-600 text-xs font-medium">
                      {g.status === 'PENDING' ? '심사하기 →' : '상세 →'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">{goods.length}건 표시 중</p>
    </div>
  );
}
