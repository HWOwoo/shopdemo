import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../store/authStore';

const today = new Date().toISOString().slice(0, 10);

const INITIAL_FORM = {
  depositorName: '',
  depositorDate: today,
  ordererName: '',
  ordererEmail: '',
  ordererPhone: '',
  recipientName: '',
  recipientPhone: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  deliveryMemo: '',
  sameAsOrderer: false,
  saveForNext: false,
  privacyAgreed: false,
};

export default function DirectPurchaseForm({ goods, quantities, options, totalPrice, onClose, onSuccess, embedded = false }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    ordererName: user?.username || '',
    ordererEmail: user?.email || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const selectedItems = (options || []).filter((opt) => (quantities[opt.id] || 0) > 0);

  // 주문자정보와 동일 처리
  useEffect(() => {
    if (form.sameAsOrderer) {
      setForm((prev) => ({
        ...prev,
        recipientName: prev.ordererName,
        recipientPhone: prev.ordererPhone,
      }));
    }
  }, [form.sameAsOrderer, form.ordererName, form.ordererPhone]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.depositorName.trim()) e.depositorName = '입금자명을 입력하세요';
    if (!form.ordererName.trim()) e.ordererName = '주문자명을 입력하세요';
    if (!form.ordererEmail.trim()) e.ordererEmail = '이메일을 입력하세요';
    if (!form.ordererPhone.trim()) e.ordererPhone = '핸드폰번호를 입력하세요';
    if (!form.recipientName.trim()) e.recipientName = '수령자명을 입력하세요';
    if (!form.recipientPhone.trim()) e.recipientPhone = '연락처를 입력하세요';
    if (!form.address.trim()) e.address = '주소를 입력하세요';
    if (!form.privacyAgreed) e.privacyAgreed = '개인정보 제공에 동의해 주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await axiosClient.post(`/goods/${goods.id}/purchase`, {
        items: selectedItems.map((opt) => ({
          optionId: opt.id,
          quantity: quantities[opt.id],
        })),
        purchaseType: 'DIRECT',
        depositorName: form.depositorName,
        depositorDate: form.depositorDate,
        ordererName: form.ordererName,
        ordererEmail: form.ordererEmail,
        ordererPhone: form.ordererPhone,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        postalCode: form.postalCode,
        address: form.address,
        addressDetail: form.addressDetail,
        deliveryMemo: form.deliveryMemo,
        totalPrice,
      });
      onSuccess?.(res.data.data);
    } catch (err) {
      onSuccess?.(err.response?.data?.message || '구매 신청에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (err) =>
    `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent ${
      err ? 'border-red-400' : 'border-gray-300'
    }`;

  return (
    <div className={embedded ? '' : 'mt-6 border border-gray-200 rounded-xl overflow-hidden'}>
      {/* 헤더 (standalone 모드만) */}
      {!embedded && (
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">직접 구매 신청</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">

        {/* 계좌 정보 */}
        <div className="border border-gray-300 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700">수동 계좌이체</p>
          <p className="text-xs text-gray-500 mt-0.5">판매자의 계좌로 직접 입금</p>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">은행</span>
              <span className="font-medium text-gray-800">{goods.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">계좌번호</span>
              <span className="font-medium text-gray-800 font-mono">{goods.bankAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">예금주</span>
              <span className="font-medium text-gray-800">{goods.bankAccountHolder}</span>
            </div>
          </div>
        </div>

        {/* 입금 정보 */}
        <section>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            - 입금 정보 (입금 하시는 분의 정보) <span className="text-red-500">*</span>
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="입금자명"
                value={form.depositorName}
                onChange={(e) => set('depositorName', e.target.value)}
                className={inputCls(errors.depositorName)}
              />
              {errors.depositorName && <p className="text-xs text-red-500 mt-0.5">{errors.depositorName}</p>}
            </div>
            <input
              type="date"
              value={form.depositorDate}
              onChange={(e) => set('depositorDate', e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        </section>

        {/* 주문금액 */}
        <section>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            - 주문금액 <span className="text-red-500">*</span>
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
            {selectedItems.map((opt) => (
              <div key={opt.id} className="flex justify-between px-4 py-2.5 border-b border-gray-100 last:border-b-0">
                <span className="text-gray-600">{opt.name} × {quantities[opt.id]}</span>
                <span className="font-medium text-gray-800">
                  {(Number(opt.price) * quantities[opt.id]).toLocaleString()}원
                </span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 border-t border-gray-100">
              <span className="text-gray-600">배송비</span>
              <span className="font-medium text-gray-800">
                {Number(goods.deliveryFee || 0) === 0
                  ? '무료'
                  : `${Number(goods.deliveryFee).toLocaleString()}원`}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5 bg-red-50 border-t border-red-100">
              <span className="text-red-600 font-semibold">총 결제금액</span>
              <span className="font-bold text-red-600">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>
        </section>

        {/* 주문자 정보 */}
        <section>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            - 주문자 정보 <span className="text-red-500">*</span>
          </p>
          <div className="flex flex-col gap-2">
            <div>
              <input
                type="text"
                placeholder="주문자명"
                value={form.ordererName}
                onChange={(e) => set('ordererName', e.target.value)}
                className={inputCls(errors.ordererName)}
              />
              {errors.ordererName && <p className="text-xs text-red-500 mt-0.5">{errors.ordererName}</p>}
            </div>
            <div>
              <input
                type="email"
                placeholder="주문자 이메일주소"
                value={form.ordererEmail}
                onChange={(e) => set('ordererEmail', e.target.value)}
                className={inputCls(errors.ordererEmail)}
              />
              {errors.ordererEmail && <p className="text-xs text-red-500 mt-0.5">{errors.ordererEmail}</p>}
            </div>
            <div>
              <input
                type="tel"
                placeholder="주문자 핸드폰번호"
                value={form.ordererPhone}
                onChange={(e) => set('ordererPhone', e.target.value)}
                className={inputCls(errors.ordererPhone)}
              />
              {errors.ordererPhone && <p className="text-xs text-red-500 mt-0.5">{errors.ordererPhone}</p>}
            </div>
          </div>
        </section>

        {/* 배송지 정보 */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-gray-700">
              - 배송지 정보 <span className="text-red-500">*</span>
            </p>
            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={form.sameAsOrderer}
                onChange={(e) => set('sameAsOrderer', e.target.checked)}
                className="w-3.5 h-3.5 accent-red-400"
              />
              주문자정보와 동일
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <input
                type="text"
                placeholder="수령자명"
                value={form.recipientName}
                onChange={(e) => set('recipientName', e.target.value)}
                className={inputCls(errors.recipientName)}
              />
              {errors.recipientName && <p className="text-xs text-red-500 mt-0.5">{errors.recipientName}</p>}
            </div>
            <div>
              <input
                type="tel"
                placeholder="연락처"
                value={form.recipientPhone}
                onChange={(e) => set('recipientPhone', e.target.value)}
                className={inputCls(errors.recipientPhone)}
              />
              {errors.recipientPhone && <p className="text-xs text-red-500 mt-0.5">{errors.recipientPhone}</p>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="우편번호"
                value={form.postalCode}
                onChange={(e) => set('postalCode', e.target.value)}
                className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                type="button"
                onClick={() => alert('우편번호 찾기 기능은 준비 중입니다.')}
                className="px-4 py-2 bg-red-400 text-white text-sm font-medium rounded hover:bg-red-500 transition-colors whitespace-nowrap"
              >
                우편번호 찾기
              </button>
            </div>
            <div>
              <input
                type="text"
                placeholder="주소"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className={inputCls(errors.address)}
              />
              {errors.address && <p className="text-xs text-red-500 mt-0.5">{errors.address}</p>}
            </div>
            <input
              type="text"
              placeholder="상세주소"
              value={form.addressDetail}
              onChange={(e) => set('addressDetail', e.target.value)}
              className={inputCls()}
            />
            <input
              type="text"
              placeholder="배송메모(선택)"
              value={form.deliveryMemo}
              onChange={(e) => set('deliveryMemo', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent placeholder-gray-400"
            />
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={form.saveForNext}
                onChange={(e) => set('saveForNext', e.target.checked)}
                className="w-3.5 h-3.5 accent-red-400"
              />
              다음에도 사용
            </label>
          </div>
        </section>

        {/* 개인정보 제공 동의 */}
        <section>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            - 개인정보 제공 동의 <span className="text-red-500">*</span>
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.privacyAgreed}
              onChange={(e) => set('privacyAgreed', e.target.checked)}
              className="w-4 h-4 accent-red-400"
            />
            <span className="text-sm text-gray-600">
              주문 시 개인정보 제공에 동의합니다{' '}
              <button
                type="button"
                onClick={() => alert('개인정보 제공 동의 내용입니다.')}
                className="text-gray-400 underline text-xs"
              >
                보기
              </button>
            </span>
          </label>
          {errors.privacyAgreed && <p className="text-xs text-red-500 mt-0.5">{errors.privacyAgreed}</p>}
        </section>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-red-400 text-white font-semibold text-sm rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '제출 중...' : '제출'}
        </button>
      </form>
    </div>
  );
}
