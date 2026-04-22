# Codeon

Codeon is an AI-powered developer workspace built with Next.js.

## Current MVP Capabilities

- Multi-session AI chat with local persistence
- Optional user-identity based cloud session sync
- Text + image context chat through Groq
- File upload support for images, code/text, PDF, DOCX, and ZIP project bundles
- JavaScript and Python sandbox execution from dashboard
- Auto-debug analysis and iterative auto-fix execution
- Prompt-to-HTML UI generation with live preview
- Copy/download generated UI
- Project indexing and retrieval-aware chat context
- MVP scaffold generation from product brief (`/generate-mvp ...`)

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS
- Groq chat completions API

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create local environment variables.

```bash
cp .env.example .env.local
```

3. Fill `GROQ_API_KEY` in `.env.local`.

4. Run development server.

```bash
npm run dev
```

## Environment Variables

- `GROQ_API_KEY` (required)
- `GROQ_MODEL` (optional, defaults to `llama-3.1-8b-instant`)
- `GROQ_VISION_MODEL` (optional, defaults to `llama-3.2-11b-vision-preview`)
- `GROQ_BUILD_MODEL` (optional, defaults to `GROQ_MODEL`)
- `GROQ_DEBUG_MODEL` (optional, defaults to `GROQ_MODEL`)
- `GROQ_PROJECT_MODEL` (optional, defaults to `GROQ_MODEL`)
- `SUPABASE_URL` (optional; enables Supabase session persistence)
- `SUPABASE_SERVICE_ROLE_KEY` (optional; required with `SUPABASE_URL`)

## API Routes

- `POST /api/chat` -> AI chat completion
- `POST /api/files` -> file/image parse for chat attachment flow
- `POST /api/run` -> JS/Python sandbox execution
- `POST /api/run/autofix` -> iterative run/debug/fix loop
- `POST /api/build` -> UI generation to single HTML
- `GET/POST /api/sessions` -> pull/push session sync for a userId
- `GET/POST /api/project/index` -> build or read project index metadata
- `POST /api/project/query` -> retrieve relevant file snippets for a query
- `POST /api/project/generate` -> generate MVP scaffold files from brief
- `POST /api/debug/analyze` -> AI debug analysis from runtime errors
- `GET /api/system/status` -> backend persistence mode and config status

## Notes

- Supabase schema file is available at `supabase/migrations/20260422_codeon_core.sql`.
- Persistence falls back to local file storage if Supabase env vars are missing or unavailable.
