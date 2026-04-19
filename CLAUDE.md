# BillMasterFlex - AI Chat Application

## Project Overview

AI chat application with document, sheet, image, and code artifact generation. Built on Vercel's AI Chat SDK template, deployed on Vercel.

**Stack**: Next.js 15 App Router + Drizzle ORM + NextAuth 5 beta + AI SDK (xAI) + Vercel Postgres/Blob/Redis

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, PPR experimental) |
| ORM | Drizzle ORM + PostgreSQL |
| Auth | NextAuth 5 beta (Auth.js) |
| AI | @ai-sdk/xai (xAI grok-2-vision-1212, grok-3-mini-beta) |
| Deployment | Vercel (postgres, blob, redis, otel, functions) |
| UI | shadcn/ui, Radix UI, Tailwind CSS, Framer Motion |
| Editors | CodeMirror 6, ProseMirror, React Data Grid |
| Package Manager | pnpm |

## Commands

```bash
cd ~/billmasterflex

pnpm dev          # Dev server (turbo) — http://localhost:3000
pnpm build        # Run migrations + production build (requires DB)
pnpm start        # Production server
pnpm lint         # ESLint + Biome lint
pnpm lint:fix     # Auto-fix lint
pnpm format       # Format with Biome
pnpm db:generate  # Generate Drizzle migrations
pnpm db:studio    # Drizzle Studio
pnpm db:push      # Push schema to DB
pnpm db:pull      # Pull schema from DB
pnpm db:migrate   # Run migrations
pnpm db:check     # Check migration status
pnpm test         # Playwright E2E tests
pnpm ai           # AI SDK tools
```

## Architecture

### App Router Structure

```
app/
├── (auth)/              # Auth routes (login, register)
│   └── api/auth/        # NextAuth handlers + guest access
├── (chat)/              # Main chat interface
│   ├── [id]/           # Individual chat sessions
│   └── api/chat/       # Chat API endpoints
├── api/                 # API routes
│   └── auth/           # Auth handlers
├── layout.tsx           # Root layout
└── page.tsx            # Root redirect
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `lib/ai/` | AI providers, prompts, models, tools |
| `lib/ai/tools/` | AI tool executors (createDocument, updateDocument, getWeather, requestSuggestions) |
| `lib/db/` | Drizzle schema, queries, migrations |
| `lib/editor/` | ProseMirror-based rich text editing |
| `components/` | React components (ui/, chat/, artifacts/) |
| `artifacts/` | Artifact rendering (text, code, sheet, image) |
| `hooks/` | Custom React hooks |

## AI System

**Provider**: xAI via `@ai-sdk/xai`

**Models**:
- `grok-2-vision-1212` — main chat model (vision-capable)
- `grok-3-mini-beta` — reasoning model (with `extractReasoningMiddleware`)
- Title model and artifact model (from `models.test.ts`)

**Tools** (executed by AI with `toolCall`):
- `createDocument` — create a new document artifact
- `updateDocument` — update an existing document
- `getWeather` — weather lookup
- `requestSuggestions` — get editing suggestions for a document

**Streaming**: Resumable streams via Redis for long conversations.

## Database Schema (Drizzle)

| Table | Purpose |
|-------|---------|
| `User` | id, email, password |
| `Chat` | id, title, userId, visibility, createdAt |
| `Message_v2` | id, chatId, role, parts (JSON), attachments (JSON), createdAt |
| `Vote_v2` | chatId, messageId, isUpvoted |
| `Document` | id, title, content, kind, userId, createdAt |
| `Suggestion` | id, documentId, suggestions |
| `Stream` | id, chatId, createdAt |

## Auth

- **NextAuth 5 beta** — Credentials provider + OAuth
- **Guest access** — `guest-<timestamp>@guest.com` pattern via `GUEST_SECRET`
- **Middleware** protects all routes except `/api/auth`, `/login`, `/register`, `/ping`
- Unauthenticated users redirected to guest auth flow

## Environment Variables

```env
AUTH_SECRET=           # Required: Random secret for NextAuth (32+ chars)
GUEST_SECRET=          # Required: Secret for guest authentication
XAI_API_KEY=           # Required: xAI API key for chat models
POSTGRES_URL=          # Required: PostgreSQL connection string
BLOB_READ_WRITE_TOKEN= # Required: Vercel Blob storage
REDIS_URL=             # Optional: For resumable streams
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/ai/providers.ts` | Model configuration (xAI models) |
| `lib/ai/prompts.ts` | System prompts |
| `lib/db/schema.ts` | Drizzle schema definitions |
| `lib/db/queries.ts` | All database query functions |
| `middleware.ts` | Route protection and auth checks |
| `app/(chat)/api/chat/route.ts` | Main chat API endpoint |
| `components/artifact.tsx` | Artifact rendering system |
| `lib/editor/` | ProseMirror-based document editing |

## Known Issues

1. **TypeScript error in `components/document-preview.tsx:105`** — `RefObject<HTMLDivElement | null>` not assignable to `RefObject<HTMLDivElement>`. Fix: change `PureHitboxLayer` prop type to accept `| null`.

2. **bcrypt-ts + Edge Runtime** — `lib/db/utils.ts` uses Node.js APIs (`setImmediate`, `process.nextTick`) not available in Edge Runtime. Affects `middleware.ts` which runs at Edge.

3. **Build requires DB** — `pnpm build` runs migrations first, which requires `POSTGRES_URL`. Use `next build` directly if DB unavailable.

## Deploy

This project is designed for **Vercel one-click deploy**. All secrets are managed via Vercel environment variables.
