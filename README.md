# Golf Performance Tracker — Build Snapshot
Date: 2026-04-03

## App 1: Golf Tracker
File: golf-tracker.html
Deploy: https://www.perplexity.ai/computer/a/golf-tracker-929lhutFT_y9w5kWumkaAQ
- Single HTML file, no build needed
- UK Golf API RapidAPI key baked in
- Saves rounds to Golf Performance backend

## App 2: Golf Performance (History + Analytics)
Source: shared/, server/, client/
Deploy: https://www.perplexity.ai/computer/a/golf-performance-tf_rwWo0RlaU0mYAF9R.Tg
- Express + SQLite + React + Tailwind
- Build: npm install && npm run build
- Run: NODE_ENV=production node dist/index.cjs

## Key constants
- Hallowes club ID: a8130eaf-cb35-4f83-afdf-297b6de9d6ad
- Hallowes course ID: 8f7e5278-ea88-4971-a0da-237193e71ebc
- Hallowes coords: 53.29296, -1.4615943
- RapidAPI key: 9f4dda10aemsh3329ee04376b39ap15bd9bjsn3c69163c14b0

## Features built (session 2026-04-03)
- Mobile-first hole entry with +/- steppers for score/putts
- Fairway 3-way: Left / Fairway / Right
- GIR state machine: null → green ✓ → red ✗ → null
- Up & Down + Sand Save: mutually exclusive, unlock on GIR miss
- Process: SEE IT·FEEL IT·TRUST IT button + par-based checkboxes
  - Traffic light: red <50%, green ≥50%, teal 100%
- Weather: Open-Meteo (no key), topbar pill + detail strip
  - Temp, rain, wind + compass arrow, pressure, course location
- UK Golf API: course search, auto-load all tees with yardages
- Player presets: name + handicap, persisted in localStorage
- Round history: POST to Express/SQLite backend
- Analytics: score trend sparkline, FIR/GIR/putts bars, round table
