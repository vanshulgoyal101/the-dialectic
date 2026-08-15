# The Dialectic

**AI Philosophical Debate & Live Argument Graph.** The Dialectic stages a
real-time clash between two AI philosophers — **Persona A**, a data-driven
Materialist, and **Persona B**, a classical Existentialist — on any topic you
choose. Their argument streams token-by-token while a live D3 force-directed
knowledge graph maps the concepts each side introduces and where they collide.

Built with React 19, TypeScript, Vite, D3 and the Google Gemini API.

---

## Features

- **Two opposing AI personas** with distinct, strongly-typed system prompts.
- **Real-time streaming** of each turn via the Gemini streaming API.
- **Live argument graph** (D3 force simulation): keywords become nodes, linked to
  their speaker, the central thesis, and sequentially to each other; concepts used
  by both sides turn "neutral".
- **Round control**: configurable rounds, pause/resume, stop and reset.
- **Debate synthesis**: a neutral 100-word summary of the clash on demand.
- **Bring-your-own-key**: your Gemini API key is stored only in `localStorage` and
  sent solely to Google's API endpoint — never to any other server.

---

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL, paste a **Gemini API key** in Settings, pick a topic and
start the debate.

> The app is entirely client-side. The API key never leaves the browser except in
> direct requests to the Google Gemini endpoint.

---

## Scripts

| Script               | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR.                     |
| `npm run build`      | Type-check (`tsc -b`) then production build.  |
| `npm run preview`    | Preview the production build.                 |
| `npm run test`       | Run the Vitest suite in watch mode.           |
| `npm run test:run`   | Run the suite once (CI mode).                 |
| `npm run coverage`   | Run tests with a V8 coverage report.          |
| `npm run lint`       | ESLint over the project (clean).              |

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full breakdown.

```
App.tsx
 ├─ useDebate()  ── orchestrates rounds, streaming, graph state
 │    ├─ utils/prompt.ts   pure prompt + system-instruction builders (tested)
 │    ├─ utils/nlp.ts      keyword extraction / stop-word filtering (tested)
 │    └─ utils/errors.ts   typed error helpers
 ├─ SettingsPanel  ── topic, rounds, API key
 ├─ DebateColumn   ── streamed persona transcripts
 └─ DebateCanvas   ── D3 force-directed argument graph
```

Pure, framework-free logic (prompt construction, keyword extraction, error
normalization) is deliberately separated from the React hook and D3 rendering so
it can be unit-tested in isolation.

---

## SEO

Although interactive, the app ships a full SEO baseline in `index.html`: title,
meta description, keywords, canonical URL, Open Graph + Twitter cards,
`theme-color`, `WebApplication` JSON-LD and a `<noscript>` fallback, plus
`public/robots.txt` and `public/sitemap.xml`. Update the origin
(`https://the-dialectic.pages.dev`) in those files to match your deployment.

---

## Testing

**Vitest** + **Testing Library** (jsdom):

- `src/utils/prompt.test.ts` — prompt/history/system-instruction construction.
- `src/utils/nlp.test.ts` — keyword extraction and stop-word filtering.

```bash
npm run test:run
```

---

## Tech stack

React 19 · TypeScript · Vite 8 · D3 7 · @google/genai · Tailwind CSS 4 · Vitest.
