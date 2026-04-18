# Job Application Tracker

Personal tool for tracking job applications end-to-end: pipeline, interviews, contacts, offers, analytics.

## Stack

React 18 + Vite + TypeScript, Tailwind + shadcn-style primitives, TanStack Query, Supabase (Postgres + Auth + Storage + Edge Functions), deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Visit http://localhost:5173 and request a magic link with your email.

## Status

Scaffolding milestone (M1). Subsequent milestones add schema, applications CRUD, relations, attachments, analytics, reminders, email inbound, Google Calendar, import/export, power UX, and polish. See `docs/plan.md` (or the plan file in this session) for the full roadmap.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck + build for production
- `npm run typecheck` — TypeScript check only
- `npm run lint` — ESLint
- `npm run format` — Prettier
