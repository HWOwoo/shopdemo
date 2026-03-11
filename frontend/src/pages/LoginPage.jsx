import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const SOCIAL_PROVIDERS = [
  {
    key: 'kakao',
    label: '카카오로 계속하기',
    emoji: '💛',
    bg: 'bg-[#FEE500] hover:bg-[#F0D800]',
    text: 'text-[#3C1E1E]',
    border: '',
  },
  {
    key: 'naver',
    label: '네이버로 계속하기',
    emoji: '🟢',
    bg: 'bg-[#03C75A] hover:bg-[#02B350]',
    text: 'text-white',
    border: '',
  },
  {
    key: 'google',
    label: 'Google로 계속하기',
    emoji: '🔵',
    bg: 'bg-white hover:bg-gray-50',
    text: 'text-gray-700',
    border: 'border border-gray-300',
  },
];

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { dispatch } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/login', form);
      dispatch({ type: 'LOGIN', payload: res.data.data });
      const role = res.data.data.role;
      if (role === 'SELLER') navigate('/seller/dashboard');
      else if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      {/* 로고 */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">다</span>
          </div>
          <span className="text-2xl font-bold text-indigo-600 tracking-tight">다굿즈</span>
        </Link>
        <p className="text-sm text-gray-500">크리에이터와 팬을 잇는 굿즈 플랫폼</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">로그인</h1>

        {/* 소셜 로그인 */}
        <div className="flex flex-col gap-2.5 mb-6">
          {SOCIAL_PROVIDERS.map(({ key, label, emoji, bg, text, border }) => (
            <button
              key={key}
              type="button"
              onClick={() => alert(`${label} 기능은 준비 중입니다.`)}
              className={`w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${bg} ${text} ${border}`}
            >
              <span className="text-base leading-none">{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">또는 아이디로 로그인</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <span className="flex-shrink-0">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="아이디"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            autoFocus
          />
          <Input
            label="비밀번호"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
