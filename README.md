# TalentMind AI

AI-powered candidate ranking and recruiter dashboard using Google Gemini for semantic resume analysis.

## Features

- **Dashboard** — Pipeline stats, top-ranked candidates, AI coverage
- **Job Descriptions** — Upload and manage job descriptions, set active job for ranking
- **Candidate Management** — Add candidates manually or import via CSV
- **AI Ranking** — Gemini AI analyzes and ranks all candidates 0–100 with semantic understanding
- **Candidate Details** — Full AI analysis with skill match %, experience match %, recommendation, and summary
- **Analytics** — Score distributions, skill frequency charts, leaderboard
- **Exports** — Download `ranked_candidates.csv`, `ranked_candidates.xlsx`, and `recruiter_report.pdf`
- **Light/Dark Mode** — Toggle in the sidebar

## Stack

- **Frontend:** React + Vite + TypeScript, TailwindCSS, shadcn/ui, Recharts, TanStack Query
- **Backend:** Express 5 + TypeScript, Drizzle ORM, PostgreSQL
- **AI:** Google Gemini 2.5 Flash via `@google/genai`
- **Exports:** papaparse, xlsx, pdfkit
- **Monorepo:** pnpm workspaces

## Getting Started

### 1. Clone and install

```bash
pnpm install
```

### 2. Set environment variables

Copy `.env.example` and fill in values:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `GEMINI_API_KEY` — Get from https://aistudio.google.com/apikey (free tier available)

### 3. Push database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Run

```bash
# API server (port 5000 / 8080)
pnpm --filter @workspace/api-server run dev

# Frontend (Vite dev server)
pnpm --filter @workspace/talentmind run dev
```

## How to Use

1. **Add a Job** — Go to Jobs → paste or type a job description → Save
2. **Set Active Job** — Click "Set Active" on the job you want to rank against
3. **Add Candidates** — Go to Candidates → Add New, or use Import CSV
4. **Rank with AI** — On the Candidates page, click "Rank with AI" — Gemini scores every candidate
5. **View Results** — Each candidate gets a 0–100 score, skill match %, experience match %, and an AI written recommendation
6. **Export** — Download CSV, XLSX, or PDF from the Analytics or Candidates pages

## CSV Import Format

```csv
name,email,skills,experience,education,resume
Jane Doe,jane@example.com,"Python;React;SQL",5,B.S. Computer Science,"5 years building web apps..."
```

Columns: `name`, `email`, `skills` (semicolon-separated), `experience` (years), `education`, `resume` (optional)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/jobs | List all jobs |
| POST | /api/jobs | Create job |
| PATCH | /api/jobs/:id/active | Set active job |
| GET | /api/candidates | List candidates (optional ?jobId=) |
| POST | /api/candidates | Add candidate |
| POST | /api/candidates/import-csv | Bulk import |
| POST | /api/analysis/rank | AI rank all candidates for a job |
| POST | /api/analysis/candidate/:id | AI analyze single candidate |
| GET | /api/analytics/summary | Dashboard stats |
| GET | /api/analytics/skill-distribution | Top skills |
| GET | /api/analytics/score-distribution | Score buckets |
| GET | /api/export/csv | Download CSV |
| GET | /api/export/xlsx | Download XLSX |
| GET | /api/export/pdf | Download PDF report |

## Project Structure

```
artifacts/
  api-server/         Express API + routes + Gemini integration
  talentmind/         React + Vite frontend
lib/
  api-spec/           OpenAPI spec (source of truth)
  api-client-react/   Generated React Query hooks
  api-zod/            Generated Zod schemas
  db/                 Drizzle ORM schema + client
```

## Data & AI Challenge

This project was built for the Replit Data & AI Challenge. It demonstrates:
- Semantic AI analysis beyond keyword matching
- Real-time Gemini AI integration for talent assessment
- Production-ready full-stack TypeScript monorepo
- Clean recruiter UX with data visualizations and export capabilities
