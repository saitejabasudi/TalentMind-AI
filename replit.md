# TalentMind AI

AI-powered candidate ranking and recruiter dashboard. Uses Google Gemini to semantically analyze resumes and rank candidates 0–100 against job descriptions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/talentmind run dev` — run the frontend (port 23350)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GEMINI_API_KEY` — Google Gemini API key (get free at aistudio.google.com)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, Recharts, TanStack Query, wouter
- API: Express 5, pino logging
- DB: PostgreSQL + Drizzle ORM
- AI: Google Gemini 2.5 Flash (`@google/genai`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Exports: papaparse, xlsx, pdfkit

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle ORM tables: `jobs.ts`, `candidates.ts`
- `artifacts/api-server/src/routes/` — Express routes: jobs, candidates, analysis, analytics, export
- `artifacts/api-server/src/lib/gemini.ts` — Gemini AI integration
- `artifacts/talentmind/src/` — React frontend
- `README.md` — Full project docs for GitHub

## Architecture decisions

- OpenAPI-first: all types generated from `openapi.yaml` via Orval — never hand-write types
- Skills stored as JSON text in Postgres (avoids separate join table for hackathon simplicity)
- Gemini called per-candidate during ranking; candidates analyzed in parallel with Promise.all
- Exports (CSV/XLSX/PDF) served directly from Express as binary/text streams
- No auth, no billing — clean hackathon scope

## Product

- Dashboard with pipeline stats (total candidates, jobs, AI coverage, avg score)
- Job Descriptions: upload/paste, set active job for ranking
- Candidates: add manually, import CSV, search/filter by job
- AI Ranking: one-click Gemini analysis ranking all candidates 0–100 with skill match, experience match, recommendation
- Candidate Details: circular score gauge, AI summary, match breakdowns
- Analytics: score distribution chart, skill frequency chart
- Exports: ranked_candidates.csv, ranked_candidates.xlsx, recruiter_report.pdf
- Light/Dark mode toggle

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`
- Skills field in DB is JSON-serialized text — always `JSON.parse`/`JSON.stringify` when reading/writing
- Gemini API key must be set as `GEMINI_API_KEY` secret — never as a plain env var in code

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
