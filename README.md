# ClarionGTM Sector ETF Tracker

A React + Supabase dashboard for monitoring key U.S. sector ETFs and market-moving news in one view.

## Overview

This app presents a market snapshot with:

- A **sector ETF grid** with momentum-style metrics (price, short/medium trend context, RSI, and fear/greed signal).
- A **market news panel** sourced through a Supabase Edge Function.
- A **market status indicator** and manual refresh for data revalidation.

The UI is optimized for fast scanning during market hours with a compact, dark terminal-style visual design.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui, lucide-react
- **Data Fetching:** TanStack Query
- **Backend Integration:** Supabase JS client + Supabase Edge Functions
- **Testing:** Vitest + Testing Library

## Project Structure

```text
src/
  components/        # Layout, ETF cards/grid, header/footer, news sidebar
  hooks/             # Query hooks for ETF/news data and market status logic
  integrations/      # Supabase client and generated types
  pages/             # Route-level pages
supabase/
  functions/         # Edge Functions (e.g., fetch-etf-news)
  migrations/        # SQL migrations
```

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- A **Supabase project**

## Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/jingerzz/clariongtm-sector-etf.git
   cd clariongtm-sector-etf
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables in `.env.local`:

   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open the URL shown by Vite (typically `http://localhost:5173`).

## Supabase Edge Functions

The frontend expects these functions to be available:

- `fetch-etf-data`
- `fetch-etf-news`

This repo includes the `fetch-etf-news` function in `supabase/functions/fetch-etf-news`. If deploying that function, set the required secrets in Supabase (for example `PERPLEXITY_API_KEY`, plus your standard Supabase runtime secrets).

## Available Scripts

- `npm run dev` – Start local dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build locally
- `npm run lint` – Lint the codebase
- `npm test` – Run unit tests once
- `npm run test:watch` – Run tests in watch mode

## Deployment

You can deploy the frontend to any static host (Vercel, Netlify, Cloudflare Pages, etc.) and connect it to your Supabase project.

At minimum, configure the same frontend environment variables in your deployment environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Contributing

Contributions are welcome. Please open an issue or PR for bugs, feature ideas, or documentation improvements.

## License

This project is licensed under the **Apache License 2.0**. See [LICENSE](./LICENSE).
