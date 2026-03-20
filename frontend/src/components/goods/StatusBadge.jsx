const STATUS_STYLES = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SOLDOUT:  'bg-orange-100 text-orange-700',
  CLOSED:   'bg-gray-200 text-gray-500',
};

const STATUS_LABELS = {
  PENDING:  '심사 중',
  APPROVED: '판매 중',
  REJECTED: '거절됨',
  SOLDOUT:  '품절',
  CLOSED:   '판매 종료',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
