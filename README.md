# AI Customer Support Chat

![alt text](<screenshot.png>)

A mobile-first customer support chat widget: React frontend talking to a
Node WebSocket backend, which streams responses from the Claude API.

```
ai-support-chat/
├── backend/     Node + Express + ws — bridges the browser to the Claude API
└── frontend/    React + Vite — the chat UI
```

## How it works

1. The browser opens a WebSocket connection to the backend (`/ws`).
2. When the person sends a message, the frontend pushes
   `{ type: "user_message", text }` over the socket.
3. The backend appends it to that connection's conversation history and
   calls the Claude API with `stream: true`.
4. As tokens arrive, the backend forwards `assistant_chunk` events over the
   same socket, and the UI appends them to a live bubble — giving the
   token-by-token streaming feel. `assistant_done` closes out the turn.

Conversation history is kept in memory per-socket (not persisted), so a
page refresh starts a fresh conversation. Swap in a database or Redis if
you need history to survive reconnects.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and paste your Anthropic API key
npm run dev
```

The server listens on `http://localhost:8787` and exposes the WebSocket at
`ws://localhost:8787/ws`. Get an API key from the
[Claude Platform console](https://platform.claude.com).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # only needed if your backend isn't on localhost:8787
npm run dev
```

Open the URL Vite prints (defaults to `http://localhost:5173`). Shrink the
browser window or open dev tools' device toolbar to see the mobile layout —
it's the primary target, and the desktop view is just a centered card.

## Customizing

- **Persona / system prompt** — edit `SYSTEM_PROMPT` in `backend/server.js`.
- **Model** — set `ANTHROPIC_MODEL` in `backend/.env` (defaults to
  `claude-sonnet-5`).
- **Colors / type** — CSS custom properties at the top of
  `frontend/src/App.css` (`--ink`, `--signal`, etc).
- **Reconnect logic** — the current hook (`useSupportSocket.js`) doesn't
  auto-reconnect on drop; add a retry loop in the `onclose` handler if you
  need that for production.

## Production notes

This is a working starting point, not a hardened production service.
Before shipping:

- Add auth so the WebSocket endpoint isn't open to anyone with the URL.
- Rate-limit messages per connection to control API spend.
- Move conversation history to persistent storage if you need it to
  survive reconnects or want transcripts.
- Put the backend behind HTTPS/WSS (e.g. via a reverse proxy) — browsers
  will block `ws://` connections from an `https://` page.
