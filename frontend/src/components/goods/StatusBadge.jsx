const STATUS_STYLES = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100  text-green-800',
  REJECTED: 'bg-red-100    text-red-800',
  SOLDOUT:  'bg-amber-100  text-amber-800',
  CLOSED:   'bg-gray-100   text-gray-500',
};

const STATUS_LABELS = {
  PENDING:  '심사 중',
  APPROVED: '판매 중',
  REJECTED: '거절됨',
  SOLDOUT:  '품절',
  CLOSED:   '판매 종료',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-5 px-2.5 rounded-full text-[11px] font-semibold leading-none ${style}`}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current flex-shrink-0" />
      {label}
    </span>
  );
}
