import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="text-8xl font-black text-gray-100 mb-2 select-none leading-none">403</div>
      <div className="text-4xl mb-5">🔒</div>
      <h1 className="text-xl font-bold text-gray-700 mb-2">접근 권한이 없어요</h1>
      <p className="text-sm text-gray-400 mb-8">이 페이지에 접근할 수 있는 권한이 없습니다.</p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
