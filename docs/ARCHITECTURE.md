# The Dialectic — Architecture

## Overview

The Dialectic is a fully client-side React application. It orchestrates a turn-based
debate between two Gemini-powered personas and renders the emerging argument as a
live D3 force-directed graph. There is no backend; the user supplies their own
Gemini API key, stored in `localStorage`.

```
┌──────────────────────────────────────────────────────────┐
│ App.tsx                                                    │
│                                                            │
│   useDebate()  ◀── central state + async debate loop       │
│     │                                                      │
│     ├── utils/prompt.ts   buildDebatePrompt / systemInstr. │
│     ├── utils/nlp.ts      extractKeywords / cleanWord      │
│     └── utils/errors.ts   getErrorMessage / isDebateStopped│
│                                                            │
│   SettingsPanel   DebateColumn ×2   DebateCanvas (D3)      │
└──────────────────────────────────────────────────────────┘
```

## State & orchestration — `hooks/useDebate.ts`

`useDebate` owns all debate state: topic, rounds, current round/turn, history,
streaming text, summary, error, and the graph `nodes`/`links`. Because the debate
runs in an async loop while React state updates asynchronously, a `debateStateRef`
mirror keeps the loop reading fresh values for pause/stop checks.

Flow of `startDebate()`:

1. Validate the API key and initialize the graph anchors (thesis + two speakers).
2. For each round, run Persona A then Persona B via `streamTurn`.
3. `streamTurn` builds the prompt (`buildDebatePrompt`), streams the response, and
   incrementally feeds completed word-slices into `updateGraphWithKeywords`.
4. Completed turns are appended to `history`; `checkPauseAndStatus` supports
   pause/resume and cooperative cancellation (the `"Debate stopped"` signal).

## Pure logic (unit-tested)

- **`utils/prompt.ts`** — `SYSTEM_A`/`SYSTEM_B` persona instructions,
  `systemInstructionFor`, `speakerLabel`, `formatHistory`, and `buildDebatePrompt`.
  Extracting these makes prompt wording verifiable without invoking the API.
- **`utils/nlp.ts`** — `cleanWord` (trim non-alpha edges) and `extractKeywords`
  (tokenize, drop stop words / short words, de-duplicate, capitalize).
- **`utils/errors.ts`** — `getErrorMessage` / `isDebateStopped` normalize
  `unknown` catch values without `any`.

## Argument graph — `components/DebateCanvas.tsx`

A D3 force simulation (`forceLink`, `forceManyBody`, `forceCenter`, collision)
renders nodes for the thesis, each speaker, and every extracted keyword.

- New keyword → new node anchored near its speaker; reused by the opponent →
  recolored `neutral`.
- Links connect keywords to their speaker anchor, to the central thesis (weaker),
  and sequentially to the previous keyword in the turn.
- Node styling resolvers (`getNodeRadius`/`getNodeColor`/`getNodeStrokeColor`) are
  declared before the rendering effect that uses them. Zoom/drag interactions use
  typed D3 event handlers; the two unavoidable `d3.call`/enter-merge casts are
  explicitly annotated.

## Data model — `types.ts`

- `DebateTurn` — `{ round, speaker, content, keywords }`.
- `GraphNode extends d3.SimulationNodeDatum` — `{ id, label, group, count, roundFirstSeen }`.
- `GraphLink extends d3.SimulationLinkDatum<GraphNode>` — `{ source, target, value }`.

## Security

The Gemini key is entered by the user, persisted only in `localStorage`, and used
solely to construct the client-side `GoogleGenAI` instance. It is never transmitted
to any origin other than Google's API. No secrets are committed to the repository.

## Extending

- **New persona:** add a system prompt + `Speaker` value in `utils/prompt.ts` and
  extend the turn loop in `useDebate`.
- **New graph relationship:** extend `updateGraphWithKeywords` (keep it pure where
  possible for testability).
- **Deployment:** set the canonical origin in `index.html`, `public/robots.txt`
  and `public/sitemap.xml`, then `npm run build` and serve `dist/`.
