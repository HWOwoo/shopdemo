import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import GoodsForm from '../../components/goods/GoodsForm';

export default function CreateGoodsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);
    try {
      await axiosClient.post('/goods', formData);
      navigate('/seller/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.data && typeof data.data === 'object') {
        setError(Object.values(data.data).join(', '));
      } else {
        setError(data?.message || '등록에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">굿즈 등록</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-8">
        <GoodsForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
