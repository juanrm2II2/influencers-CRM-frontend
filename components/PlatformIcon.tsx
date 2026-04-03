import { Platform } from '@/types';

const icons: Record<Platform, string> = {
  tiktok: '🎵',
  instagram: '📸',
  youtube: '▶️',
  twitter: '🐦',
};

const labels: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter',
};

export default function PlatformIcon({
  platform,
  showLabel = false,
}: {
  platform: Platform;
  showLabel?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span>{icons[platform] ?? '🌐'}</span>
      {showLabel && <span className="text-gray-600">{labels[platform] ?? platform}</span>}
    </span>
  );
}
