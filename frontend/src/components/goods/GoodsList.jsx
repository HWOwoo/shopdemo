import GoodsCard from './GoodsCard';

export default function GoodsList({ goods }) {
  if (!goods || goods.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        등록된 굿즈가 없습니다.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {goods.map((g) => (
        <GoodsCard key={g.id} goods={g} />
      ))}
    </div>
  );
}
