# HackerRank Stats Card

Generate beautiful, always-up-to-date SVG cards for any public HackerRank profile. The project combines a polished React/Tailwind UI for building and sharing cards with a lightweight Express API (deployed as a Netlify Function) that hits the public HackerRank endpoints and renders the SVG server-side.

**Live demo:** https://hackerrank-stats-card.netlify.app/  
![HackerRank Stats](https://hackerrank-stats-card.netlify.app/api/hackerrank-card?username=shaonmajumder&solved=89)

---

## Features

- **Instant SVG preview** - Validate handles, optionally override the solved count, and render the card inline before sharing it anywhere.
- **Share-ready embeds** - Generate Markdown, HTML, and raw URL snippets with one-click copy (clipboard API with textarea fallback).
- **Rich HackerRank insights** - The API fetches the profile, badge, and certificate feeds in parallel, sanitizes values, and links certificates to their proof images.
- **Responsive shadcn/ui surface** - Tailwind + shadcn components deliver a delightful experience on desktop, tablet, and mobile.
- **Friendly feedback loop** - Toast notifications, inline form guidance, and disabled/loading states keep the workflow foolproof.
- **Serverless-friendly API** - A single Express app exposes `/api/hackerrank-card`, applies permissive CORS + caching headers, and deploys unchanged as a Netlify Function.

---

## Tech Stack

| Layer        | Tools & Libraries                                                                                                                    | Notes                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Front-end    | [React 18](https://reactjs.org/), [Vite 5](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)                       | Fast dev experience, type-safe hooks-based UI.                             |
| UI / Styling | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [lucide-react](https://lucide.dev/)                   | Utility-first styling with composable components and icons.                |
| State / UX   | React state + custom hooks, toast system, React Router                                                                               | Single-page flow with inline validation + toasts.                          |
| Backend API  | [Express](https://expressjs.com/), native `fetch`, custom SVG generator                                                              | Requests HackerRank profile/badges/certificates and renders SVG server-side. |
| Tooling      | ESLint 9, TypeScript ESLint, SWC React plugin, Nodemon, Concurrent dev server                                                        | `npm run lint` for static analysis; SWC keeps HMR snappy.                  |
| Deployment   | [Netlify](https://www.netlify.com/), [Netlify Functions](https://docs.netlify.com/functions/overview/), [serverless-http](https://github.com/dougmoscrop/serverless-http) | Netlify builds the Vite client and mounts the Express app as a function.   |

---

## Architecture Overview

1. **Client** (`src/pages/Index.tsx`)
   - Collects the username and optional solved count.
   - Calls `/api/hackerrank-card` (or `VITE_API_BASE_URL + /api/hackerrank-card`) and ensures the SVG is reachable before showing preview/embed snippets.
   - Provides Markdown/HTML/direct URL strings with one-click copy and toast feedback.
2. **Server** (`server/app.js`)
   - Validates query params, applies permissive CORS headers, and caches responses for one hour.
   - Fetches profile, badge, and certificate endpoints concurrently, normalizes/sanitizes the payload, and renders a dynamic SVG highlighting totals, top badges, and certificates.
3. **Serverless adapter** (`netlify/functions/hackerrank-card.js`)
   - Wraps the Express app via `serverless-http` so the same code runs locally (`npm run dev`) and on Netlify (`/.netlify/functions/hackerrank-card`).

---

## Project Structure

```
hackerrank-stats-card/
|-- src/
|   |-- components/           # shadcn/ui building blocks
|   `-- pages/Index.tsx      # Main UI for generating cards
|-- server/
|   |-- app.js               # Express app shared by dev server + Netlify
|   `-- index.js             # Local dev entry (nodemon)
|-- netlify/
|   `-- functions/
|       `-- hackerrank-card.js   # serverless-http wrapper
|-- netlify.toml             # Build + redirect configuration
|-- package.json
`-- README.md
```

---

## Getting Started

### 1. Prerequisites

- Node.js **18+** (use [nvm](https://github.com/nvm-sh/nvm) for convenience)
- npm **10+**

### 2. Installation

```bash
git clone <your-repo-url>
cd hackerrank-stats-card
npm install
```

### 3. Environment Variables

Create `.env` (already gitignored):

```bash
VITE_API_BASE_URL=""
```

- Leave empty to call the API on the same origin (default for local dev and Netlify).
- Set to `https://your-api.example.com` if you deploy the Express server elsewhere.

### 4. Run locally

```bash
npm run dev
```

This start script runs both:

- Vite dev server on [http://localhost:8080](http://localhost:8080)
- Nodemon + Express API on [http://localhost:8787](http://localhost:8787) (proxied via Vite)

Stop with `Ctrl+C`.

---

## Available Scripts

| Command                | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Run Vite (client) and Nodemon (API) together.                        |
| `npm run dev:client`   | Vite dev server only.                                                |
| `npm run dev:server`   | Nodemon watching `server/` for Express-only development.             |
| `npm run start:server` | Plain Node start of the API (production-like tests).                 |
| `npm run build`        | Production build for the React app (outputs to `dist/`).             |
| `npm run preview`      | Preview the built client locally.                                    |
| `npm run lint`         | Run ESLint (some shadcn-generated files may still warn).             |

---

## API Reference

All requests are GET and CORS-enabled. Responses are SVG (`Content-Type: image/svg+xml`) unless an error occurs.

### `GET /api/hackerrank-card`

| Query param | Type   | Required | Description                                |
| ----------- | ------ | -------- | ------------------------------------------ |
| `username`  | string | Yes      | HackerRank handle to fetch.                |
| `solved`    | number | No       | Optional override for problems-solved sum. |

**Responses**

- `200 OK` - SVG string (includes `Cache-Control: public, max-age=3600`).
- `400 Bad Request` - `{ error: "Username is required" }` or invalid `solved`.
- `404 Not Found` - `{ error: "Profile not found" }` when HackerRank is missing the user.
- `500 Internal Server Error` - `{ error: "Internal server error" }` for unexpected issues.

Because `netlify.toml` redirects `/api/*` to `/.netlify/functions/hackerrank-card`, the front-end can simply `fetch("/api/hackerrank-card?...")` both locally and in production. When deploying the API elsewhere, set `VITE_API_BASE_URL` accordingly.

---

## Deployment (Netlify)

1. Connect the repository in Netlify.
2. Netlify reads `netlify.toml` and automatically:
   - Runs `npm run build`.
   - Publishes the client from `dist/`.
   - Bundles functions from `netlify/functions/`.
3. `/api/*` routes are redirected to `/.netlify/functions/hackerrank-card`, which runs the Express logic via `serverless-http`.

Local parity:

```bash
npm install -g netlify-cli
netlify dev
```

`netlify dev` spins up both the client and the function emulation so `/api/*` behaves just like production.

---

## Conventions & Notes

- **Coding style:** ESLint + strict TypeScript. Run `npm run lint` before committing.
- **Single SVG source:** Keep `server/app.js` as the canonical SVG generator; reuse helpers for new endpoints.
- **Rate limiting:** HackerRank endpoints are unauthenticated. Add caching or rate protection if you expect heavy traffic.
- **Testing:** There are no automated tests yet; rely on manual browser checks and direct `curl` calls until tests are added.

---

## Roadmap Ideas

- Automated screenshots of the SVG for social sharing.
- Caching layer (Redis/Upstash) to shrink HackerRank load and speed up responses.
- Additional card layouts/themes and a live playground for customization.
- CLI or REST batch generation for multiple users.

---

## Author & Credits

**Built and maintained by [Shaon Majumder](https://shaonresume.netlify.app)**  
Senior Software Engineer - AI & Scalability

**Connect**

- Portfolio: https://shaonresume.netlify.app
- GitHub: https://github.com/ShaonMajumder
- LinkedIn: https://www.linkedin.com/in/shaonmajumder
- Medium: https://medium.com/@shaonmajumder
- Resume: https://docs.google.com/document/d/1frKGGkaE1nG9G8mTkxUoPfcU0jppSZYOy4VMPTlIb-Y/edit?tab=t.0

---

Happy coding! Feel free to open an issue or PR if you build something cool with the HackerRank Stats Card.
