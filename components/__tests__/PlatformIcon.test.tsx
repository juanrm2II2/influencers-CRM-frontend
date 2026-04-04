import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlatformIcon from '../PlatformIcon';
import type { Platform } from '@/types';

describe('PlatformIcon', () => {
  const platforms: { platform: Platform; icon: string; label: string }[] = [
    { platform: 'tiktok', icon: '🎵', label: 'TikTok' },
    { platform: 'instagram', icon: '📸', label: 'Instagram' },
    { platform: 'youtube', icon: '▶️', label: 'YouTube' },
    { platform: 'twitter', icon: '🐦', label: 'Twitter' },
  ];

  platforms.forEach(({ platform, icon }) => {
    it(`renders icon for ${platform}`, () => {
      render(<PlatformIcon platform={platform} />);
      expect(screen.getByText(icon)).toBeInTheDocument();
    });
  });

  platforms.forEach(({ platform, label }) => {
    it(`shows label for ${platform} when showLabel is true`, () => {
      render(<PlatformIcon platform={platform} showLabel />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('does not show label by default', () => {
    render(<PlatformIcon platform="instagram" />);
    expect(screen.queryByText('Instagram')).not.toBeInTheDocument();
  });
});
