import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import GoodsForm from '../../components/goods/GoodsForm';
import Spinner from '../../components/ui/Spinner';

export default function EditGoodsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goods, setGoods] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get(`/goods/my/${id}`)
      .then((res) => setGoods(res.data.data))
      .catch(() => navigate('/seller/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    setError('');
    setSubmitting(true);
    try {
      await axiosClient.put(`/goods/my/${id}`, formData);
      navigate(`/seller/goods/${id}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.data && typeof data.data === 'object') {
        setError(Object.values(data.data).join(', '));
      } else {
        setError(data?.message || '수정에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!goods) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(`/seller/goods/${id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors mb-6"
      >
        ← 돌아가기
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">상품 수정</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-8">
        <GoodsForm
          onSubmit={handleSubmit}
          loading={submitting}
          initialData={goods}
          submitLabel="수정 완료"
        />
      </div>
    </div>
  );
}
