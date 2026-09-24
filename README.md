# WhatsApp Web Clone


**Live demo:** [https://peaceful-kangaroo-0bf66f.netlify.app](https://peaceful-kangaroo-0bf66f.netlify.app)

A pixel-faithful **WhatsApp Web (dark theme)** clone in vanilla HTML/CSS/JS —
no frameworks, no build step. The frontend is a **real client of a server
API** (`/api`, same origin — see `netlify/functions/api.js`): accounts,
chats, messages, stars and statuses all live on the server. Avatars come
from picsum.photos seeds; every icon is an SVG symbol in one sprite.

## Accounts

- **Sign up / Log in** — the auth screen (WhatsApp-styled, dark #0b141a with
  #00a884 accents) appears when there is no token. Sign up needs a
  username, password and display name; log in needs username + password.
  The JWT is stored in `localStorage` (`wa_token`) and sent as
  `Authorization: Bearer <token>` on every request.
- Any `401` (bad/expired token) clears the token and drops you back to the
  auth screen automatically.
- **Log out** lives in Settings — it clears the token, stops the pollers
  and resets all server state.

## Real messaging

- **Chat list** — `GET /api/chats` (pinned-first, then recent), unread
  badges, muted/archive states, live search, archived-chats toggle bar.
- **Conversation view** — bubbles with tails, incoming `#202c33` / outgoing
  `#005c4b`, colored sender names in groups, hover actions on every message.
- **Send flow** — text / photo (data-URL) / voice note (real `MediaRecorder`
  audio) / reply quotes (`replyTo` message id) are `POST`ed to
  `/api/chats/:id/messages`. Delivery ticks come **from the server**
  (`tick: "sent"` → ✓✓ grey, `"read"` → blue ✓✓) — never computed locally.
- **Real-time = polling** — the open chat polls
  `GET /api/chats/:id/messages?after=<lastTs>` every 2.5s (appends new
  messages, refreshes ticks, renders the server `typing` array); the chat
  list refreshes every 5s. Opening a chat does a full fetch + `POST /read`;
  typing in the composer sends a throttled (4s) `POST /typing`.
- **Message actions** — reply with quoted preview, star/unstar
  (`POST /api/messages/:id/star`, starred view via `GET /api/starred`),
  delete own messages (`POST /api/messages/:id/delete`), copy.
- **Pin / archive / mute** — persisted server-side via
  `POST /api/chats/:id/pin|archive|mute`.
- **New chat** — search users via `/api/users/search?q=` and start a 1:1
  chat, or create a group (name + member picker).
- **Status** — feed from `GET /api/status` (rings + fullscreen viewer with
  timed progress bars, text slides and images), posting text/photo via
  `POST /api/status`, reply-to-status by username.
- **Settings** — profile from `/api/me` (name/username display-only),
  notification toggles, four chat wallpapers (doodle, dark, waves, grid —
  client-side), log out.

## Project structure

```
whatsapp-clone/
├── index.html                 # markup-only shell (all DOM ids)
├── assets/
│   └── icons.svg              # 36-icon SVG sprite
├── css/
│   ├── variables.css          # theme tokens (#0b141a, #005c4b, #00a884 …)
│   ├── base.css               # reset, buttons, inputs, avatar, icon-btn
│   ├── layout.css             # app grid, sidebar, empty state, responsive
│   ├── chatlist.css           # chat rows, badges, search, status strip
│   ├── chat.css               # conversation header, messages area
│   ├── bubbles.css            # message bubbles, meta line, hover actions,
│   │                          #   voice/doc/image bubbles, typing dots
│   ├── inputbar.css           # composer, emoji picker, attach menu,
│   │                          #   reply preview, voice recorder
│   ├── panels.css             # slide-over panel, status viewer, lightbox,
│   │                          #   settings, wallpaper picker, toast,
│   │                          #   starred/new-chat/status-composer rows
│   └── auth.css               # login / sign-up screen (phone-mock card)
└── js/
    ├── utils/
    │   ├── dom.js             # W.$, W.el, W.esc, W.icon, W.avatar(Img)
    │   └── format.js          # server-tick marks, ts -> time/day labels
    ├── api.js                 # fetch wrapper, token in localStorage,
    │                          #   401 -> logout + auth screen
    ├── store.js               # server-backed state (chats, messages,
    │                          #   profile), send/star/delete/pin/archive/
    │                          #   mute mutations, client prefs persisted
    ├── components/
    │   ├── auth.js            # auth screen + W.logout
    │   ├── chatlist.js        # list rendering, search, archive bar
    │   ├── chatview.js        # conversation open/close, header, nudges
    │   ├── bubbles.js         # bubble rendering, hover actions, real
    │   │                      #   voice playback, server ticks
    │   ├── inputbar.js        # composer, emoji, photo upload, real voice
    │   │                      #   recorder, reply quotes, typing pings
    │   ├── infopanel.js       # slide-over: info, starred, new chat,
    │   │                      #   new group, media, members
    │   ├── status.js          # status strip + composer + viewer
    │   └── settings.js        # profile, notifications, wallpapers, logout
    ├── bot.js                 # retired no-op stub (server drives replies)
    └── app.js                 # bootstrap: auth gate, pollers, sidebar
                               #   bindings, lightbox, toast
```

> `js/data/` (old fake chats/messages/statuses/replies) is no longer loaded.

## Run

The frontend must be served from the same origin as the API (requests go to
relative `/api/...`):

```bash
cd whatsapp-clone
netlify dev        # or any static server proxying /api to the functions
# open the site, sign up, start chatting
```

## Notes

- Placeholder avatars use `https://picsum.photos/seed/<seed>/<size>` and
  need internet access.
- Image/voice uploads are data-URLs capped at 1.5MB (API limit).
- Client-side only: wallpaper choice, notification toggles, avatar-seed
  override, status seen-rings (all in `localStorage`).
