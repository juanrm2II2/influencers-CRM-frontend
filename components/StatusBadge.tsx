import { Status } from '@/types';

const statusConfig: Record<Status, { label: string; classes: string }> = {
  prospect: { label: 'Prospect', classes: 'bg-gray-100 text-gray-700' },
  contacted: { label: 'Contacted', classes: 'bg-blue-100 text-blue-700' },
  negotiating: { label: 'Negotiating', classes: 'bg-yellow-100 text-yellow-700' },
  active: { label: 'Active', classes: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', classes: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || statusConfig.prospect;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}
