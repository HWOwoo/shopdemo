import { useState, useEffect } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hide = () => setToast(null);

  return { toast, show, hide };
}

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-lg text-white text-sm shadow-lg ${colors[toast.type] || colors.info}`}>
      {toast.message}
    </div>
  );
}
