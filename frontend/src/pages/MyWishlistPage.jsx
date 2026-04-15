import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWishlist, toggleWishlist } from '../api/wishlist';
import Spinner from '../components/ui/Spinner';
import Toast, { useToast } from '../components/ui/Toast';

export default function MyWishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, show, hide } = useToast();

  const fetchWishlist = () => {
    setLoading(true);
    getMyWishlist()
      .then((data) => setItems(data || []))
      .catch(() => show('데이터를 불러오는 데 실패했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (goodsId) => {
    if (!confirm('찜 목록에서 삭제하시겠습니까?')) return;
    try {
      await toggleWishlist(goodsId);
      setItems((prev) => prev.filter((item) => item.goodsId !== goodsId));
      show('찜 목록에서 삭제되었습니다.', 'success');
    } catch {
      show('삭제에 실패했습니다.', 'error');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">내 찜 목록</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🤍</p>
          <p>아직 찜한 굿즈가 없습니다.</p>
          <Link to="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            굿즈 둘러보기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all">
              {/* 찜 삭제 버튼 */}
              <button
                onClick={() => handleRemove(item.goodsId)}
                className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm transition-colors"
                title="찜 취소"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>

              <Link to={`/goods/${item.goodsId}`}>
                {/* 이미지 */}
                <div className="h-36 sm:h-44 bg-gray-100 overflow-hidden">
                  {item.goodsImageUrl ? (
                    <img
                      src={item.goodsImageUrl}
                      alt={item.goodsName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🛍</div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <p className="text-xs text-gray-400 truncate mb-0.5">{item.sellerUsername}</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.goodsName}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-sm font-bold text-indigo-600">
                      {Number(item.price).toLocaleString()}원
                    </p>
                    {item.soldOut && (
                      <span className="text-[10px] text-red-400 font-semibold bg-red-50 px-1.5 py-0.5 rounded-full">품절</span>
                    )}
                    {item.goodsType === 'PREORDER' && (
                      <span className="text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full">수요조사</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
