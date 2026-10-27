---
description: Start the Vite dev server for the portfolio
---

Start the Vite development server for this site.

1. If `node_modules/` is missing, run `npm install` first.
2. Check whether a Vite dev server is already running for this project (e.g. something
   listening on port 5173). If it is, don't start another one — just report its URL.
3. Otherwise run `npm run dev` in the background (it's a long-running process, so it
   must not block the session).
4. Wait for Vite to print its "Local:" URL, then report that URL to the user.
   If it fails to start, show the relevant error lines.
