# WhatsApp Web Clone

A pixel-faithful **WhatsApp Web (dark theme)** clone in a single self-contained
HTML file — no frameworks, no build step, no external JS/CSS. Avatars come from
picsum.photos seeds; every icon is an inline SVG.

## Features

- **Chat list panel** — 8 realistic chats, pinned chats on top, unread badges,
  last-message snippets with tick states, live search filtering
- **Conversation view** — message bubbles with tails, incoming `#202c33` /
  outgoing `#005c4b`, date divider pills, colored sender names in groups
- **Full send flow** — type + Enter/send → `✓` → `✓✓` grey → `✓✓` blue,
  then the contact shows "typing..." with an animated bubble and a
  **contextual bot reply** (each chat has its own personality/keywords;
  groups reply as random participants)
- **Emoji picker** — 32-emoji grid, inserts at the cursor
- **Mic/send toggle** — send button appears only when the input has text
- **Chat doodle background** via pure CSS radial-gradient dots
- Header statuses: "online", "last seen...", group participant lists

## Content

Seeded realistic conversations: movie plans with Priya, match talk with Arjun,
family group, work standup group ("Project Nova 🚀"), Goa trip planning with
the college gang — no lorem ipsum anywhere.

## Run

Just open the file — works from `file://` and from any static host:

```bash
# option 1: double-click index.html
# option 2: serve it
python3 -m http.server 8000   # then open http://localhost:8000
```

## Files

- `index.html` — everything (CSS + JS inline, commented sections)
