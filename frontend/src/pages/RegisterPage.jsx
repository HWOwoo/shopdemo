import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // 이메일 인증 상태
  const [emailSent, setEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  // 비밀번호 표시
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 약관 동의
  const [terms, setTerms] = useState({ all: false, privacy: false, service: false, marketing: false });

  const { dispatch } = useAuth();
  const navigate = useNavigate();

  const handleTermsAll = (checked) => {
    setTerms({ all: checked, privacy: checked, service: checked, marketing: checked });
  };

  const handleTerm = (key, checked) => {
    const next = { ...terms, [key]: checked };
    next.all = next.privacy && next.service && next.marketing;
    setTerms(next);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = '이름을 입력하세요';
    if (!form.email.trim()) e.email = '이메일을 입력하세요';
    if (!form.password) e.password = '비밀번호를 입력하세요';
    else if (form.password.length < 8) e.password = '8자 이상 입력해 주세요';
    if (form.password !== form.confirmPassword) e.confirmPassword = '비밀번호가 일치하지 않습니다';
    if (!terms.privacy || !terms.service) e.terms = '필수 약관에 동의해 주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendEmail = () => {
    if (!form.email.trim()) {
      setErrors((prev) => ({ ...prev, email: '이메일을 입력하세요' }));
      return;
    }
    setEmailSent(true);
    alert('인증 메일이 발송되었습니다.');
  };

  const handleVerifyCode = () => {
    if (verificationCode.trim()) {
      setEmailVerified(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/register', {
        username: form.name,
        email: form.email,
        password: form.password,
        role: 'BUYER',
      });
      dispatch({ type: 'LOGIN', payload: res.data.data });
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${hasError ? 'border-red-500' : 'border-gray-300'}`;

  return (
    <div className="max-w-md mx-auto mt-10 pb-10 px-4">
      {/* 로고 */}
      <div className="text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">다</span>
          </div>
          <span className="text-2xl font-bold text-indigo-600 tracking-tight">다굿즈</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
        <h1 className="text-xl font-bold text-gray-800 text-center mb-7">회원가입</h1>

        {serverError && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 이름 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">이름</label>
            <input
              type="text"
              placeholder="한글, 영문으로 입력해 주세요"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass(errors.name)}
              autoFocus
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
          </div>

          {/* 이메일 아이디 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">이메일 아이디</label>
              <span className="text-xs text-gray-400">인증 이메일을 받지 못하셨나요? ⓘ</span>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="이메일을 입력해 주세요"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`flex-1 border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
              <button
                type="button"
                onClick={handleSendEmail}
                className="shrink-0 px-3 py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                인증 메일 재발송
              </button>
            </div>
            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
            {emailSent && !emailVerified && (
              <button
                type="button"
                onClick={() => { setEmailSent(false); setEmailVerified(false); setVerificationCode(''); }}
                className="text-xs text-indigo-600 text-left hover:underline w-fit"
              >
                다른 이메일로 인증할래요
              </button>
            )}
          </div>

          {/* 인증 코드 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">인증 코드</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="인증 코드를 입력해 주세요"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={emailVerified}
                className={`flex-1 border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${emailVerified ? 'bg-gray-50 border-gray-200 text-gray-400' : 'border-gray-300'}`}
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={emailVerified}
                className="shrink-0 px-4 py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                인증하기
              </button>
            </div>
            {emailVerified && (
              <span className="text-xs text-indigo-600">인증이 완료되었습니다.</span>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력해주세요"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputClass(errors.password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password ? (
              <span className="text-xs text-red-500">{errors.password}</span>
            ) : (
              <span className="text-xs text-gray-400">✓ 8자 이상 &nbsp;/&nbsp; 영문, 숫자 &nbsp;/&nbsp; 특수문자 포함</span>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">비밀번호 확인</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력해 주세요"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={`${inputClass(errors.confirmPassword)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-red-500">{errors.confirmPassword}</span>
            )}
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gray-100" />

          {/* 약관 동의 */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={terms.all}
                onChange={(e) => handleTermsAll(e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-700">전체 동의하기</span>
            </label>
            <div className="h-px bg-gray-100" />
            {[
              { key: 'privacy', label: '개인정보 수집 및 이용 동의(필수)' },
              { key: 'service', label: '서비스 이용약관(필수)' },
              { key: 'marketing', label: '마케팅 수신 동의(선택)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms[key]}
                  onChange={(e) => handleTerm(key, e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="flex-1 text-sm text-gray-600">{label}</span>
                <span className="text-gray-400">›</span>
              </label>
            ))}
            {errors.terms && <span className="text-xs text-red-500">{errors.terms}</span>}
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
