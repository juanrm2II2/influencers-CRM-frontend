import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock RainbowKit
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button data-testid="connect-button">Connect Wallet</button>,
}));

import ConnectWallet from '../ConnectWallet';

describe('ConnectWallet', () => {
  it('renders the RainbowKit ConnectButton', () => {
    render(<ConnectWallet />);
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
  });
});
