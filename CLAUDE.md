# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Entangl** is a quantum-secured multi-party chat application with live eavesdropper detection. It uses Quantum Key Distribution (QKD) to generate cryptographic keys for encrypted messaging.

**Status:** Feature-complete. Core chat + 4 QKD protocols + 3 bonus features (read receipts, encrypted file sharing, user profiles) all working.

## Repository Layout

```
quantum-entangl/              # Repo root
├── CLAUDE.md                  # This file — dev guidance for Claude Code
├── static/                    # Screenshots and report assets
├── frontend/                  # Next.js 16 + React 19 app
│   ├── app/                   # Pages: landing (/), login (/login), chat (/chat)
│   ├── components/
│   │   ├── chat/              # ChatHeader, MessageList, MessageInput, Sidebar
│   │   ├── quantum/           # QBERGauge, KeyTimeline, ProtocolCompare, EavesdropperToggle, QKDLoader, QuantumDashboard
│   │   └── ui/                # 55 shadcn v4 components
│   ├── hooks/                 # use-socket (core), use-mobile (used by shadcn sidebar only)
│   ├── lib/                   # encryption.ts, socket.ts, store.ts, types.ts, utils.ts
│   └── types/                 # aes-js.d.ts
└── backend/                   # Python FastAPI + Socket.IO server
    ├── main.py                # Entry point (uvicorn on port 8000)
    └── app/
        ├── server.py          # FastAPI + Socket.IO ASGI setup, /api/health
        ├── api/               # Empty — no REST routes beyond health check
        ├── ws/                # handler.py (13 events), rooms.py (state), key_distribution.py (RSA-OAEP)
        ├── qkd/               # engine.py, bell_state.py, bb84.py, e91.py, ghz.py
        └── models/            # schemas.py (Pydantic — documentation only, not enforced at runtime)
```

### Backend (`backend/`)
```bash
pip install -r requirements.txt
python main.py                     # or: uvicorn main:app --port 8000 --reload
```

## Architecture

- **Frontend**: Next.js 16.1.6 App Router, no `src/` directory. Files at `app/`, `components/`, `lib/`, `hooks/` directly under `frontend/`.
- **Backend**: Single FastAPI server wrapped with `socketio.ASGIApp(sio, fastapi_app)` for combined REST + WebSocket.
- **Communication**: Socket.IO between frontend (`socket.io-client`) and backend (`python-socketio` async ASGI mode).
- **Encryption**: RSA-2048 (node-forge, browser-side key pairs) + AES-128-CTR (aes-js) for messages. QKD generates the AES key.
- **State**: Zustand for frontend state. No database — in-memory server state, client-side message storage.
- **QKD**: 4 protocols (Bell State T22, BB84, E91, GHZ) via Qiskit `qasm_simulator`. Iterative 128-bit key generation with QBER threshold enforcement.

## Key Technical Constraints

### Frontend
- **Tailwind v4**: CSS-based config in `app/globals.css` — there is no `tailwind.config.ts` file.
- **shadcn v4**: Style is `radix-vega`, 55 components pre-installed in `components/ui/`. Path alias `@/*` maps to project root.
- **Encryption runs client-side**: RSA keygen and AES encrypt/decrypt happen in the browser using `node-forge` and `aes-js`.
- **Three-column layout**: Sidebar (w-64) | Chat (flex-1) | Quantum Dashboard (w-80). Not responsive — no mobile layout.

### Backend
- **Qiskit 1.0+ APIs only**: `from qiskit_aer import Aer`, `transpile()` + `backend.run()` — never use deprecated `execute()`.
- **QKD runs in thread pool**: `asyncio.to_thread()` inside `engine.py`'s `generate_key()` to avoid blocking the event loop.
- **RSA-OAEP uses SHA-256** for both hash and MGF1.
- **All state is in-memory**: No database or file persistence.
- **Pydantic schemas are documentation-only**: Socket.IO handlers use `data.get()` directly, not schema validation.

### Socket.IO Integration
```python
import socketio
from fastapi import FastAPI
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=[])
fastapi_app = FastAPI()
app = socketio.ASGIApp(sio, fastapi_app)
```

## Socket.IO Events

### Client → Server (11 custom events + 2 lifecycle)

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | — | Lifecycle: prints client SID |
| `disconnect` | — | Lifecycle: cleanup user, rooms, emit offline |
| `register` | `{ nickname, publicKey }` | Register user with RSA public key |
| `create_room` | `{ roomName, members[], protocol }` | Create a chat room + trigger QKD |
| `join_room` | `{ roomId }` | Join existing room |
| `leave_room` | `{ roomId }` | Leave a room |
| `message` | `{ roomId, content, encrypted, timestamp, messageId }` | Send encrypted message |
| `typing` | `{ roomId, typing }` | Typing indicator |
| `toggle_eavesdropper` | `{ roomId, enabled }` | Toggle Eve for next keygen |
| `request_rekey` | `{ roomId, protocol? }` | Trigger new QKD key exchange |
| `mark_message_read` | `{ roomId, messageId, timestamp }` | Mark message as read |
| `file_start_transfer` | `{ roomId, attachmentId, attachmentName, attachmentType, attachmentSize }` | Start file transfer |
| `file_chunk` | `{ roomId, attachmentId, chunkIndex, totalChunks, encryptedChunk }` | Send file chunk |

**Implemented:** `update_profile` handler exists in `handler.py` at line 372.

### Server → Client (17 distinct events)

| Event | Payload | Description |
|-------|---------|-------------|
| `registered` | `{ success, onlineUsers[] }` | Registration confirmed |
| `user_online` / `user_offline` | `{ nickname }` | Presence updates |
| `room_created` | `{ roomId, roomName, members[], protocol }` | Room created |
| `member_joined` / `member_left` | `{ roomId, nickname }` | Room membership changes |
| `key_exchange` | `{ roomId, encryptedKey, protocol, qber, timeTaken }` | RSA-encrypted symmetric key |
| `key_rejected` | `{ roomId, qber, reason, protocol }` | Key rejected (high QBER) |
| `rekey_started` | `{ roomId }` | Key generation started |
| `qkd_metrics` | `{ roomId, qber, protocol, keyLength, timeTaken, rounds }` | Dashboard metrics |
| `eavesdropper_status` | `{ roomId, enabled }` | Eve toggle confirmed |
| `message` | `{ roomId, sender, content, encrypted, timestamp, messageId, readBy }` | Relayed message |
| `typing` | `{ roomId, user, typing }` | Typing indicator |
| `message_read` | `{ roomId, messageId, nickname, timestamp }` | Read receipt |
| `file_available` | `{ roomId, attachmentId, attachmentName, attachmentType, attachmentSize, sender }` | File ready |
| `file_chunk` | chunk data | File transfer relay |
| `file_error` | `{ error }` | File transfer error |
| `error` | `{ message }` | General error (validation, room not found, etc.) |

## Known Issues & Tech Debt

### By Design
- **No authentication**: Users self-register with any nickname; only uniqueness is checked.
- **No persistence**: All state (users, rooms, messages, keys) is in-memory. Server restart or browser refresh loses everything.
- **No mobile/responsive layout**: Fixed-width three-column layout doesn't adapt to mobile/tablet screens.

### Open
- **Pydantic schemas not enforced**: `schemas.py` defines models but handlers use `data.get()` — no runtime validation.

### Implementation Notes (non-obvious details)
- **AES-CTR format**: Each encrypted message is `nonce:ciphertext` (random nonce per message)
- **Key transmission**: Backend sends 16 raw bytes via RSA-OAEP; frontend converts to 128-bit binary string for AES
- **Bell State verification**: Fidelity-based — measures fraction of shots yielding |0000⟩, threshold 0.5 separates matches from noise
- **E91 singlet state**: Anti-correlated measurements (`alice != bob` means match, not `==`)
- **Circuit batching**: All QKD protocols batch-transpile and run circuits in a single call for performance
- **create_room**: Filters out offline members; requires at least 2 online members
- **Max-rounds guard**: `engine.py` caps iterations at `key_length * 2` to prevent infinite loops
- **Timestamps**: Seconds (not milliseconds) — `Math.floor(Date.now() / 1000)`
- Full fix history is in `issues.md`