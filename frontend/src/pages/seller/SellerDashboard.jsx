import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/goods/StatusBadge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [application, setApplication] = useState(null);
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const fetchGoods = () => {
    setLoading(true);
    setFetchError('');
    axiosClient.get('/goods/my')
      .then((res) => setGoods(res.data.data || []))
      .catch((err) => setFetchError(err.response?.data?.message || '상품 목록을 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoods();
    axiosClient.get('/seller/apply/me')
      .then((res) => setApplication(res.data.data || null))
      .catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!await confirm('삭제하시겠습니까?')) return;
    try {
      await axiosClient.delete(`/goods/my/${id}`);
      show('상품이 삭제되었습니다.', 'success');
      fetchGoods();
    } catch (err) {
      show(err.response?.data?.message || '삭제에 실패했습니다.', 'error');
    }
  };

  const handleClose = async (id) => {
    if (!await confirm('판매를 종료하시겠습니까?', '종료 후에는 되돌릴 수 없습니다.')) return;
    try {
      await axiosClient.put(`/goods/my/${id}/close`);
      show('판매가 종료되었습니다.', 'success');
      fetchGoods();
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  const handleToggleSoldOut = async (id, currentlySoldOut) => {
    const msg = currentlySoldOut ? '품절 해제하시겠습니까?' : '품절 처리하시겠습니까?';
    if (!await confirm(msg)) return;
    try {
      await axiosClient.put(`/goods/my/${id}/soldout`);
      show(currentlySoldOut ? '품절이 해제되었습니다.' : '품절 처리되었습니다.', 'success');
      fetchGoods();
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  const handleConfirmPreorder = async (id) => {
    if (!await confirm('생산을 확정하시겠습니까?', '수요조사가 통판으로 전환되며, 신청자에게 알림이 발송됩니다.')) return;
    try {
      await axiosClient.post(`/goods/my/${id}/preorder-confirm`);
      show('생산이 확정되었습니다. 신청자에게 알림이 발송되었습니다.', 'success');
      fetchGoods();
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      {/* 판매자 승인 상태 배너 */}
      {application && application.status === 'PENDING' && (
        <div className="mb-5 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-800">
          <span className="text-xl leading-none mt-0.5">⏳</span>
          <div>
            <p className="font-semibold">판매자 계정 승인 대기 중</p>
            <p className="text-yellow-700 mt-0.5">
              상품 등록은 가능하지만 등록한 상품은 <strong>관리자 승인 후</strong> 공개적으로 노출됩니다.
            </p>
          </div>
        </div>
      )}
      {application && application.status === 'APPROVED' && (
        <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800">
          <span className="text-xl leading-none mt-0.5">✅</span>
          <div>
            <p className="font-semibold">판매자 계정 승인 완료</p>
            <p className="text-green-700 mt-0.5">등록한 상품이 공개적으로 노출되고 있습니다.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">판매자 대시보드</h1>
        <div className="flex gap-2">
          <Link to="/seller/orders">
            <Button variant="outline" size="sm" className="sm:text-sm">📦 주문 관리</Button>
          </Link>
          <Link to="/seller/goods/new">
            <Button size="sm" className="sm:text-sm">+ 상품 등록</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : fetchError ? (
        <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-100 px-6">
          {fetchError}
        </div>
      ) : goods.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          등록한 상품이 없습니다.{' '}
          <Link to="/seller/goods/new" className="text-indigo-600 hover:underline">상품 등록하기</Link>
        </div>
      ) : (
        <>
        {/* 데스크탑: 테이블 */}
        <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">상품명</th>
                <th className="px-4 py-3 text-center">유형</th>
                <th className="px-4 py-3 text-right">가격</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-center">저작권</th>
                <th className="px-4 py-3 text-center">등록일</th>
                <th className="px-4 py-3 text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goods.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{g.name}</div>
                    {g.status === 'REJECTED' && g.rejectionReason && (
                      <div className="mt-1 text-xs text-red-500 flex items-start gap-1">
                        <span className="flex-shrink-0 font-medium">거절 사유:</span>
                        <span className="truncate max-w-48" title={g.rejectionReason}>{g.rejectionReason}</span>
                      </div>
                    )}
                    {application?.status === 'PENDING' && g.status === 'APPROVED' && (
                      <div className="mt-1 text-xs text-yellow-500">판매자 계정 승인 대기 중</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${g.goodsType === 'PREORDER' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {g.goodsType === 'PREORDER' ? '수요조사' : '통판'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{Number(g.price).toLocaleString()}원</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={g.status} /></td>
                  <td className="px-4 py-3 text-center text-gray-500">{g.requiresCopyrightPermission ? '필요' : '불필요'}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{new Date(g.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <Button size="sm" onClick={() => navigate(`/seller/goods/${g.id}`)}>
                        보기
                      </Button>
                      {g.goodsType === 'PREORDER' && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/seller/preorders/${g.id}`)}>
                          집계 보기 {(g.preorderCount ?? 0) > 0 && <span className="text-indigo-600 font-semibold ml-1">{g.preorderCount}명</span>}
                        </Button>
                      )}
                      {g.goodsType === 'PREORDER' && g.status === 'CLOSED' && (
                        <Button size="sm" variant="secondary" onClick={() => handleConfirmPreorder(g.id)}>
                          생산 확정
                        </Button>
                      )}
                      {g.goodsType !== 'PREORDER' && g.status === 'APPROVED' && (
                        <Button size="sm" variant="secondary" onClick={() => handleToggleSoldOut(g.id, false)}>
                          품절 처리
                        </Button>
                      )}
                      {g.status === 'SOLDOUT' && (
                        <Button size="sm" variant="secondary" onClick={() => handleToggleSoldOut(g.id, true)}>
                          품절 해제
                        </Button>
                      )}
                      {(g.status === 'APPROVED' || g.status === 'SOLDOUT') && (
                        <Button size="sm" variant="danger" onClick={() => handleClose(g.id)}>
                          판매 종료
                        </Button>
                      )}
                      {g.status !== 'APPROVED' && g.status !== 'SOLDOUT' && g.status !== 'CLOSED' && (
                        <Button size="sm" variant="danger" onClick={() => handleDelete(g.id)}>
                          삭제
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일: 카드 리스트 */}
        <div className="md:hidden flex flex-col gap-3">
          {goods.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{g.name}</p>
                  {g.status === 'REJECTED' && g.rejectionReason && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">거절: {g.rejectionReason}</p>
                  )}
                </div>
                <StatusBadge status={g.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className={`px-2 py-0.5 rounded-full font-medium ${g.goodsType === 'PREORDER' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {g.goodsType === 'PREORDER' ? '수요조사' : '통판'}
                </span>
                <span className="font-semibold text-gray-700">{Number(g.price).toLocaleString()}원</span>
                <span className="text-gray-400">{new Date(g.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Button size="sm" onClick={() => navigate(`/seller/goods/${g.id}`)}>보기</Button>
                {g.goodsType === 'PREORDER' && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/seller/preorders/${g.id}`)}>
                    집계 보기 {(g.preorderCount ?? 0) > 0 && <span className="text-indigo-600 font-semibold ml-1">{g.preorderCount}명</span>}
                  </Button>
                )}
                {g.goodsType === 'PREORDER' && g.status === 'CLOSED' && (
                  <Button size="sm" variant="secondary" onClick={() => handleConfirmPreorder(g.id)}>생산 확정</Button>
                )}
                {g.goodsType !== 'PREORDER' && g.status === 'APPROVED' && (
                  <Button size="sm" variant="secondary" onClick={() => handleToggleSoldOut(g.id, false)}>품절</Button>
                )}
                {g.status === 'SOLDOUT' && (
                  <Button size="sm" variant="secondary" onClick={() => handleToggleSoldOut(g.id, true)}>품절 해제</Button>
                )}
                {(g.status === 'APPROVED' || g.status === 'SOLDOUT') && (
                  <Button size="sm" variant="danger" onClick={() => handleClose(g.id)}>종료</Button>
                )}
                {g.status !== 'APPROVED' && g.status !== 'SOLDOUT' && g.status !== 'CLOSED' && (
                  <Button size="sm" variant="danger" onClick={() => handleDelete(g.id)}>삭제</Button>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
