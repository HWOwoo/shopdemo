import { useState, useCallback, useRef } from 'react';

/**
 * useConfirm()
 * 사용법:
 *   const { confirm, ConfirmModal } = useConfirm();
 *   // JSX에 <ConfirmModal /> 포함
 *   const ok = await confirm('정말 삭제하시겠습니까?');
 *   if (!ok) return;
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '', subMessage: '' });
  const resolveRef = useRef(null);

  const confirm = useCallback((message, subMessage = '') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, message, subMessage });
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(false);
  };

  const ConfirmModal = () => {
    if (!state.open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 백드롭 */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleCancel}
        />
        {/* 모달 */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 leading-relaxed">{state.message}</p>
              {state.subMessage && (
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{state.subMessage}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmModal };
}
