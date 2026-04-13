/**
 * Centralized application configuration constants.
 *
 * Environment variables consumed by the frontend are read once and
 * re-exported from here so every module resolves the same value without
 * duplicating the fallback logic.
 */

/** Base URL of the backend API (Express). */
export const API_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
