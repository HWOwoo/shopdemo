import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../store/authStore';
import Button from '../components/ui/Button';
import Toast, { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';

const AVATAR_GRADIENTS = [
  'from-blue-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-green-400 to-teal-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-400 to-blue-500',
  'from-purple-400 to-pink-500',
  'from-teal-400 to-cyan-500',
];

function getAvatarGradient(username) {
  const hash = (username || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function getInitials(username) {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

export default function ProfileEditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, show, hide } = useToast();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosClient.get(`/users/${user.username}/profile`)
      .then((res) => setBio(res.data.data?.bio || ''))
      .finally(() => setLoading(false));
  }, [user.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosClient.put('/users/me/profile', { bio });
      show('프로필이 저장되었습니다.', 'success');
    } catch {
      show('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Toast toast={toast} onClose={hide} />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        ← 뒤로가기
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-8">프로필 편집</h1>

        {/* 아바타 미리보기 */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarGradient(user?.username)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
            {getInitials(user?.username)}
          </div>
          <p className="mt-3 text-base font-semibold text-gray-800">{user?.username}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {{ BUYER: '구매자', SELLER: '판매자', ADMIN: '관리자' }[user?.role] ?? user?.role}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              자기소개
              <span className="ml-2 text-xs text-gray-400 font-normal">{bio.length} / 500</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={5}
              placeholder="크리에이터로서 어떤 굿즈를 만드는지, 팬들에게 하고 싶은 말을 자유롭게 써주세요 ✨"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none leading-relaxed"
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? '저장 중...' : '저장하기'}
          </Button>
        </form>
      </div>
    </div>
  );
}
