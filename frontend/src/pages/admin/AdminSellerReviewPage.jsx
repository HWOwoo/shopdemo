import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function AdminSellerReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/admin/seller-applications')
      .then((res) => {
        const found = (res.data.data || []).find((a) => a.id === parseInt(id));
        if (found) setApplication(found);
        else navigate('/admin/seller-applications');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleReview = async (approved) => {
    if (!approved && !rejectionReason.trim()) {
      setError('거절 사유를 입력해주세요.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await axiosClient.post(`/admin/seller-applications/${id}/review`, {
        approved,
        rejectionReason: approved ? undefined : rejectionReason,
      });
      navigate('/admin/seller-applications');
    } catch (err) {
      setError(err.response?.data?.message || '처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!application) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-indigo-600 mb-6 flex items-center gap-1"
      >
        ← 뒤로가기
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">판매자 신청 심사</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6 space-y-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">신청자</p>
          <p className="text-base font-semibold text-gray-800">{application.username}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">상호명</p>
            <p className="font-medium text-gray-700">{application.shopName}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">연락처</p>
            <p className="font-medium text-gray-700">{application.contactPhone}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">판매 소개</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.description}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">신청일</p>
          <p className="text-sm text-gray-600">{new Date(application.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-700 mb-4">심사 결과</h3>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            거절 사유 <span className="text-gray-400 font-normal">(거절 시 필수)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="판매자 신청 기준에 부합하지 않습니다..."
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="success"
            disabled={submitting}
            onClick={() => handleReview(true)}
            className="flex-1"
          >
            {submitting ? '처리 중...' : '승인'}
          </Button>
          <Button
            variant="danger"
            disabled={submitting}
            onClick={() => handleReview(false)}
            className="flex-1"
          >
            {submitting ? '처리 중...' : '거절'}
          </Button>
        </div>
      </div>
    </div>
  );
}
