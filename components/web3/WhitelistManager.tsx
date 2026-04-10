'use client';

import { useState, type FormEvent } from 'react';
import { parseEther, isAddress } from 'viem';
import { useWhitelistManagement } from '@/lib/web3/hooks';
import { useAuth } from '@/context/AuthContext';
import TransactionReceipt from './TransactionReceipt';

interface ParsedEntry {
  address: `0x${string}`;
  maxContribution: bigint;
}

function parseWhitelistInput(raw: string): { entries: ParsedEntry[]; errors: string[] } {
  const entries: ParsedEntry[] = [];
  const errors: string[] = [];

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: expected "address, maxETH"`);
      continue;
    }
    const [addr, amountStr] = parts;
    if (!isAddress(addr)) {
      errors.push(`Line ${i + 1}: invalid address "${addr}"`);
      continue;
    }
    const amount = Number(amountStr);
    if (Number.isNaN(amount) || amount <= 0) {
      errors.push(`Line ${i + 1}: invalid amount "${amountStr}"`);
      continue;
    }
    entries.push({
      address: addr as `0x${string}`,
      maxContribution: parseEther(amountStr),
    });
  }
  return { entries, errors };
}

function parseRemoveInput(raw: string): { addresses: `0x${string}`[]; errors: string[] } {
  const addresses: `0x${string}`[] = [];
  const errors: string[] = [];

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const addr = lines[i].split(',')[0].trim();
    if (!isAddress(addr)) {
      errors.push(`Line ${i + 1}: invalid address "${addr}"`);
      continue;
    }
    addresses.push(addr as `0x${string}`);
  }
  return { addresses, errors };
}

export default function WhitelistManager() {
  const { hasRole } = useAuth();
  const { txState, addToWhitelist, removeFromWhitelist, reset } = useWhitelistManagement();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [input, setInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  if (!hasRole('admin')) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600 font-medium">Access denied</p>
        <p className="text-red-500 text-sm mt-1">Only administrators can manage the whitelist</p>
      </div>
    );
  }

  if (txState.status !== 'idle') {
    return <TransactionReceipt txState={txState} onReset={reset} />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'add') {
      const { entries, errors } = parseWhitelistInput(input);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors([]);
      addToWhitelist(
        entries.map((e) => e.address),
        entries.map((e) => e.maxContribution),
      );
    } else {
      const { addresses, errors } = parseRemoveInput(input);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors([]);
      removeFromWhitelist(addresses);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 space-y-5"
    >
      <h2 className="text-lg font-semibold text-gray-900">Whitelist Management</h2>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('add');
            setInput('');
            setValidationErrors([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'add'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Add addresses
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('remove');
            setInput('');
            setValidationErrors([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'remove'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Remove addresses
        </button>
      </div>

      {/* Input area */}
      <div>
        <label htmlFor="whitelist-input" className="block text-sm font-medium text-gray-700 mb-1">
          {mode === 'add'
            ? 'Enter addresses and max contribution (one per line: address, maxETH)'
            : 'Enter addresses to remove (one per line)'}
        </label>
        <textarea
          id="whitelist-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setValidationErrors([]);
          }}
          rows={6}
          placeholder={
            mode === 'add'
              ? '0x1234...abcd, 10\n0x5678...efgh, 5'
              : '0x1234...abcd\n0x5678...efgh'
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-describedby={validationErrors.length > 0 ? 'whitelist-errors' : undefined}
          aria-invalid={validationErrors.length > 0}
        />
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div id="whitelist-errors" className="rounded-lg bg-red-50 p-3" role="alert">
          <p className="text-sm font-medium text-red-800 mb-1">Validation errors:</p>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={!input.trim()}
        className={`w-full rounded-lg px-4 py-3 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'add'
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {mode === 'add' ? 'Add to whitelist' : 'Remove from whitelist'}
      </button>
    </form>
  );
}
