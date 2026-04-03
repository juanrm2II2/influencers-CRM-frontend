'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Influencer } from '@/types';
import StatusBadge from './StatusBadge';
import PlatformIcon from './PlatformIcon';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function InfluencerCard({ influencer }: { influencer: Influencer }) {
  return (
    <Link href={`/influencers/${influencer.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {influencer.profile_pic_url ? (
              <Image
                src={influencer.profile_pic_url}
                alt={influencer.full_name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                {influencer.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{influencer.full_name || influencer.handle}</p>
            <p className="text-sm text-gray-500 truncate">@{influencer.handle}</p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <PlatformIcon platform={influencer.platform} />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <p className="font-semibold text-gray-900">{formatNumber(influencer.followers)}</p>
            <p className="text-gray-500 text-xs">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              {influencer.engagement_rate != null
                ? `${Number(influencer.engagement_rate).toFixed(2)}%`
                : '—'}
            </p>
            <p className="text-gray-500 text-xs">Engagement</p>
          </div>
          <div className="text-center">
            <StatusBadge status={influencer.status} />
          </div>
        </div>

        {influencer.niche && (
          <div>
            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {influencer.niche}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
