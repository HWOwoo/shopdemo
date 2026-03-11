import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { useRef, useState, useCallback, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

/* ──────────────────── 프리셋 색상 ──────────────────── */
const TEXT_COLORS = [
  { label: '기본',   color: null },
  { label: '검정',   color: '#111827' },
  { label: '회색',   color: '#6b7280' },
  { label: '빨강',   color: '#dc2626' },
  { label: '주황',   color: '#ea580c' },
  { label: '노랑',   color: '#ca8a04' },
  { label: '초록',   color: '#16a34a' },
  { label: '파랑',   color: '#2563eb' },
  { label: '남색',   color: '#4f46e5' },
  { label: '보라',   color: '#9333ea' },
  { label: '분홍',   color: '#db2777' },
];

const HIGHLIGHT_COLORS = [
  { label: '없음',   color: null },
  { label: '노랑',   color: '#fef08a' },
  { label: '초록',   color: '#bbf7d0' },
  { label: '파랑',   color: '#bfdbfe' },
  { label: '분홍',   color: '#fce7f3' },
  { label: '주황',   color: '#fed7aa' },
  { label: '보라',   color: '#e9d5ff' },
];

/* ──────────────────── 소형 컴포넌트 ──────────────────── */
function Btn({ onAction, active, disabled, title, children, className = '' }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onAction?.(); }}
      title={title}
      disabled={disabled}
      className={`px-1.5 py-1 rounded text-sm min-w-[28px] leading-none transition-colors
        ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}
        disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-gray-200 mx-0.5 self-center shrink-0" />;
}

/* 색상 팔레트 팝오버 */
function ColorPalette({ colors, onSelect, onClose, current }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-wrap gap-1.5 w-48">
      {colors.map(({ label, color }) => (
        <button
          key={label}
          type="button"
          title={label}
          onMouseDown={(e) => { e.preventDefault(); onSelect(color); onClose(); }}
          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
            ${current === color ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-gray-300'}`}
          style={{ background: color ?? '#fff' }}
        />
      ))}
    </div>
  );
}

/* 표 크기 선택 그리드 */
function TablePicker({ onSelect, onClose }) {
  const [hover, setHover] = useState([0, 0]);
  const ref = useRef(null);
  const ROWS = 6, COLS = 6;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-400 mb-2 text-center">
        {hover[0] > 0 ? `${hover[0]} × ${hover[1]}` : '표 크기 선택'}
      </p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS) + 1;
          const c = (i % COLS) + 1;
          const isActive = r <= hover[0] && c <= hover[1];
          return (
            <button
              key={i}
              type="button"
              className={`w-6 h-6 border rounded-sm transition-colors
                ${isActive ? 'bg-indigo-200 border-indigo-400' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              onMouseEnter={() => setHover([r, c])}
              onMouseDown={(e) => { e.preventDefault(); onSelect(r, c); onClose(); }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────── 메인 에디터 ──────────────────── */
export default function RichEditor({ value, onChange, placeholder = '상품 설명을 입력하세요...' }) {
  const fileInputRef = useRef(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: { 'data-placeholder': placeholder },
    },
  });

  /* 이미지 업로드 */
  const handleImageFile = useCallback(async (file) => {
    if (!file || !editor) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosClient.post('/upload/image', fd, {
        headers: { 'Content-Type': undefined },
      });
      editor.chain().focus().setImage({ src: res.data.data }).run();
    } catch {
      alert('이미지 업로드 실패 (최대 10MB, jpg/png/gif/webp)');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor]);

  /* 링크 적용 */
  const applyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    url
      ? editor.chain().focus().setLink({ href: url }).run()
      : editor.chain().focus().unsetLink().run();
    setLinkUrl('');
    setShowLink(false);
  };

  /* 현재 블록 타입 */
  const currentBlock = () => {
    if (!editor) return 'paragraph';
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    return 'paragraph';
  };

  const applyBlock = (val) => {
    if (!editor) return;
    if (val === 'paragraph') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-xl overflow-visible focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">

      {/* ═══════════ 툴바 ═══════════ */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-xl">

        {/* 블록 타입 */}
        <select
          value={currentBlock()}
          onChange={(e) => applyBlock(e.target.value)}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 mr-0.5"
        >
          <option value="paragraph">본문</option>
          <option value="1">제목 1</option>
          <option value="2">제목 2</option>
          <option value="3">제목 3</option>
        </select>
        <Sep />

        {/* 텍스트 스타일 */}
        <Btn onAction={() => editor.chain().focus().toggleBold().run()}
             active={editor.isActive('bold')} title="굵게 (Ctrl+B)">
          <strong className="text-xs">B</strong>
        </Btn>
        <Btn onAction={() => editor.chain().focus().toggleItalic().run()}
             active={editor.isActive('italic')} title="기울임 (Ctrl+I)">
          <em className="text-xs">I</em>
        </Btn>
        <Btn onAction={() => editor.chain().focus().toggleUnderline().run()}
             active={editor.isActive('underline')} title="밑줄 (Ctrl+U)">
          <span className="text-xs underline">U</span>
        </Btn>
        <Btn onAction={() => editor.chain().focus().toggleStrike().run()}
             active={editor.isActive('strike')} title="취소선">
          <s className="text-xs">S</s>
        </Btn>
        <Sep />

        {/* 글자 색상 */}
        <div className="relative">
          <Btn onAction={() => { setShowTextColor((v) => !v); setShowHighlight(false); setShowTable(false); }}
               active={showTextColor} title="글자 색상">
            <span className="text-xs font-bold" style={{ color: editor.getAttributes('textStyle').color ?? '#111' }}>
              A
            </span>
            <span className="block h-0.5 w-4 mt-0.5 rounded-full"
                  style={{ background: editor.getAttributes('textStyle').color ?? '#111' }} />
          </Btn>
          {showTextColor && (
            <ColorPalette
              colors={TEXT_COLORS}
              current={editor.getAttributes('textStyle').color}
              onSelect={(c) => c ? editor.chain().focus().setColor(c).run() : editor.chain().focus().unsetColor().run()}
              onClose={() => setShowTextColor(false)}
            />
          )}
        </div>

        {/* 형광펜 */}
        <div className="relative">
          <Btn onAction={() => { setShowHighlight((v) => !v); setShowTextColor(false); setShowTable(false); }}
               active={showHighlight} title="형광펜">
            <span className="text-xs px-0.5 rounded"
                  style={{ background: editor.getAttributes('highlight').color ?? '#fef08a' }}>
              H
            </span>
          </Btn>
          {showHighlight && (
            <ColorPalette
              colors={HIGHLIGHT_COLORS}
              current={editor.getAttributes('highlight').color}
              onSelect={(c) => c
                ? editor.chain().focus().setHighlight({ color: c }).run()
                : editor.chain().focus().unsetHighlight().run()}
              onClose={() => setShowHighlight(false)}
            />
          )}
        </div>
        <Sep />

        {/* 텍스트 정렬 */}
        {[
          { align: 'left',    icon: '≡', title: '왼쪽 정렬' },
          { align: 'center',  icon: '≡', title: '가운데 정렬' },
          { align: 'right',   icon: '≡', title: '오른쪽 정렬' },
          { align: 'justify', icon: '≡', title: '양쪽 정렬' },
        ].map(({ align, icon, title }, idx) => (
          <Btn key={align}
               onAction={() => editor.chain().focus().setTextAlign(align).run()}
               active={editor.isActive({ textAlign: align })}
               title={title}>
            <svg viewBox="0 0 16 14" className="w-3.5 h-3.5" fill="currentColor">
              <rect x="0" y="0"  width={align === 'right' ? 10 : 16} height="2" rx="1" />
              <rect x={align === 'center' ? 2 : align === 'right' ? 3 : 0} y="4" width={align === 'left' ? 10 : align === 'center' ? 12 : align === 'right' ? 13 : 16} height="2" rx="1" />
              <rect x="0" y="8"  width={align === 'right' ? 13 : 16} height="2" rx="1" />
              <rect x={align === 'center' ? 3 : align === 'right' ? 1 : 0} y="12" width={align === 'left' ? 8 : align === 'center' ? 10 : align === 'right' ? 11 : 16} height="2" rx="1" />
            </svg>
          </Btn>
        ))}
        <Sep />

        {/* 목록 */}
        <Btn onAction={() => editor.chain().focus().toggleBulletList().run()}
             active={editor.isActive('bulletList')} title="목록">
          <span className="text-xs">•≡</span>
        </Btn>
        <Btn onAction={() => editor.chain().focus().toggleOrderedList().run()}
             active={editor.isActive('orderedList')} title="번호 목록">
          <span className="text-xs">1≡</span>
        </Btn>
        <Btn onAction={() => editor.chain().focus().sinkListItem('listItem').run()}
             disabled={!editor.can().sinkListItem('listItem')} title="들여쓰기">
          <span className="text-xs">→</span>
        </Btn>
        <Btn onAction={() => editor.chain().focus().liftListItem('listItem').run()}
             disabled={!editor.can().liftListItem('listItem')} title="내어쓰기">
          <span className="text-xs">←</span>
        </Btn>
        <Sep />

        {/* 블록 요소 */}
        <Btn onAction={() => editor.chain().focus().toggleBlockquote().run()}
             active={editor.isActive('blockquote')} title="인용문">
          <span className="text-sm leading-none">"</span>
        </Btn>
        <Btn onAction={() => editor.chain().focus().toggleCodeBlock().run()}
             active={editor.isActive('codeBlock')} title="코드 블록">
          <span className="text-xs font-mono">&lt;/&gt;</span>
        </Btn>
        <Btn onAction={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
          <span className="text-xs">—</span>
        </Btn>
        <Sep />

        {/* 링크 */}
        <Btn onAction={() => { setShowLink((v) => !v); }}
             active={editor.isActive('link') || showLink} title="링크 삽입">
          <span className="text-xs">🔗</span>
        </Btn>

        {/* 이미지 업로드 */}
        <Btn onAction={() => fileInputRef.current?.click()} disabled={uploading} title="이미지 업로드">
          <span className="text-xs">{uploading ? '⏳' : '📷'}</span>
        </Btn>

        {/* 표 */}
        <div className="relative">
          <Btn onAction={() => { setShowTable((v) => !v); setShowTextColor(false); setShowHighlight(false); }}
               active={showTable} title="표 삽입">
            <span className="text-xs">⊞</span>
          </Btn>
          {showTable && (
            <TablePicker
              onSelect={(rows, cols) =>
                editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
              }
              onClose={() => setShowTable(false)}
            />
          )}
        </div>
        <Sep />

        {/* 실행취소 / 다시실행 */}
        <Btn onAction={() => editor.chain().focus().undo().run()}
             disabled={!editor.can().undo()} title="실행 취소 (Ctrl+Z)">
          <span className="text-xs">↩</span>
        </Btn>
        <Btn onAction={() => editor.chain().focus().redo().run()}
             disabled={!editor.can().redo()} title="다시 실행 (Ctrl+Y)">
          <span className="text-xs">↪</span>
        </Btn>
      </div>

      {/* 커서가 표 안에 있을 때 표 편집 툴바 */}
      {editor.isActive('table') && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-indigo-100 bg-indigo-50 text-xs text-indigo-700">
          <span className="font-medium mr-1">표 편집:</span>
          <Btn onAction={() => editor.chain().focus().addRowBefore().run()} title="위에 행 추가">행↑</Btn>
          <Btn onAction={() => editor.chain().focus().addRowAfter().run()} title="아래 행 추가">행↓</Btn>
          <Btn onAction={() => editor.chain().focus().deleteRow().run()} title="행 삭제">행✕</Btn>
          <Sep />
          <Btn onAction={() => editor.chain().focus().addColumnBefore().run()} title="왼쪽에 열 추가">열←</Btn>
          <Btn onAction={() => editor.chain().focus().addColumnAfter().run()} title="오른쪽에 열 추가">열→</Btn>
          <Btn onAction={() => editor.chain().focus().deleteColumn().run()} title="열 삭제">열✕</Btn>
          <Sep />
          <Btn onAction={() => editor.chain().focus().mergeCells().run()} title="셀 병합">병합</Btn>
          <Btn onAction={() => editor.chain().focus().splitCell().run()} title="셀 분리">분리</Btn>
          <Sep />
          <Btn onAction={() => editor.chain().focus().deleteTable().run()}
               title="표 삭제" className="text-red-500 hover:bg-red-50">표✕</Btn>
        </div>
      )}

      {/* 링크 입력 줄 */}
      {showLink && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
          <span className="text-xs text-indigo-500 shrink-0">링크 URL</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
            autoFocus
          />
          <button type="button" onClick={applyLink}
            className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 shrink-0">
            적용
          </button>
          <button type="button" onClick={() => { setShowLink(false); editor.chain().focus().unsetLink().run(); }}
            className="text-xs text-gray-400 hover:text-red-500 shrink-0">
            삭제
          </button>
        </div>
      )}

      {/* 에디터 본문 */}
      <EditorContent editor={editor} className="bg-white rounded-b-xl" />

      {/* 이미지 파일 선택 (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => handleImageFile(e.target.files?.[0])}
      />
    </div>
  );
}
