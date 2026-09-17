# Blockade

A two-player Blockade / Quoridor-style board game, built incrementally with
Next.js, React, Tailwind CSS, and (from Step 9 onward) Supabase.

## Status: Step 2 of 18

The project scaffold, home page, and the 9×9 board UI are in place. The
board shows both players at their starting positions, but nothing moves
yet — that's Step 3. See the roadmap below for what's coming.

## Running it locally

You'll need [Node.js](https://nodejs.org/) 18 or later installed.

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

## What to check right now

On the home page (`/`):
- The page loads with the **Blockade** title and two buttons: **Create
  game** and **Join game**.
- Tapping **Join game** reveals a 6-character code input. Typing fewer than
  6 characters keeps the **Join** button disabled; typing exactly 6 enables
  it (it doesn't submit anywhere yet — that's Step 13).
- Tapping **Create game** shows a note that room creation isn't wired up
  yet — that's Step 9 onward.

On the new board preview (`/game`) — this page isn't linked from anywhere
yet, visit it directly at `http://localhost:3000/game`:
- A 9×9 board renders with Player 1's piece (amber) at the bottom-middle
  cell and Player 2's piece (blue) at the top-middle cell — this matches
  the rules' starting positions.
- The header shows "Player 1's turn", both wall counts at 10, and the
  score row shows 0–0.
- The top row has a faint blue tint (Player 2's goal) and the bottom row
  has a faint amber tint (Player 1's goal).
- Nothing is interactive yet — tapping cells does nothing. That's Step 3.

On both pages:
- Resize your browser (or open dev tools' device toolbar) down to a phone
  width — the layout should stay centered and usable, the board should
  stay square and not overflow, and nothing should become too small to
  tap.

## Roadmap

1. ✅ Next.js project + basic home page
2. ✅ 9×9 board UI
3. Local player movement
4. Walls
5. Wall/path validation (no move may fully block a player's path)
6. Win detection
7. Score tracking
8. Rematch flow
9. Create a Supabase project (step-by-step instructions)
10. Database table + Row Level Security policies (SQL provided)
11. Connect Next.js to Supabase
12. Implement Create Game (writes to Supabase)
13. Implement Join Game
14. Supabase Realtime sync
15. Two-browser manual test pass
16. Fix sync/reconnect issues found in testing
17. Mobile polish
18. Production deployment prep (Vercel)

## Project structure

```
pages/
  _app.js       — global app wrapper, imports Tailwind
  index.js      — home page (Create game / Join game)
  game.js       — board preview page (mock/static state for now)
components/
  GameBoard.js  — the 9x9 grid
  BoardCell.js  — a single square on the board
  PlayerPiece.js — a player's game piece
  GameHeader.js — turn indicator + wall counts
  ScoreBoard.js — the match score row
styles/
  globals.css   — Tailwind entry point
lib/            — (empty for now — game logic + Supabase client land later)
```

## Environment variables

None are needed yet. When Supabase is introduced in Step 9, copy
`.env.local.example` to `.env.local` and fill in your project's URL and
anon key. `.env.local` is already git-ignored, so real credentials never
get committed.

## Deploying

Not yet — deployment instructions (GitHub → Vercel) come in Step 18, once
there's a working multiplayer game to deploy.
