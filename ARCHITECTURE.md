# Architecture — Smart Blog Editor

## System Overview

This document describes the Low-Level Design (LLD) of the Smart Blog Editor, a Notion-style blog platform with auto-save, AI writing tools, and lossless rich-text persistence.

---

## Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Backend | FastAPI (Python) | Async-native, auto-generated OpenAPI docs, type-safe with Pydantic |
| Database | SQLite via SQLAlchemy + aiosqlite | Zero-ops, portable, proper ORM patterns |
| Frontend | React 19 + Vite 7 | Modern build tooling, fast HMR |
| Rich Text | Lexical (Meta) | Extensible, JSON-serializable state, lightweight |
| State Management | Zustand | Minimal boilerplate, no context prop-drilling |
| Styling | Tailwind CSS 4 | Utility-first, design system via CSS variables |
| Auth | JWT (python-jose + bcrypt) | Stateless, scalable |
| AI | Google Gemini API | Free tier, fast response, streaming support |

---

## Data Flow

### Auto-Save Pipeline

```
User types → Lexical OnChange → Zustand store → useDebounce (1.5s) → PATCH /api/posts/{id}
                                                                         ↓
                                                                   SQLite (JSON column)
```

1. Every keystroke triggers `OnChangePlugin` which serializes the Lexical editor state to JSON.
2. The JSON is stored in the Zustand `editorState` field.
3. `useAutoSave` watches `editorState` and calls a debounced `savePost()`.
4. The debounce hook ensures `savePost()` is only called after **1.5 seconds** of inactivity.
5. `savePost()` sends a PATCH request with the JSON to the backend.
6. The backend persists the JSON in the `content_json` column.

### JSON Round-Trip (Lossless Persistence)

```
Editor State → JSON.stringify → API → SQLite (JSON column) → API → JSON.parse → Editor State
```

This ensures the editor reloads with **exactly** the same content, formatting, and structure. No information is lost.

---

## Database Schema

### Posts Table

```sql
CREATE TABLE posts (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT 'Untitled',
    content_json JSON,              -- Lexical editor state (lossless)
    content_html TEXT,               -- Rendered HTML (read-only / SEO)
    status      TEXT DEFAULT 'draft', -- 'draft' | 'published'
    author_id   TEXT REFERENCES users(id),
    created_at  DATETIME,
    updated_at  DATETIME
);
```

### Users Table

```sql
CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    DATETIME
);
```

**Design Decision:** `content_json` stores the complete Lexical editor state as a JSON blob. This enables lossless round-trip serialization. `content_html` is a secondary column used only for published read-only views and SEO.

---

## API Design

### Layered Architecture

```
Router (HTTP) → Service (Business Logic) → SQLAlchemy (Data Access) → SQLite
```

- **Routers**: Handle HTTP concerns (validation, status codes, error responses)
- **Services**: Contain business logic, decoupled from HTTP layer
- **Models**: SQLAlchemy ORM entities
- **Schemas**: Pydantic models for request/response validation

### Error Handling

All endpoints return consistent error responses:
```json
{
  "detail": "Post not found"
}
```

---

## Frontend Architecture

### State Management (Zustand)

```
editorStore:
  ├── posts[]              — All posts from API
  ├── activePostId         — Currently selected post
  ├── editorState          — Lexical JSON (current editor content)
  ├── title                — Current post title
  ├── isSaving / lastSavedAt — Auto-save status
  ├── fetchPosts()         — GET /api/posts/
  ├── createPost()         — POST /api/posts/
  ├── savePost()           — PATCH /api/posts/{id}
  ├── publishPost()        — POST /api/posts/{id}/publish
  └── deletePost()         — DELETE /api/posts/{id}
```

### Custom Debounce Hook (DSA Focus)

The `useDebounce` hook implements the classical debounce algorithm:

- Uses `useRef` for timer management (avoids unnecessary re-renders)
- Uses `useCallback(callbackRef)` pattern to prevent stale closures
- Properly cleans up timers on unmount (prevents memory leaks)
- Tested with 6 unit tests covering all edge cases

### Component Hierarchy

```
App
├── EditorPage
│   ├── DraftsList (Sidebar)
│   ├── Title Input
│   ├── AiPanel
│   └── BlogEditor
│       ├── Toolbar
│       ├── LexicalComposer
│       │   ├── RichTextPlugin
│       │   ├── HistoryPlugin
│       │   ├── ListPlugin
│       │   ├── OnChangePlugin
│       │   └── LoadStatePlugin (custom)
│       └── ContentEditable
└── PublishedPage (read-only view)
```

---

## Security

- **Password Hashing**: bcrypt (via Python `bcrypt` library directly)
- **JWT Tokens**: Signed with HS256, configurable expiry
- **CORS**: Restricted to configured origins
- **Input Validation**: Pydantic schemas enforce types and constraints

---

## Testing Strategy

| Layer | Tool | Tests | Coverage |
|-------|------|-------|----------|
| Backend API | pytest + httpx | 17 | CRUD, auth, AI, health, JSON round-trip |
| Frontend Hooks | vitest + testing-library | 6 | Debounce timing, unmount cleanup, stale closures |
| Build | Vite | — | Production build verification |
