# CLAUDE.md

## Project Overview

Web Reader is a static, client-side web app for reading and listening to web articles via TTS. No backend — everything runs in the browser.

## Tech Stack

- **Language:** Vanilla JavaScript (ES modules)
- **Build:** Vite 5
- **Testing:** Vitest with jsdom
- **Dependencies:** `@mozilla/readability` (article extraction)
- **Deployment:** Cloudflare Pages via GitHub Actions

## Commands

```bash
npm run dev       # Start Vite dev server (with CORS proxy at /dev-proxy)
npm run build     # Build to dist/
npm run preview   # Preview production build
npm test          # Run tests (vitest run)
npm run test:watch # Run tests in watch mode
```

## Architecture

All source is in `src/`:

- `main.js` — App entry point, wires DOM events, manages UI state
- `loader.js` — Fetches pages through CORS proxy, rewrites relative URLs to absolute
- `reader.js` — Wraps Mozilla Readability for article extraction
- `settings.js` — localStorage-backed settings (provider, model, voice, API keys, CORS proxy)
- `tts.js` — Text chunking (sentence-aware, ~900 char max), audio fetching (OpenAI / ElevenLabs), `TTSQueue` class with prefetch-ahead playback

## Testing

Tests are in `tests/` and use Vitest with jsdom environment. Each source module has a corresponding test file. Tests mock `fetch` and `URL.createObjectURL` for API and audio tests.

## Key Design Decisions

- CORS proxy is required — configurable per-user in Settings, dev mode uses Vite's built-in proxy
- TTS chunks are prefetched 2-ahead to eliminate playback gaps
- Blob URLs are revoked immediately after use to prevent memory leaks
- No framework — vanilla DOM manipulation throughout
- All API keys stay in browser localStorage, never sent to any server except the TTS provider
