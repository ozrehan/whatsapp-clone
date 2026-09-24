# WhatsApp Web Clone

A pixel-faithful **WhatsApp Web (dark theme)** clone in vanilla HTML/CSS/JS —
no frameworks, no build step. A genuine multi-file project: markup in
`index.html`, styles in `css/`, data + components in `js/`. Avatars come from
picsum.photos seeds; every icon is an SVG symbol in one sprite.

## Features

- **Chat list** — 15 realistic chats, pinned-first ordering, unread badges,
  muted/archive states, live search, archived-chats toggle bar
- **Conversation view** — bubbles with tails, incoming `#202c33` / outgoing
  `#005c4b`, colored sender names in groups, hover actions on every message
- **Send flow** — type + Enter/send → `✓` → `✓✓` grey → `✓✓` blue, contact
  shows "typing..." with an animated bubble, then a **contextual bot reply**
  (each chat has its own personality/keywords; groups reply as participants)
- **Message actions** — reply with quoted preview, star/unstar, delete, copy
- **Starred messages** — dedicated view; clicking a row jumps to the message
  with a flash highlight
- **Attachments** — photo / document / camera menu; image bubbles with
  lightbox viewer, document bubbles
- **Voice messages** — recorder with live timer + waveform preview, playable
  voice bubbles with animated progress
- **Status** — contact status strip with unseen/seen rings, fullscreen viewer
  with timed progress bars, prev/next navigation, reply-to-status
- **Contact & group info** — slide-over panel: shared-media grid, members with
  admin tags, mute, archive, starred shortcut
- **Settings** — profile name editing, notification toggles, four working
  chat wallpapers (doodle, dark, waves, solid)
- **New chat** picker, empty-state welcome screen, mobile back-button layout

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
│   └── panels.css             # slide-over panel, status viewer, lightbox,
│                              #   settings, wallpaper picker, toast
└── js/
    ├── utils/
    │   ├── dom.js             # W.$, W.el, W.esc, W.icon, W.avatar(Img), W.uid
    │   └── format.js          # time, tick marks, duration formatting
    ├── data/
    │   ├── chats.js           # 15 chat definitions (DMs + groups)
    │   ├── messages.js        # 387-message corpus, attached per chat
    │   ├── statuses.js        # status updates with seeds/timestamps
    │   └── replies.js         # per-chat bot personalities & keywords
    ├── store.js               # app state, stars, archive/mute toggles
    ├── components/
    │   ├── chatlist.js        # list rendering, search, archive bar
    │   ├── chatview.js        # conversation open/close, header
    │   ├── bubbles.js         # bubble rendering, hover actions, playback
    │   ├── inputbar.js        # composer, emoji, attach, recorder, quotes
    │   ├── infopanel.js       # slide-over: info, starred, media, members
    │   ├── status.js          # status strip + fullscreen viewer
    │   └── settings.js        # profile, notifications, wallpapers
    ├── bot.js                 # send pipeline, typing simulation, replies
    └── app.js                 # bootstrap: data attach, star seeding,
                               #   sidebar bindings, lightbox, toast
```

## Run

No build step — serve statically (avoids `file://` quirks with the SVG
sprite in some browsers):

```bash
cd whatsapp-clone
python3 -m http.server 8080
# open http://localhost:8080
```

## Notes

- Seeded realistic conversations (movie plans, match talk, family group,
  work standup, Goa trip planning) — no lorem ipsum.
- Placeholder avatars/photos use `https://picsum.photos/seed/<seed>/<size>`
  and need internet access.
