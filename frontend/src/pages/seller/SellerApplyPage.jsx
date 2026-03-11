import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const STATUS_INFO = {
  PENDING: {
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    icon: '⏳',
    title: '승인 심사 중',
    message: '판매자 계정 승인을 기다리는 중입니다. 승인 전에도 상품을 등록할 수 있지만, 공개 노출은 승인 후 활성화됩니다.',
  },
  APPROVED: {
    color: 'bg-green-50 border-green-200 text-green-700',
    icon: '✅',
    title: '승인 완료',
    message: '판매자 계정이 승인되었습니다! 등록한 상품이 공개적으로 노출됩니다.',
  },
  REJECTED: {
    color: 'bg-red-50 border-red-200 text-red-700',
    icon: '❌',
    title: '신청 거절',
    message: '판매자 신청이 거절되었습니다.',
  },
};

export default function SellerApplyPage() {
  const { user, dispatch } = useAuth();
  const navigate = useNavigate();

  // 이미 SELLER면 신청 현황을 조회해서 보여줌
  const [application, setApplication] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(user?.role === 'SELLER');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ shopName: '', description: '', contactPhone: '' });

  useEffect(() => {
    if (user?.role === 'SELLER') {
      axiosClient.get('/seller/apply/me')
        .then((res) => setApplication(res.data.data || null))
        .catch(() => {})
        .finally(() => setLoadingStatus(false));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await axiosClient.post('/seller/apply', form);
      // 새 JWT(SELLER 권한)로 auth store 업데이트
      dispatch({ type: 'LOGIN', payload: res.data.data });
      navigate('/seller/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.data && typeof data.data === 'object') {
        setError(Object.values(data.data).join(', '));
      } else {
        setError(data?.message || '신청에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 이미 SELLER인 경우 → 신청 현황 표시
  if (user?.role === 'SELLER') {
    if (loadingStatus) {
      return <div className="flex justify-center py-12"><Spinner /></div>;
    }
    const info = application ? STATUS_INFO[application.status] : null;
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">판매자 신청 현황</h1>
        {info && (
          <div className={`border rounded-xl p-5 mb-4 ${info.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{info.icon}</span>
              <span className="font-semibold">{info.title}</span>
            </div>
            <p className="text-sm mt-1">{info.message}</p>
            {application.status === 'REJECTED' && application.rejectionReason && (
              <div className="mt-3 bg-white/60 rounded-lg p-3 text-sm">
                <span className="font-medium">거절 사유: </span>
                {application.rejectionReason}
              </div>
            )}
          </div>
        )}
        {application && (
          <div className="bg-white rounded-xl shadow-md p-6 text-sm text-gray-600 space-y-3">
            <h2 className="font-semibold text-gray-800 text-base mb-4">신청 정보</h2>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400">상호명</span>
              <span className="font-medium text-gray-700">{application.shopName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400">연락처</span>
              <span className="font-medium text-gray-700">{application.contactPhone}</span>
            </div>
            <div className="pb-2">
              <span className="text-gray-400 block mb-1">판매 소개</span>
              <span className="text-gray-700">{application.description}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-400">신청일</span>
              <span className="text-gray-500">{new Date(application.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // BUYER인 경우 → 신청 폼
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">판매자 등록 신청</h1>
      <p className="text-sm text-gray-500 mb-6">
        신청 즉시 대시보드와 상품 등록이 활성화됩니다.
        단, 등록한 상품은 관리자 승인 후 공개적으로 노출됩니다.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="상호명"
            placeholder="판매할 스토어 이름을 입력하세요"
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            required
            minLength={2}
            maxLength={50}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">판매 소개</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
              placeholder="어떤 상품을 판매할 계획인지 소개해 주세요"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              maxLength={500}
            />
            <span className="text-xs text-gray-400 text-right">{form.description.length}/500</span>
          </div>

          <Input
            label="연락처"
            placeholder="010-0000-0000"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            required
            maxLength={20}
          />

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? '처리 중...' : '신청하고 바로 시작하기'}
          </Button>
        </form>
      </div>
    </div>
  );
}
