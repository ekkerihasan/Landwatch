# LandWatch — Frontend (Next.js + Tailwind)

Risk Dashboard prototype per `technicaldesign.md §3` + `designbrief.md`.

## Stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS 3.4
- Fetches `GET /projects` with fallback to `public/mock-projects.json`

## Setup
```bash
cd frontend
npm install
cp .env.example .env   # set NEXT_PUBLIC_API_URL if FastAPI is not localhost:8000
npm run dev            # http://localhost:3000
npm run build          # production build check
```

## Mock data
`public/mock-projects.json` contains 5 fake `Project` entities shaped per `datamodel.md`:
`project_id, name, location, sector, area, paf_count, current_stage, created_at`.

The dashboard tries `GET ${NEXT_PUBLIC_API_URL}/projects` first; on failure it loads the mock JSON and shows a "Source: Mock JSON" badge.

## Design Brief notes
- Risk colors: Low teal, Medium amber, High orange, Critical red — `tailwind.config.ts:risk` + `components/RiskBadge.tsx`
- Typography: Inter via system stack, Tailwind `font-sans`
- Layout: data-dense table (desktop) / cards (mobile), filters for sector/stage/region, sortable by risk
- Trust: every view labelled synthetic/demo per Design Brief §4

## No auth yet
Role-based access (Officer/Supervisor/Admin) is out of scope for this scaffold — will be added with JWT per Technical Design §1.
