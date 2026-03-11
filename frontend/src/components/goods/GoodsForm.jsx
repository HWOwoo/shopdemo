import { useRef, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RichEditor from '../ui/RichEditor';
import axiosClient from '../../api/axiosClient';

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'IBK기업은행',
  '농협은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고',
  '우체국', '수협은행', 'SC제일은행', '씨티은행', '광주은행',
  '전북은행', '제주은행', '경남은행', '대구은행', '부산은행',
];

const emptyItem = () => ({ name: '', shortDescription: '', price: '', stock: '', imageUrl: '', uploading: false });

/* 물품 이미지 업로드 버튼 */
function ItemImageUpload({ imageUrl, uploading, onChange }) {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ uploading: true });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosClient.post('/upload/image', fd, {
        headers: { 'Content-Type': undefined },
      });
      onChange({ imageUrl: res.data.data, uploading: false });
    } catch {
      alert('이미지 업로드에 실패했습니다.');
      onChange({ uploading: false });
    }
    e.target.value = '';
  };

  return (
    <div className="flex-shrink-0">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 flex items-center justify-center overflow-hidden bg-white transition-colors group"
        title="물품 사진 등록"
      >
        {uploading ? (
          <span className="text-xs text-gray-400 animate-pulse">업로드 중...</span>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt="물품" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">변경</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300 group-hover:text-indigo-400 transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium">사진 등록</span>
          </div>
        )}
      </button>
    </div>
  );
}

export default function GoodsForm({ onSubmit, loading, initialData, submitLabel }) {
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        goodsType: initialData.goodsType || 'SALE',
        name: initialData.name || '',
        description: initialData.description || '',
        items: (initialData.options || []).map((o) => ({
          name: o.name || '',
          shortDescription: o.shortDescription || '',
          price: o.price != null ? String(o.price) : '',
          stock: o.stock != null ? String(o.stock) : '',
          imageUrl: o.imageUrl || '',
          uploading: false,
        })),
        deliveryFee: initialData.deliveryFee != null ? String(initialData.deliveryFee) : '0',
        paymentType: initialData.paymentType || 'BANK_TRANSFER',
        bankName: initialData.bankName || '',
        bankAccount: initialData.bankAccount || '',
        bankAccountHolder: initialData.bankAccountHolder || '',
        requiresCopyrightPermission: initialData.requiresCopyrightPermission || false,
        rightsHolderEmail: initialData.rightsHolderEmail || '',
      };
    }
    return {
      goodsType: 'SALE',
      name: '',
      description: '',
      items: [emptyItem()],
      deliveryFee: '0',
      paymentType: 'BANK_TRANSFER',
      bankName: '',
      bankAccount: '',
      bankAccountHolder: '',
      requiresCopyrightPermission: false,
      rightsHolderEmail: '',
    };
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  /* 물품 조작 */
  const setItem = (idx, patch) =>
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, items };
    });

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (idx) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      alert('판매 물품을 최소 1개 이상 추가해주세요.');
      return;
    }
    onSubmit({
      goodsType: form.goodsType,
      name: form.name,
      description: form.description,
      options: form.items.map((it) => ({
        name: it.name,
        shortDescription: it.shortDescription || null,
        price: parseFloat(it.price),
        stock: it.stock !== '' ? parseInt(it.stock, 10) : null,
        imageUrl: it.imageUrl || null,
      })),
      deliveryFee: parseFloat(form.deliveryFee || '0'),
      paymentType: form.paymentType,
      rightsHolderEmail: form.requiresCopyrightPermission ? form.rightsHolderEmail : undefined,
      requiresCopyrightPermission: form.requiresCopyrightPermission,
      bankName: form.paymentType === 'BANK_TRANSFER' ? form.bankName : undefined,
      bankAccount: form.paymentType === 'BANK_TRANSFER' ? form.bankAccount : undefined,
      bankAccountHolder: form.paymentType === 'BANK_TRANSFER' ? form.bankAccountHolder : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

      {/* ── 판매 유형 ── */}
      <section className="flex flex-col gap-3">
        <SectionTitle>판매 유형</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { type: 'SALE', icon: '🛍', label: '통판', desc: '즉시 구매 가능한 통신판매' },
            { type: 'PREORDER', icon: '📋', label: '사전수요조사', desc: '생산 전 수요를 먼저 파악' },
          ].map(({ type, icon, label, desc }) => (
            <button
              key={type}
              type="button"
              onClick={() => set('goodsType', type)}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                form.goodsType === type
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-sm font-semibold ${form.goodsType === type ? 'text-indigo-700' : 'text-gray-700'}`}>
                {label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── 기본 정보 ── */}
      <section className="flex flex-col gap-4">
        <SectionTitle>기본 정보</SectionTitle>

        <Input
          label="상품명 *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
          maxLength={200}
          placeholder="상품 이름을 입력하세요"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">상품 설명</label>
          <RichEditor
            value={form.description}
            onChange={(html) => set('description', html)}
            placeholder="상품 설명, 사이즈, 소재, 배송 안내 등을 자유롭게 입력하세요"
          />
        </div>
      </section>

      {/* ── 판매 물품 ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SectionTitle>판매 물품 *</SectionTitle>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
          >
            <span className="text-lg leading-none">+</span> 물품 추가
          </button>
        </div>

        {form.items.length === 0 && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
            판매 물품을 최소 1개 이상 추가해주세요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {form.items.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 group"
            >
              {/* 이미지 업로드 */}
              <ItemImageUpload
                imageUrl={item.imageUrl}
                uploading={item.uploading}
                onChange={(patch) => setItem(idx, patch)}
              />

              {/* 필드들 */}
              <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                {/* 물품명 */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => setItem(idx, { name: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="물품명 (예: 소형, 빨강, M 사이즈)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />

                {/* 한줄 설명 */}
                <input
                  type="text"
                  value={item.shortDescription}
                  onChange={(e) => setItem(idx, { shortDescription: e.target.value })}
                  maxLength={200}
                  placeholder="한줄 설명 (선택)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                />

                {/* 가격 / 재고 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">가격 (원) *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.price}
                      onChange={(e) => setItem(idx, { price: e.target.value })}
                      required
                      placeholder="10000"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">재고</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.stock}
                      onChange={(e) => setItem(idx, { stock: e.target.value })}
                      placeholder="미입력 = 제한없음"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={form.items.length === 1}
                className="self-start mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                title="물품 삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-1">재고를 비워두면 수량 제한 없이 판매됩니다.</p>
      </section>

      {/* ── 배송비 + 결제 수단 (2열 반응형) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* 배송비 */}
        <section className="flex flex-col gap-3">
          <SectionTitle>배송</SectionTitle>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">배송비 (원)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="100"
                value={form.deliveryFee}
                onChange={(e) => set('deliveryFee', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="3000"
              />
              <button
                type="button"
                onClick={() => set('deliveryFee', '0')}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                  form.deliveryFee === '0'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                무료배송
              </button>
            </div>
          </div>
        </section>

        {/* 결제 수단 */}
        <section className="flex flex-col gap-3">
          <SectionTitle>결제 수단</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'BANK_TRANSFER', icon: '🏦', label: '계좌이체', desc: '구매자 직접 입금', available: true },
              { type: 'PLATFORM', icon: '💳', label: '플랫폼 결제', desc: '중개가입 후 이용', available: false },
            ].map(({ type, icon, label, desc, available }) => (
              <button
                key={type}
                type="button"
                disabled={!available}
                onClick={() => available && set('paymentType', type)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  form.paymentType === type
                    ? 'border-indigo-600 bg-indigo-50'
                    : available
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-lg mb-0.5">{icon}</div>
                <div className={`text-xs font-semibold ${form.paymentType === type ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {label}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
                {!available && (
                  <span className="inline-block mt-1 text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                    준비 중
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 계좌이체 정보 */}
      {form.paymentType === 'BANK_TRANSFER' && (
        <div className="flex flex-col gap-3 p-5 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">구매자에게 노출되는 입금 계좌 정보입니다.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">은행명 *</label>
              <select
                value={form.bankName}
                onChange={(e) => set('bankName', e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">은행 선택</option>
                {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">계좌번호 *</label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) => set('bankAccount', e.target.value)}
                required
                placeholder="000-0000-0000-00"
                maxLength={30}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">예금주 *</label>
              <input
                type="text"
                value={form.bankAccountHolder}
                onChange={(e) => set('bankAccountHolder', e.target.value)}
                required
                placeholder="홍길동"
                maxLength={20}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 저작권 ── */}
      <section className="flex flex-col gap-3">
        <SectionTitle>저작권</SectionTitle>

        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <input
            id="copyright"
            type="checkbox"
            checked={form.requiresCopyrightPermission}
            onChange={(e) => set('requiresCopyrightPermission', e.target.checked)}
            className="w-4 h-4 text-indigo-600 cursor-pointer"
          />
          <label htmlFor="copyright" className="text-sm text-yellow-800 cursor-pointer">
            이 상품은 원작자의 저작권 허가가 필요합니다
          </label>
        </div>

        {form.requiresCopyrightPermission && (
          <>
            <Input
              label="원작자 이메일 *"
              type="email"
              value={form.rightsHolderEmail}
              onChange={(e) => set('rightsHolderEmail', e.target.value)}
              required
              placeholder="author@example.com"
            />
            <p className="text-xs text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              등록 즉시 원작자에게 허가 요청 이메일이 발송됩니다. 관리자 검토 후 승인 시 공개됩니다.
            </p>
          </>
        )}
      </section>

      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? '처리 중...' : (submitLabel || '상품 등록')}
      </Button>
    </form>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
      {children}
    </h2>
  );
}
