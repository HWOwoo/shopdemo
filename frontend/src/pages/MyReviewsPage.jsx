import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from '../components/ui/Spinner';
import Toast, { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/ConfirmModal';

function Stars({ rating, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange?.(v)}
          className={`text-lg transition-colors ${
            v <= rating ? 'text-yellow-400' : 'text-gray-200'
          } ${onChange ? 'cursor-pointer hover:text-yellow-300' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarsReadOnly({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <span key={v} className={`text-sm ${v <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editContent, setEditContent] = useState(review.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onEdit(review.id, { rating: editRating, content: editContent });
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-4">
        {/* 상품 이미지 */}
        <Link to={`/goods/${review.goodsId}`} className="flex-shrink-0">
          {review.goodsImageUrl ? (
            <img
              src={review.goodsImageUrl}
              alt={review.goodsName}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
              🎁
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/goods/${review.goodsId}`}
            className="text-sm font-semibold text-gray-800 hover:text-indigo-600 truncate block"
          >
            {review.goodsName}
          </Link>

          {editing ? (
            <div className="mt-2 space-y-3">
              <Stars rating={editRating} onChange={setEditRating} />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="리뷰 내용을 작성해주세요"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mt-1">
                <StarsReadOnly rating={review.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {review.content && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.content}</p>
              )}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-400 hover:text-indigo-600"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(review.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WriteReviewModal({ goods, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ goodsId: goods.goodsId, rating, content });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">리뷰 작성</h2>

        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
          {goods.goodsImageUrl ? (
            <img src={goods.goodsImageUrl} alt={goods.goodsName} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xl">🎁</div>
          )}
          <p className="text-sm font-semibold text-gray-700 truncate">{goods.goodsName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">평점</label>
            <Stars rating={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              리뷰 내용
              <span className="ml-2 text-xs text-gray-400 font-normal">{content.length} / 500</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="상품에 대한 솔직한 리뷰를 남겨주세요"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [reviewable, setReviewable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [writeTarget, setWriteTarget] = useState(null);
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const fetchData = async () => {
    try {
      const [revRes, reviewableRes] = await Promise.all([
        axiosClient.get('/reviews/my'),
        axiosClient.get('/reviews/reviewable'),
      ]);
      setReviews(revRes.data.data || []);
      setReviewable(reviewableRes.data.data || []);
    } catch {
      show('데이터를 불러오는 데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (req) => {
    try {
      await axiosClient.post('/reviews', req);
      show('리뷰가 등록되었습니다.', 'success');
      setWriteTarget(null);
      fetchData();
    } catch (err) {
      show(err.response?.data?.message || '리뷰 등록에 실패했습니다.', 'error');
    }
  };

  const handleEdit = async (id, req) => {
    try {
      await axiosClient.put(`/reviews/${id}`, req);
      show('리뷰가 수정되었습니다.', 'success');
      fetchData();
    } catch {
      show('수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!await confirm('리뷰를 삭제하시겠습니까?')) return;
    try {
      await axiosClient.delete(`/reviews/${id}`);
      show('리뷰가 삭제되었습니다.', 'success');
      fetchData();
    } catch {
      show('삭제에 실패했습니다.', 'error');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">내 리뷰</h1>

      {/* 리뷰 작성 가능한 상품 */}
      {reviewable.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            리뷰 작성 가능한 상품
          </h2>
          <div className="flex flex-col gap-2">
            {reviewable.map((g) => (
              <div
                key={g.goodsId}
                className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl"
              >
                {g.goodsImageUrl ? (
                  <img src={g.goodsImageUrl} alt={g.goodsName} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-lg">🎁</div>
                )}
                <p className="flex-1 text-sm font-medium text-gray-700 truncate">{g.goodsName}</p>
                <button
                  onClick={() => setWriteTarget(g)}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 flex-shrink-0"
                >
                  리뷰 작성
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 작성한 리뷰 */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p>아직 작성한 리뷰가 없습니다.</p>
          {reviewable.length === 0 && (
            <p className="text-sm mt-1">상품을 구매하면 리뷰를 작성할 수 있어요.</p>
          )}
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            작성한 리뷰 ({reviews.length})
          </h2>
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}

      {/* 리뷰 작성 모달 */}
      {writeTarget && (
        <WriteReviewModal
          goods={writeTarget}
          onClose={() => setWriteTarget(null)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
