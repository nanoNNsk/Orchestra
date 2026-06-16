# Orchestra — Sprint Planning

| Sprint | Goal | Status |
|--------|------|--------|
| S1 — First Real Reply | Make the org chart *run* end to end on the Codex SDK | ✅ shipped |
| **S2 — See the Company** | **Give the chat app history + a live view of the company** | 🔵 active |

Track live status in `track-progress.html`.

---

# Sprint S2 — "See the Company" (active)

**Dates:** 2026-06-16 → 2026-06-18 (focused mini-sprint) | **Team:** 1 (solo)
**Sprint Goal:** In the chat app, the Chairman can see the company they're talking
to — how many roles, who they are, what each can do — and their conversation
survives a refresh. The roster view feels *alive*: a newly hired role appears the
moment it's hired.

> Decisions locked in brainstorming: history = localStorage (single conversation);
> Company view = right drawer, collapsed, **read-only**; new-role detection rides
> the `hired`/`roleId` already returned by `orchestrate()`.

## Capacity

Solo. Small sprint (~3 dev-days of work). Plan to ~75%.

| Person | Available days | Allocation | Notes |
|--------|---------------|------------|-------|
| You | 3 | ~2.25 effective | Mostly frontend; backend is one endpoint |
| **Total** | **3** | **~2.25 dev-days** | |

## Sprint Backlog

| Priority | Item | Est | Dependencies |
|----------|------|-----|--------------|
| **P0** | `GET /roster` endpoint — serve roster summary as JSON (reuse `review.mjs` logic) | 0.5d | none |
| **P0** | Company drawer in `chat.html` — collapsed toggle, headline counts, **read-only** | 0.5d | /roster |
| **P0** | Drawer disclosure: department → role → role's skills (3 zoom levels) | 0.75d | drawer |
| **P0** | Conversation history in localStorage — persist messages + traces, restore on load, **Clear** button | 0.5d | none |
| **P1** | Skill reverse index — click a skill, see which roles have it (computed client-side) | 0.25d | disclosure |
| **P1** | Hire event — 🆕 badge + toast when `/ask` returns `hired:true`; refresh drawer after each reply | 0.5d | drawer |
| **P2** *(stretch)* | Multi-conversation list (ChatGPT-style sidebar) | 1d | history |
| **P2** *(stretch)* | Server-side conversation persistence (multi-device) | 1d | history |
| **P2** *(stretch)* | Richer skill descriptions / panel search-filter | 0.5d | disclosure |

**Planned capacity:** ~2.25 dev-days
**P0 load:** ~2.25d (100% of plan) · **P1:** +0.75d (overflow) · P2 only if P0+P1 fly

**Succeeds if all P0 ships:** the app shows the company and remembers the chat.
P1 is the delight layer (reverse index + the live-hire moment). P2 is later.

## What to cut if it slips

Cut P2 entirely → then P1 hire-toast → then P1 reverse index. Never cut P0.
A static-but-correct drawer + refresh-safe chat is a complete, shippable S2.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| "Clear chat" implies the company forgot, but role memory persists server-side | Confusing mental model | Label the Clear button: clears *your view*, not the company's memory. Don't try to sync the two layers. |
| Drawer pulls the Chairman into micromanaging roles | Breaks the "talk to the CEO only" premise | Keep the drawer strictly **read-only** — no edit/fire/assign buttons. Consolidation stays a CLI action. |
| Roster grows; drawer gets long | Clutter | Departments collapsed by default; expand on click. |
| 3-column layout breaks on small screens | Unusable on mobile | Drawer is an overlay, not a fixed column; defer true mobile polish (desktop-first, solo use). |

## Definition of Done

- [x] `GET /roster` returns departments, roles, and skills (smoke-tested → 200)
- [x] Drawer shows live counts + department → role → skill, read-only — **verified in real Chrome (headless) + jsdom**
- [x] Refreshing the page keeps the current conversation; Clear empties it (and says it doesn't wipe company memory) — **verified in `web/chat.test.mjs`**
- [x] Hiring a role during chat surfaces it in the drawer (badge/toast via `hired`/`roleId`) — **verified in `web/chat.test.mjs`**
- [x] README updated (chat app section) to match
- [x] No write actions on roster from the UI (premise intact)

**Verification:** headless Chrome confirmed the live render; `web/chat.test.mjs`
(jsdom) drives send/clear/reload and asserts history, toast, and badge. `npm test`
runs the whole suite (validate + hire + memory + chat) green.

**Outcome:** all P0 + P1 shipped. P2 (multi-conversation list, server-side
persistence, richer skill detail) deliberately deferred — not part of the S2
commitment; carried to "Next".

## Key Dates

| Date | Event |
|------|-------|
| 2026-06-16 | Sprint start |
| 2026-06-17 | Check-in — P0 drawer + history working? |
| 2026-06-18 | Sprint end / demo (see the company grow live) |

---

# Sprint S1 — "First Real Reply" (shipped)

**Goal:** a Chairman request routes CEO → department head → role and returns one
consolidated reply, on the Codex SDK. **All P0 + P1 + both P2 stretch items shipped.**

Delivered: Codex SDK spike · CEO loop (`orchestrate()`) · roster loader ·
skill→tool mapping · reuse-or-hire routing with re-validation · per-role memory ·
roster-review (`status`) · chat UI (Node `http` + `web/chat.html`). Self-checks:
`validate.py`, `hire.test.mjs`, `memory.test.mjs` all green.

*Note:* the UI shipped as plain HTML + Node `http` rather than React + Vite —
same outcome, no build step; upgrade later only if the UI grows.
