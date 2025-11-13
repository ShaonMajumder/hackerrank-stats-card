# HackerRank Stats Card

Generate beautiful, always-up-to-date SVG cards that showcase any public HackerRank profile. The project ships a React/Tailwind front-end for building and sharing cards, plus a tiny Express API (deployed as a Netlify Function) that scrapes the public HackerRank endpoints and returns the rendered SVG.

**Live Link**: https://hackerrank-stats-card.netlify.app/
![HackerRank Stats](https://hackerrank-stats-card.netlify.app/api/hackerrank-card?username=shaonmajumder&solved=89)

---

## Features

- **One-click card generation** – Enter a username (and optional solved count) to preview the SVG immediately.
- **Share-ready embeds** – Prebuilt Markdown, HTML, and direct-link snippets for README.md files, blogs, and dashboards.
- **Badge & certificate summaries** – Highlights gold/silver/bronze badge counts and all passed certificates pulled from HackerRank.
- **Responsive UI** – Built with shadcn/ui + Tailwind for a polished experience on desktop or mobile.
- **Self-hosted API** – Express server runs locally and doubles as a Netlify Function in production, so `/api/hackerrank-card` works on every environment.

---

## 🧰 Tech Stack

| Layer        | Tools & Libraries                                                                                                                    | Notes                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Front-end    | [React 18](https://reactjs.org/), [Vite 5](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)                       | Fast dev build, type safety, hooks-based UI.                               |
| UI / Styling | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [lucide-react](https://lucide.dev/)                   | Prebuilt components, utility classes, iconography.                         |
| State / UX   | React hooks, [@tanstack/react-query](https://tanstack.com/query/latest) (ready for future caching), react-router                     | SPA router with `/` page and error boundary.                               |
| Tooling      | ESLint 9, TypeScript ESLint, SWC React plugin, Concurrent dev server                                                                 | `npm run lint` for static analysis; SWC speeds up HMR.                     |
| Backend API  | [Express](https://expressjs.com/), `node-fetch` (native), custom SVG generator                                                       | Fetches profile, badges, certificates, then renders SVG server-side.       |
| Serverless   | [Netlify Functions](https://docs.netlify.com/functions/overview/), [serverless-http](https://github.com/dougmoscrop/serverless-http) | Wraps the Express app for production; `/api/*` redirected to the function. |
| Deployment   | [Netlify](https://www.netlify.com/)                                                                                                  | Builds Vite front-end, bundles serverless function via `netlify.toml`.     |

---

## Project Structure

```
.
├── src/                    # React application
│   ├── components/         # shadcn/ui building blocks
│   ├── pages/Index.tsx     # Main UI for generating cards
│   └── integrations/       # (unused) placeholder for future APIs
├── server/
│   ├── app.js              # Express app shared by dev server + Netlify
│   └── index.js            # Local dev entry (nodemon)
├── netlify/
│   └── functions/
│       └── hackerrank-card.js   # serverless-http wrapper
├── netlify.toml            # Build + redirect configuration
└── package.json
```

---

## Getting Started

### 1. Prerequisites

- Node.js **18+** (recommended via [nvm](https://github.com/nvm-sh/nvm))
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

- Leave the value empty to call the API on the same origin (default for local dev + Netlify).
- Set to `https://your-api.example.com` if you deploy the Express server elsewhere.

### 4. Run locally

```bash
npm run dev
```

This concurrently starts:

- Vite dev server on [http://localhost:8080](http://localhost:8080)
- Nodemon + Express API on [http://localhost:8787](http://localhost:8787) (proxied via Vite)

Stop with `Ctrl+C`.

---

## Available Scripts

| Command                | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Run Vite (client) + Nodemon (API) together.                          |
| `npm run dev:client`   | Vite dev server only.                                                |
| `npm run dev:server`   | Nodemon watching `server/` for Express-only development.             |
| `npm run start:server` | Plain Node start of the API (useful for production-like tests).      |
| `npm run build`        | Production build for the React app (outputs to `dist/`).             |
| `npm run preview`      | Preview the built client locally.                                    |
| `npm run lint`         | Run ESLint (note: a few shadcn-generated files still emit warnings). |

---

## API Reference

All requests are GET and CORS-enabled. The server returns SVG with `Content-Type: image/svg+xml`.

### `GET /api/hackerrank-card`

| Query Param | Type   | Required | Description                              |
| ----------- | ------ | -------- | ---------------------------------------- |
| `username`  | string | ✅ Yes   | HackerRank handle to fetch.              |
| `solved`    | number | ❌ No    | Optional custom solved count to display. |

**Responses**

- `200 OK` – SVG string (set `Cache-Control: public, max-age=3600` for caching).
- `400 Bad Request` – JSON body `{ error: "Username is required" }` or invalid `solved`.
- `404 Not Found` – JSON error if the hacker profile is missing.
- `500 Internal Server Error` – Generic JSON error for unexpected issues.

Because the Netlify redirect maps `/api/*` to the function, the front-end can simply `fetch("/api/hackerrank-card?...")` in every environment.

---

## Deployment (Netlify)

1. **Connect the repo** in Netlify.
2. Netlify automatically discovers `netlify.toml`:
   - Builds the Vite site via `npm run build`.
   - Publishes the static client from `dist/`.
   - Bundles serverless functions from `netlify/functions/`.
3. `/api/*` routes are redirected to `/.netlify/functions/hackerrank-card`, which runs the Express logic via `serverless-http`.

To test locally with Netlify:

```bash
npm install -g netlify-cli
netlify dev
```

This spins up both the Vite client and the serverless function emulation.

---

## Conventions & Notes

- **Coding style**: ESLint + TypeScript strict mode. Run `npm run lint` before committing.
- **SVG generator**: Keep `server/app.js` as the single source of truth—reuse helpers when adding new endpoints.
- **Rate limiting**: HackerRank public endpoints are unauthenticated, so consider adding caching or rate protection if you expect heavy traffic.
- **Testing**: No automated tests yet; manual testing via browsers and direct `curl` calls is recommended before deploys.

---

## Roadmap Ideas

- Add automated screenshots of the SVG for social cards.
- Persist cached responses in Redis/Upstash to reduce HackerRank requests.
- Expand the front-end with multi-theme previews and Live Playground.
- Provide CLI/REST endpoints for bulk generation.

---

Happy coding! If you build something cool with the HackerRank Stats Card, feel free to open an issue or PR. 🚀

## 👨‍💻 Author & Credits

**Built and maintained by  
[💚 Shaon Majumder](https://shaonresume.netlify.app)**  
Senior Software Engineer — AI & Scalability

### 🔗 Professional Links

- **Portfolio:** https://shaonresume.netlify.app
- **GitHub:** https://github.com/ShaonMajumder
- **LinkedIn:** https://www.linkedin.com/in/shaonmajumder
- **Medium Author Page:** https://medium.com/@shaonmajumder
- **Resume (Google Doc):** https://docs.google.com/document/d/1frKGGkaE1nG9G8mTkxUoPfcU0jppSZYOy4VMPTlIb-Y/edit?tab=t.0
