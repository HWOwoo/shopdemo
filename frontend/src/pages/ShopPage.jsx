import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../store/authStore';
import { toggleWishlist } from '../api/wishlist';
import { getNoticeBanner } from '../api/notice';

const CATEGORIES = ['아크릴 스탠드', '포토카드', '포스터', '키링', '에코백', '동인지', '기타'];

const SORT_OPTIONS_SALE = [
  { key: 'latest', label: '최신순' },
  { key: 'priceAsc', label: '낮은 가격순' },
  { key: 'priceDesc', label: '높은 가격순' },
];

const SORT_OPTIONS_PREORDER = [
  { key: 'latest', label: '최신순' },
  { key: 'deadlineAsc', label: '마감 임박순' },
  { key: 'priceAsc', label: '낮은 가격순' },
  { key: 'priceDesc', label: '높은 가격순' },
];

const DEFAULT_QUICK_KEYWORDS = [
  { label: '#서코', query: '서코', color: 'from-orange-400 to-red-500' },
  { label: '#코믹월드', query: '코믹월드', color: 'from-red-400 to-rose-500' },
  { label: '#C3AFA', query: 'C3AFA', color: 'from-yellow-400 to-orange-500' },
  { label: '#블루아카이브', query: '블루아카이브', color: 'from-sky-400 to-blue-600' },
  { label: '#스텔라이브', query: '스텔라이브', color: 'from-violet-400 to-purple-600' },
  { label: '#원신', query: '원신', color: 'from-emerald-400 to-teal-500' },
  { label: '#명일방주', query: '명일방주', color: 'from-slate-500 to-gray-700' },
  { label: '#호요버스', query: '호요버스', color: 'from-indigo-400 to-violet-500' },
  { label: '#아이돌', query: '아이돌', color: 'from-pink-400 to-rose-400' },
  { label: '#뱅드림', query: '뱅드림', color: 'from-fuchsia-400 to-pink-500' },
  { label: '#프로세카', query: '프로세카', color: 'from-cyan-400 to-sky-500' },
  { label: '#우마무스메', query: '우마무스메', color: 'from-amber-400 to-yellow-500' },
];

const TAG_COLORS = [
  'from-orange-400 to-red-500',
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-500',
  'from-pink-400 to-rose-400',
  'from-fuchsia-400 to-pink-500',
  'from-cyan-400 to-sky-500',
  'from-amber-400 to-yellow-500',
  'from-indigo-400 to-violet-500',
  'from-red-400 to-rose-500',
];

// imageUrl이 있으면 실제 상품 사진을, 없으면 imageBg(그라디언트 placeholder)를 사용.
const BANNERS = [
  {
    id: 1,
    eyebrow: 'Special',
    title: "2026 Valentine's Day 한정 굿즈",
    subtitle: '스텔라들의 달~콤한 고백, 다굿즈에서 가장 먼저 만나보세요.',
    date: '2026.02.14 — 2026.03.14',
    cta: '지금 보기',
    imageUrl: null,
    imageBg: 'radial-gradient(circle at 30% 30%, #fde68a 0%, #fbcfe8 35%, #c7d2fe 80%)',
    imageEmoji: '🎁',
  },
  {
    id: 2,
    eyebrow: 'Pre-order',
    title: '위시스 발렌타인데이 신의상 MD',
    subtitle: '예약 판매 OPEN — 신청자 전원 한정 포카 증정.',
    date: '2026.02.14 — 02.28',
    cta: '신청하기',
    imageUrl: null,
    imageBg: 'radial-gradient(circle at 70% 30%, #fff1f2 0%, #fbcfe8 40%, #f43f5e 100%)',
    imageEmoji: '💖',
  },
  {
    id: 3,
    eyebrow: '신규 입점',
    title: '파스텔 5기 멤버십 키트',
    subtitle: '스텔라이브 버스, 지금 출발합니다!',
    date: '2026.02.01 OPEN',
    cta: '둘러보기',
    imageUrl: null,
    imageBg: 'radial-gradient(circle at 30% 70%, #fee2e2 0%, #fca5a5 40%, #b91c1c 100%)',
    imageEmoji: '🎫',
  },
];

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

// 굿즈 배열에서 크리에이터 목록 추출 (최근 활동 순)
function extractCreators(goods) {
  const seen = new Set();
  const creators = [];
  for (const item of goods) {
    if (!seen.has(item.sellerUsername)) {
      seen.add(item.sellerUsername);
      creators.push({ username: item.sellerUsername, sellerId: item.sellerId });
    }
  }
  return creators;
}

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
  const [goods, setGoods] = useState([]);
  const [preorderGoods, setPreorderGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preorderLoading, setPreorderLoading] = useState(true);
  const [mainTab, setMainTab] = useState('통판');
  const [activeTab, setActiveTab] = useState('홈');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [noticeBanner, setNoticeBanner] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [keywords, setKeywords] = useState(() => {
    try {
      const saved = localStorage.getItem('quickKeywords');
      return saved ? JSON.parse(saved) : DEFAULT_QUICK_KEYWORDS;
    } catch {
      return DEFAULT_QUICK_KEYWORDS;
    }
  });
  const [editingKeywords, setEditingKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const selectedCreator = searchParams.get('creator') || '';
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sort') || 'latest';

  const fetchGoods = (query, sort) => {
    setLoading(true);
    const params = new URLSearchParams({ page: '0', size: '100', type: 'SALE', sort: sort || 'latest' });
    if (query) params.set('keyword', query);
    axiosClient
      .get(`/goods?${params}`)
      .then((res) => setGoods(res.data.data?.content || []))
      .finally(() => setLoading(false));
  };

  const fetchPreorder = (query, sort) => {
    setPreorderLoading(true);
    const params = new URLSearchParams({ page: '0', size: '100', type: 'PREORDER', sort: sort || 'latest' });
    if (query) params.set('keyword', query);
    axiosClient
      .get(`/goods?${params}`)
      .then((res) => setPreorderGoods(res.data.data?.content || []))
      .finally(() => setPreorderLoading(false));
  };

  useEffect(() => { fetchGoods(searchQuery, selectedSort); }, [searchQuery, selectedSort]);
  useEffect(() => { fetchPreorder(searchQuery, selectedSort); }, [searchQuery, selectedSort]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((i) => (i + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getNoticeBanner(3)
      .then(setNoticeBanner)
      .catch(() => setNoticeBanner([]));
  }, []);

  // URL 파라미터에 따라 탭 전환
  useEffect(() => {
    if (searchQuery || selectedCreator) setMainTab('통판');
    if (selectedCreator) setActiveTab('카테고리');
    else if (!searchQuery) setActiveTab('홈');
  }, [selectedCreator, searchQuery]);

  const switchMainTab = (tab) => {
    setMainTab(tab);
    setActiveTab('홈');
    setSearchParams({});
  };

  const creators = extractCreators(goods);

  // 카테고리 필터 (클라이언트사이드)
  const categoryFiltered = selectedCategory
    ? goods.filter((item) => item.category === selectedCategory)
    : goods;

  const preorderCategoryFiltered = selectedCategory
    ? preorderGoods.filter((item) => item.category === selectedCategory)
    : preorderGoods;

  // 검색은 서버사이드에서 처리되므로 카테고리 필터 적용
  const searchFiltered = categoryFiltered;

  // 크리에이터 필터 (카테고리 탭)
  const creatorFiltered = selectedCreator
    ? categoryFiltered.filter((item) => item.sellerUsername === selectedCreator)
    : categoryFiltered;

  const prevBanner = BANNERS[(bannerIdx - 1 + BANNERS.length) % BANNERS.length];
  const currBanner = BANNERS[bannerIdx];
  const nextBanner = BANNERS[(bannerIdx + 1) % BANNERS.length];

  const saveKeywords = (updated) => {
    setKeywords(updated);
    localStorage.setItem('quickKeywords', JSON.stringify(updated));
  };

  const addKeyword = () => {
    const text = newKeyword.trim().replace(/^#/, '');
    if (!text) return;
    const label = `#${text}`;
    if (keywords.some((k) => k.label === label)) return;
    const color = TAG_COLORS[keywords.length % TAG_COLORS.length];
    saveKeywords([...keywords, { label, query: text, color }]);
    setNewKeyword('');
  };

  const removeKeyword = (label) => {
    saveKeywords(keywords.filter((k) => k.label !== label));
  };

  const resetKeywords = () => {
    saveKeywords(DEFAULT_QUICK_KEYWORDS);
  };

  const selectCreator = (username) => {
    if (selectedCreator === username) {
      setSearchParams({});
    } else {
      setSearchParams({ creator: username });
    }
  };

  return (
    <div>
      {/* ===== 공지사항 배너 ===== */}
      {noticeBanner.length > 0 && (
        <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-2 overflow-hidden">
          <span className="flex-shrink-0 text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full">📢 공지</span>
          <div className="flex-1 min-w-0 flex items-center gap-4 overflow-x-auto scrollbar-none">
            {noticeBanner.map((n) => (
              <Link
                key={n.id}
                to={`/notices/${n.id}`}
                className="text-sm text-gray-700 hover:text-indigo-700 truncate flex items-center gap-1.5 flex-shrink-0"
              >
                {n.pinned && <span className="text-[10px] font-bold text-indigo-700">[고정]</span>}
                <span className="truncate">{n.title}</span>
              </Link>
            ))}
          </div>
          <Link
            to="/notices"
            className="flex-shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 hidden sm:inline"
          >
            전체보기 →
          </Link>
        </div>
      )}

      {/* ===== 전역 배너 캐러셀 — split layout ===== */}
      <div className="flex gap-3 mb-5 items-stretch">
        {/* 이전 배너 미리보기 (데스크탑) */}
        <div className="hidden lg:block w-40 flex-shrink-0">
          <div
            className="h-52 rounded-2xl overflow-hidden opacity-50 cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center text-5xl"
            style={{ background: prevBanner.imageBg }}
            onClick={() => setBannerIdx((bannerIdx - 1 + BANNERS.length) % BANNERS.length)}
          >
            {prevBanner.imageEmoji}
          </div>
        </div>

        {/* 현재 배너 */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-40 sm:min-h-52 flex relative">
          {/* 좌측: 텍스트 */}
          <div className="flex-1 p-5 sm:p-8 flex flex-col justify-center bg-white">
            <p className="text-[10px] sm:text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">
              {currBanner.eyebrow}
            </p>
            <h2 className="text-gray-900 text-base sm:text-xl font-bold mb-2 leading-snug">
              {currBanner.title}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mb-1">{currBanner.subtitle}</p>
            <p className="text-gray-400 text-[10px] sm:text-xs mb-4">{currBanner.date}</p>
            <button className="self-start text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-full transition-colors">
              {currBanner.cta}
            </button>
            {/* 페이지 인디케이터 */}
            <div className="flex gap-1.5 mt-4">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'bg-indigo-600 w-4' : 'bg-gray-300 w-1.5'}`}
                />
              ))}
            </div>
          </div>
          {/* 우측: 이미지 슬롯 */}
          <div
            className="w-36 sm:w-52 flex-shrink-0 flex items-center justify-center text-5xl sm:text-7xl"
            style={{ background: currBanner.imageUrl ? undefined : currBanner.imageBg }}
          >
            {currBanner.imageUrl
              ? <img src={currBanner.imageUrl} alt={currBanner.title} className="w-full h-full object-cover" />
              : currBanner.imageEmoji}
          </div>
          {/* 좌/우 내비게이션 버튼 */}
          <button
            onClick={() => setBannerIdx((bannerIdx - 1 + BANNERS.length) % BANNERS.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow border border-gray-100 text-gray-500 hover:text-gray-800 text-sm flex items-center justify-center transition-colors"
          >‹</button>
          <button
            onClick={() => setBannerIdx((bannerIdx + 1) % BANNERS.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow border border-gray-100 text-gray-500 hover:text-gray-800 text-sm flex items-center justify-center transition-colors"
          >›</button>
        </div>

        {/* 다음 배너 미리보기 (데스크탑) */}
        <div className="hidden lg:block w-40 flex-shrink-0">
          <div
            className="h-52 rounded-2xl overflow-hidden opacity-50 cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center text-5xl"
            style={{ background: nextBanner.imageBg }}
            onClick={() => setBannerIdx((bannerIdx + 1) % BANNERS.length)}
          >
            {nextBanner.imageEmoji}
          </div>
        </div>
      </div>

      {/* ===== 키워드 바로가기 ===== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">바로가기</p>
          {isAuthenticated && !editingKeywords && (
            <button
              onClick={() => setEditingKeywords(true)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded border border-gray-200 hover:border-gray-400 transition-colors"
            >
              편집
            </button>
          )}
          {isAuthenticated && editingKeywords && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={resetKeywords}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={() => setEditingKeywords(false)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-0.5 rounded border border-blue-300 hover:border-blue-500 transition-colors"
              >
                완료
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.map(({ label, query, color }) => (
            <div key={label} className="relative group/tag">
              <button
                onClick={() => {
                  if (editingKeywords) return;
                  setMainTab('통판');
                  setSearchParams({ q: query });
                }}
                className={`bg-gradient-to-r ${color} text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm transition-all ${
                  editingKeywords
                    ? 'opacity-75 cursor-default pr-7'
                    : 'hover:opacity-90 hover:shadow-md active:scale-95'
                }`}
              >
                {label}
              </button>
              {editingKeywords && (
                <button
                  onClick={() => removeKeyword(label)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-700 text-white text-[10px] flex items-center justify-center hover:bg-red-500 transition-colors leading-none"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {editingKeywords && (
            <form
              onSubmit={(e) => { e.preventDefault(); addKeyword(); }}
              className="flex items-center gap-1"
            >
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="#키워드"
                className="text-xs border border-dashed border-gray-300 rounded-full px-3 py-1.5 w-24 focus:outline-none focus:border-blue-400 placeholder:text-gray-300"
              />
              <button
                type="submit"
                className="text-xs font-bold text-white bg-gray-400 hover:bg-gray-600 px-2.5 py-1.5 rounded-full transition-colors"
              >
                +
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 메인 탭: 통판 / 사전수요조사 */}
      <div className="flex gap-1 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: '통판', label: '통판', icon: '🛍' },
          { key: '사전수요조사', label: '사전수요조사', icon: '📋' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => switchMainTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              mainTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ===== 카테고리 필터 칩 + 정렬 ===== */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0">
          <button
            onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.delete('category'); return p; })}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !selectedCategory
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('category', cat); return p; })}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          value={selectedSort}
          onChange={(e) => setSearchParams((prev) => {
            const p = new URLSearchParams(prev);
            if (e.target.value === 'latest') p.delete('sort');
            else p.set('sort', e.target.value);
            return p;
          })}
          className="flex-shrink-0 text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:border-gray-400 focus:outline-none focus:border-indigo-400 cursor-pointer"
        >
          {(mainTab === '사전수요조사' ? SORT_OPTIONS_PREORDER : SORT_OPTIONS_SALE).map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 카테고리 필터 알림 */}
      {selectedCategory && !searchQuery && (
        <div className="flex items-center gap-3 mb-5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <span className="text-indigo-500">🏷️</span>
          <span className="text-sm text-indigo-700">
            <strong>{selectedCategory}</strong> 카테고리 — {mainTab === '사전수요조사' ? preorderCategoryFiltered.length : categoryFiltered.length}개
          </span>
          <button
            onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.delete('category'); return p; })}
            className="ml-auto text-xs text-indigo-400 hover:text-indigo-600"
          >
            ✕ 초기화
          </button>
        </div>
      )}

      {/* 검색 결과 알림 */}
      {searchQuery && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <span className="text-blue-500">🔍</span>
          <span className="text-sm text-blue-700">
            <strong>"{searchQuery}"</strong> 검색 결과 — {searchFiltered.length}개
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="ml-auto text-xs text-blue-400 hover:text-blue-600"
          >
            ✕ 초기화
          </button>
        </div>
      )}

      {/* ===== 사전수요조사 탭 ===== */}
      {mainTab === '사전수요조사' && (
        <PreorderTab goods={preorderCategoryFiltered} loading={preorderLoading} />
      )}

      {/* ===== 통판 탭 내부 서브탭 ===== */}
      {mainTab === '통판' && (
        <>
          {/* 서브탭 */}
          <div className="flex gap-8 border-b border-gray-200 mb-6">
            {['홈', '카테고리'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === '홈') setSearchParams({});
                }}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

      {/* ========== 홈 탭 ========== */}
      {activeTab === '홈' && !searchQuery && (
        <>
          {/* HOT 굿즈 */}
          <section className="mb-10">
            <SectionHeader title={selectedCategory ? `${selectedCategory} HOT 굿즈` : 'HOT 굿즈'} />
            {loading ? <SkeletonRow /> : categoryFiltered.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">등록된 굿즈가 없습니다.</p>
            ) : (
              <HorizontalScroll>
                {categoryFiltered.map((item) => <GoodsCard key={item.id} item={item} />)}
              </HorizontalScroll>
            )}
          </section>

          {/* 신규 굿즈 */}
          {categoryFiltered.length > 0 && (
            <section className="mb-10">
              <SectionHeader title="신규 굿즈" />
              {loading ? <SkeletonRow /> : (
                <HorizontalScroll>
                  {[...categoryFiltered].reverse().map((item) => <GoodsCard key={item.id} item={item} />)}
                </HorizontalScroll>
              )}
            </section>
          )}
        </>
      )}

      {/* ========== 검색 결과 ========== */}
      {searchQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {searchFiltered.length === 0 ? (
            <p className="col-span-full text-sm text-gray-400 py-16 text-center">
              "{searchQuery}" 검색 결과가 없습니다.
            </p>
          ) : (
            searchFiltered.map((item) => <GoodsCard key={item.id} item={item} grid />)
          )}
        </div>
      )}

      {/* ========== 카테고리 탭 (크리에이터별) ========== */}
      {activeTab === '카테고리' && !searchQuery && (
        <>
          {/* 크리에이터 칩 필터 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSearchParams({})}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !selectedCreator
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              전체
            </button>
            {creators.map((creator) => (
              <button
                key={creator.username}
                onClick={() => selectCreator(creator.username)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${
                  selectedCreator === creator.username
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${getAvatarGradient(creator.username)} flex-shrink-0`} />
                {creator.username}
              </button>
            ))}
          </div>

          {/* 크리에이터 헤더 */}
          {selectedCreator && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(selectedCreator)} flex items-center justify-center text-white font-bold`}>
                {getInitials(selectedCreator)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{selectedCreator}</p>
                <p className="text-xs text-gray-400">{creatorFiltered.length}개의 굿즈</p>
              </div>
            </div>
          )}

          {/* 굿즈 그리드 */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-44 bg-gray-200 rounded-xl mb-2" />
                  <div className="h-3 bg-gray-200 rounded mb-1 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : creatorFiltered.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">등록된 굿즈가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {creatorFiltered.map((item) => <GoodsCard key={item.id} item={item} grid />)}
            </div>
          )}
        </>
      )}

        </>
      )}
    </div>
  );
}

function PreorderTab({ goods, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-4">
            <div className="h-48 bg-gray-200 rounded-xl mb-3" />
            <div className="h-3 bg-gray-200 rounded mb-2 w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded w-full mb-3" />
            <div className="h-2 bg-gray-200 rounded-full w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (goods.length === 0) {
    return (
      <div className="py-24 text-center text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm font-medium">진행 중인 수요조사가 없습니다.</p>
        <p className="text-xs mt-1 text-gray-300">판매자가 수요조사를 등록하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      {goods.map((item) => <PreorderCard key={item.id} item={item} />)}
    </div>
  );
}

function PreorderCard({ item }) {
  const firstImage = item.options?.find((o) => o.imageUrl)?.imageUrl;
  const preview = item.options?.[0]?.shortDescription || stripHtml(item.description);
  const expired = item.preorderDeadline && new Date(item.preorderDeadline) < new Date();

  return (
    <Link to={`/goods/${item.id}`} className="group bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden block">
      <div className="h-48 bg-gray-100 overflow-hidden relative">
        {firstImage ? (
          <img src={firstImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">📋</div>
        )}
        {expired && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">마감</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getAvatarGradient(item.sellerUsername)} flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold`}>
            {getInitials(item.sellerUsername)}
          </div>
          <span className="text-xs font-semibold text-gray-600 truncate">{item.sellerUsername}</span>
          <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">수요조사</span>
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-1 truncate">{item.name}</p>
        {preview && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">{preview}</p>}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-indigo-600">{Number(item.price).toLocaleString()}원~</p>
          <div className="flex items-center gap-2 text-xs">
            {item.reviewCount > 0 && (
              <span className="text-gray-500 flex items-center gap-0.5">
                <span className="text-yellow-400">★</span>
                {item.averageRating?.toFixed(1)}
              </span>
            )}
            {item.preorderCount != null && (
              <span className="text-gray-400">{item.preorderCount}명 신청</span>
            )}
          </div>
        </div>
        {item.preorderDeadline && !expired && (
          <p className="text-[10px] text-gray-400 mt-1">
            마감: {new Date(item.preorderDeadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </Link>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">모두보기</Link>
    </div>
  );
}

function HorizontalScroll({ children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  return (
    <div className="relative group">
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
      >‹</button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
      >›</button>
    </div>
  );
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function GoodsCard({ item, grid }) {
  const firstImage = item.options?.find((o) => o.imageUrl)?.imageUrl;
  const preview = item.options?.[0]?.shortDescription || stripHtml(item.description);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      const res = await toggleWishlist(item.id);
      setWishlisted(res.wishlisted);
    } catch {
      // 조용히 실패
    }
  };

  return (
    <Link to={`/goods/${item.id}`} className={`group relative ${grid ? '' : 'flex-shrink-0 w-36 sm:w-48'}`}>
      <div className="relative h-36 sm:h-48 bg-gray-100 rounded-xl overflow-hidden mb-2 sm:mb-2.5">
        {firstImage ? (
          <img src={firstImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🛍</div>
        )}
        {/* 하트 버튼 */}
        {isAuthenticated && (
          <button
            onClick={handleWishlist}
            className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            title={wishlisted ? '찜 취소' : '찜하기'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24"
              fill={wishlisted ? '#ef4444' : 'none'}
              stroke={wishlisted ? '#ef4444' : '#9ca3af'}
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getAvatarGradient(item.sellerUsername)} flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold`}>
          {getInitials(item.sellerUsername)}
        </div>
        <span className="text-xs font-semibold text-gray-700 truncate">{item.sellerUsername}</span>
      </div>
      <p className="text-xs text-gray-500 truncate">{item.name}</p>
      {preview && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{preview}</p>}
      <div className="flex items-center justify-between mt-1.5 gap-1">
        <p className="text-xs font-bold text-blue-600">{Number(item.price).toLocaleString()}원</p>
        {item.reviewCount > 0 && (
          <span className="text-[10px] text-gray-500 flex items-center gap-0.5 flex-shrink-0">
            <span className="text-yellow-400">★</span>
            {item.averageRating?.toFixed(1)} <span className="text-gray-400">({item.reviewCount})</span>
          </span>
        )}
      </div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-36 sm:w-48 animate-pulse">
          <div className="h-36 sm:h-48 bg-gray-200 rounded-xl mb-2.5" />
          <div className="h-3 bg-gray-200 rounded mb-1.5 w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
}
