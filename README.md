# Finance Calculator

Static React + TypeScript + Vite site for comparing novated lease quotes against buying outright or taking a standard car loan. Built to be extensible for future calculators (pay calculator, home loan calculator).

## Tech
- Vite + React + TypeScript
- Tailwind CSS

## Getting started
```bash
npm install
npm run dev
```

## Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint

## Deploying to GitHub Pages
This repo is configured for GitHub Pages via Actions:

- Workflow: `.github/workflows/deploy.yml` builds on `main` and deploys to Pages.
- Vite base path is set to `/finance_calculator/` in `vite.config.ts`.
- After pushing to `main`, check the Actions tab to confirm the deploy succeeded, then enable Pages (GitHub will set the environment URL).

## About the calculator
- Client-side only. Numbers stay in your browser.
- Compares novated lease (after-tax cost) against buying outright and a standard car loan using your inputs.
- Assumptions are simplified (e.g., GST saving applied upfront, residual paid at end). Always cross-check with your provider and adviser.
