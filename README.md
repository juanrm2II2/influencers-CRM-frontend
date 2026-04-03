# Influencer CRM Frontend

A Next.js 15 frontend for managing influencer partnerships — built with TypeScript and Tailwind CSS.

## Features

- **Dashboard** (`/dashboard`) — stats bar, filters, search, influencer card grid
- **Influencer Detail** (`/influencers/:id`) — profile, stats, status management, notes, outreach timeline
- **Add Influencer Modal** — search by handle + platform via backend → ScrapeCreators
- **Log Outreach Modal** — record contact history per influencer
- **Responsive** — 3-column desktop grid, single-column mobile

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/) for API calls
- Deploy to [Vercel](https://vercel.com/)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the env example and configure:
   ```bash
   cp .env.local.example .env.local
   ```
   Set `NEXT_PUBLIC_API_URL` to your backend URL.

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/dashboard`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the Express backend (default: `http://localhost:3001`) |

## Project Structure

```
app/
  dashboard/         # Dashboard page
  influencers/[id]/  # Influencer detail page
  layout.tsx
  page.tsx           # Redirects to /dashboard
components/
  AddInfluencerModal.tsx
  FilterBar.tsx
  InfluencerCard.tsx
  LogOutreachModal.tsx
  PlatformIcon.tsx
  StatsBar.tsx
  StatusBadge.tsx
lib/
  api.ts             # Axios API service layer
types/
  index.ts           # TypeScript types
```

## Deployment

Deploy to Vercel and set the `NEXT_PUBLIC_API_URL` environment variable to your Railway backend URL.
