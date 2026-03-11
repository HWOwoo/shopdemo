import { Link } from 'react-router-dom';

export default function GoodsCard({ goods }) {
  const isFreeDelivery = Number(goods.deliveryFee) === 0;
  const hasMultipleOptions = goods.options && goods.options.length > 1;
  const firstImage = goods.options?.find((o) => o.imageUrl)?.imageUrl;

  return (
    <Link
      to={`/goods/${goods.id}`}
      className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="bg-gray-100 h-48 flex items-center justify-center relative overflow-hidden">
        {firstImage ? (
          <img src={firstImage} alt={goods.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">이미지 없음</span>
        )}
        {isFreeDelivery && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            무료배송
          </span>
        )}
        {goods.soldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-sm">품절</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{goods.name}</h3>
        {goods.options?.[0]?.shortDescription && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{goods.options[0].shortDescription}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-indigo-600 font-bold">
              {hasMultipleOptions && <span className="text-xs font-normal mr-0.5">최저</span>}
              {Number(goods.price).toLocaleString()}원
            </span>
            {!isFreeDelivery && (
              <span className="ml-1.5 text-xs text-gray-400">
                + 배송 {Number(goods.deliveryFee).toLocaleString()}원
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{goods.sellerUsername}</span>
        </div>
      </div>
    </Link>
  );
}
