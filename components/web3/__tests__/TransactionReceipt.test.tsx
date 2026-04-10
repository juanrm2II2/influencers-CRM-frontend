import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TransactionReceipt from '../TransactionReceipt';
import type { TransactionState } from '@/types/web3';

describe('TransactionReceipt', () => {
  const noop = () => {};

  it('renders nothing for idle state', () => {
    const txState: TransactionState = { status: 'idle' };
    const { container } = render(<TransactionReceipt txState={txState} onReset={noop} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows pending message', () => {
    const txState: TransactionState = { status: 'pending' };
    render(<TransactionReceipt txState={txState} onReset={noop} />);
    expect(screen.getByText('Waiting for wallet confirmation…')).toBeInTheDocument();
  });

  it('shows confirming message with explorer link', () => {
    const txState: TransactionState = {
      status: 'confirming',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
    };
    render(<TransactionReceipt txState={txState} onReset={noop} />);
    expect(
      screen.getByText('Transaction submitted, waiting for confirmation…')
    ).toBeInTheDocument();
    const link = screen.getByText('View on explorer ↗');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('etherscan.io'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows confirmed state with receipt details', () => {
    const txState: TransactionState = {
      status: 'confirmed',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
      receipt: {
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
        blockNumber: 12345678n,
        gasUsed: 21000n,
        status: 'success',
      },
    };
    render(<TransactionReceipt txState={txState} onReset={noop} />);
    expect(screen.getByText('Transaction confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Block: 12345678')).toBeInTheDocument();
    expect(screen.getByText('Gas used: 21000')).toBeInTheDocument();
    expect(screen.getByText('Make another contribution')).toBeInTheDocument();
  });

  it('shows failed state with error message', () => {
    const txState: TransactionState = {
      status: 'failed',
      error: 'User rejected the transaction',
    };
    render(<TransactionReceipt txState={txState} onReset={noop} />);
    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
    expect(
      screen.getByText('User rejected the transaction')
    ).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls onReset when action button is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onReset = vi.fn();
    const txState: TransactionState = { status: 'confirmed' };
    render(<TransactionReceipt txState={txState} onReset={onReset} />);
    await user.click(screen.getByText('Make another contribution'));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
