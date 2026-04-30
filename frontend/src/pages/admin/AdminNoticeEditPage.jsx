import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createNotice, getNotice, updateNotice } from '../../api/notice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import RichEditor from '../../components/ui/RichEditor';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';

export default function AdminNoticeEditPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast, show, hide } = useToast();

  const [form, setForm] = useState({ title: '', content: '', pinned: false });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getNotice(id)
      .then((n) => setForm({
        title: n.title ?? '',
        content: n.content ?? '',
        pinned: Boolean(n.pinned),
      }))
      .catch(() => show('공지사항을 불러오지 못했습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return show('제목을 입력해주세요.', 'error');
    if (!form.content || form.content === '<p></p>') return show('내용을 입력해주세요.', 'error');

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateNotice(id, form);
        show('공지가 수정되었습니다.', 'success');
      } else {
        await createNotice(form);
        show('공지가 등록되었습니다.', 'success');
      }
      setTimeout(() => navigate('/admin/notices'), 500);
    } catch (err) {
      show(err.response?.data?.message || '저장에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? '공지 수정' : '새 공지 작성'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 flex flex-col gap-5">
        <Input
          label="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          maxLength={200}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
          <RichEditor
            value={form.content}
            onChange={(html) => setForm((f) => ({ ...f, content: html }))}
            placeholder="공지 내용을 입력하세요..."
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm text-gray-700">상단 고정 (홈 배너에도 노출)</span>
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? '저장 중...' : (isEdit ? '수정' : '등록')}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/admin/notices')}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
