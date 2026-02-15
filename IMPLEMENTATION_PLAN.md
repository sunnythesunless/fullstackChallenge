# Smart Blog Editor — Implementation Plan

Build a production-ready Notion-style blog editor to nail the hiring challenge. Every grading criterion is explicitly addressed.

---

## Key Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| Backend framework | **FastAPI** | Async-native, auto-generates OpenAPI docs, fastest Python option — shows maturity |
| Database | **SQLite** (via SQLAlchemy + aiosqlite) | Zero-ops, portable for demo, still uses proper ORM patterns |
| Lexical state storage | **JSON blob** (not HTML) | Lossless round-trip; editor reloads exact state. HTML stored as a secondary column for read-only rendering/SEO |
| Auto-save | **Custom debounce hook** (no lodash) | Graders explicitly want to see YOUR implementation of the algorithm |
| AI provider | **Gemini API** (free tier) | Free, generous quota, streaming support |
| Deployment | **Render** (backend) + **Vercel** (frontend) | Free tiers, easy setup, gives a deployed link fast |

---

## Proposed Project Structure

```
d:\hiringCH\
├── server/                         # Python backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, lifespan
│   │   ├── config.py               # Settings via pydantic-settings
│   │   ├── database.py             # SQLAlchemy async engine + session
│   │   ├── models/
│   │   │   ├── post.py             # Post ORM model
│   │   │   └── user.py             # User ORM model (JWT bonus)
│   │   ├── schemas/
│   │   │   ├── post.py             # Pydantic request/response schemas
│   │   │   └── user.py             # Auth schemas
│   │   ├── routers/
│   │   │   ├── posts.py            # /api/posts/* endpoints
│   │   │   ├── ai.py               # /api/ai/generate endpoint
│   │   │   └── auth.py             # /api/auth/* (bonus)
│   │   ├── services/
│   │   │   ├── post_service.py     # Business logic
│   │   │   └── ai_service.py       # LLM integration
│   │   └── utils/
│   │       └── auth.py             # JWT helpers
│   ├── tests/
│   │   ├── test_posts.py
│   │   ├── test_auth.py
│   │   └── test_ai.py
│   └── requirements.txt
│
├── client/                         # React frontend
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js           # Axios instance, interceptors
│   │   ├── stores/
│   │   │   ├── editorStore.js      # Zustand — editor state, auto-save
│   │   │   └── authStore.js        # Zustand — JWT token, user
│   │   ├── hooks/
│   │   │   ├── useDebounce.js      # Custom debounce hook (DSA focus)
│   │   │   └── useAutoSave.js      # Orchestrates debounce + API call
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── BlogEditor.jsx  # Lexical editor wrapper
│   │   │   │   ├── Toolbar.jsx     # Formatting toolbar
│   │   │   │   └── plugins/       # Lexical plugins
│   │   │   ├── Sidebar/
│   │   │   │   └── DraftsList.jsx  # Drafts navigation
│   │   │   ├── AI/
│   │   │   │   └── AiPanel.jsx     # AI generate/fix grammar panel
│   │   │   └── Auth/
│   │   │       ├── Login.jsx
│   │   │       └── Signup.jsx
│   │   └── pages/
│   │       ├── EditorPage.jsx
│   │       └── PublishedPage.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── ARCHITECTURE.md                 # LLD documentation (deliverable)
├── README.md                       # Setup, auto-save logic, schema rationale
├── IMPLEMENTATION_PLAN.md          # This file
└── architecture-diagram.png        # System architecture diagram
```

---

## Backend — FastAPI + SQLite

### Database Schema

```python
class Post:
    id            = Column(String, primary_key=True, default=uuid4)
    title         = Column(String, nullable=False, default="Untitled")
    content_json  = Column(JSON)          # Lexical editor state (lossless)
    content_html  = Column(Text)          # Rendered HTML (for read-only / SEO)
    status        = Column(String, default="draft")  # "draft" | "published"
    author_id     = Column(String, ForeignKey("users.id"), nullable=True)
    created_at    = Column(DateTime, default=utcnow)
    updated_at    = Column(DateTime, onupdate=utcnow)

class User:   # Bonus
    id            = Column(String, primary_key=True, default=uuid4)
    email         = Column(String, unique=True)
    password_hash = Column(String)
    created_at    = Column(DateTime, default=utcnow)
```

> [!IMPORTANT]
> Storing Lexical state as JSON is the **critical design decision** the graders are looking for. It allows lossless reload. The `content_html` column is secondary — for published read views only.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/` | Create a new draft |
| `GET` | `/api/posts/` | List all posts (with status filter) |
| `GET` | `/api/posts/{id}` | Get single post |
| `PATCH` | `/api/posts/{id}` | Update content (auto-save target) |
| `POST` | `/api/posts/{id}/publish` | Flip status → published |
| `DELETE` | `/api/posts/{id}` | Delete post |
| `POST` | `/api/ai/generate` | AI summary / grammar fix |
| `POST` | `/api/auth/signup` | Register (bonus) |
| `POST` | `/api/auth/login` | Login → JWT (bonus) |

---

## Frontend — React + Lexical + Zustand + Tailwind

### Lexical Editor
- `LexicalComposer` with HeadingNode, ListNode, ListItemNode, QuoteNode
- Custom toolbar: Bold, Italic, Underline, H1/H2/H3, Bullet List, Numbered List
- `OnChangePlugin` captures editor state as JSON → Zustand store
- On load, deserializes JSON from API back into Lexical state (lossless round-trip)

### Auto-Save — Custom Debounce (DSA Focus)

```javascript
// hooks/useDebounce.js — Written from scratch, NO lodash
function useDebounce(callback, delay) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => { callbackRef.current = callback; }, [callback]);

  const debouncedFn = useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  useEffect(() => () => clearTimeout(timerRef.current), []);
  return debouncedFn;
}
```

- `useAutoSave` hook listens to Zustand `editorState` changes, calls debounced `savePost()` after **1.5 seconds** of inactivity
- Shows subtle "Saving…" / "✓ Saved" indicator in the UI

### UI Design (Tailwind)
- Clean Notion/Medium-inspired layout: sidebar + main editor area
- Minimalist typography using Inter font
- Soft shadows, smooth transitions, subtle hover effects
- Responsive: stacks on mobile, sidebar collapses
- Status badge (Draft / Published) with color coding
- Dark/light mode toggle

---

## Verification Plan

### Backend Tests
```bash
cd server
pip install pytest httpx pytest-asyncio
pytest tests/ -v
```
- All CRUD endpoints
- JSON round-trip validation
- Auth flow
- AI endpoint (mocked)

### Frontend Tests
```bash
cd client
npx vitest run
```
- `useDebounce` hook behavior
- Zustand store actions

### Browser Verification
1. Start both servers
2. Create post → type → observe "Saving…" after ~1.5s
3. Refresh → confirm editor reloads exact content
4. Publish → status changes
5. AI panel → generate summary / fix grammar

---

## Timeline

| Phase | Time |
|-------|------|
| Backend (API + DB + Auth) | ~2-3 hours |
| Frontend (Editor + Zustand + Debounce) | ~3-4 hours |
| AI Integration | ~1 hour |
| UI Polish (Tailwind) | ~1-2 hours |
| Documentation + Architecture Diagram | ~1 hour |
| Deploy + Demo Video | ~1 hour |
| **Total** | **~9-12 hours** |
