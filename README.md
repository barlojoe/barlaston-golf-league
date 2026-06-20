# ⛳ Barlaston Golf League — Dashboard

A self-contained, **offline** localhost app for running your 4-player midweek league at Barlaston Golf Club. No internet, no accounts, no `npm install`. Your data lives in a single `data.json` file next to the app.

---

## How to run it

You need **Node.js** installed (any recent version). If you don't have it, get it free from https://nodejs.org (the "LTS" download).

### Mac
1. Unzip this folder somewhere (e.g. your Desktop).
2. Open **Terminal**, then type `cd ` (with a space) and drag the unzipped folder onto the Terminal window, press Enter.
3. Run:  `node server.js`
4. Open your browser at **http://localhost:3000**

*(Or just double-click `start-mac.command`.)*

### Windows
1. Unzip this folder.
2. Double-click **`start-windows.bat`**.
3. Open your browser at **http://localhost:3000**

To stop the app, close the terminal window or press **Ctrl + C**.

---

## First-time setup (2 minutes)

1. **Players tab** → add your 4 players and their handicaps.
2. **Course tab** → it's pre-filled with a par-69 Barlaston layout. Check each hole's **par** and **stroke index** against your physical scorecard, fix any that differ, and hit **Save Course**.
3. **Settings tab** → confirm the stake (£3/week), total rounds (20), and bonus points. Save.
4. **Enter Scores tab** → click **+ New Round**, type each player's score hole-by-hole, and **Save Card** for each.
5. **Leaderboard tab** → watch the honours board and pot update automatically.

---

## How scoring works

**Base — net Stableford** (handicap strokes applied per hole by stroke index):
- Net double bogey or worse = 0 pts
- Net bogey = 1 · Net par = 2 · Net birdie = 3 · Net eagle = 4 (and up)

**Bonus points** (configurable in Settings):
- Each **gross birdie** = +1
- Each **gross eagle** = +2
- **Win the week** (highest weekly total) = +5
- **2nd that week** = +2

**Weekly total** = Stableford + birdie/eagle bonuses + placement bonus.
**Season points** = the sum of every weekly total. Most points at the end of 20 rounds wins the pot.

---

## The pot

- £3 per player × 4 players = **£12 per week**
- Over 20 rounds = **£240 projected season pot**
- The dashboard tracks the current pot (weeks actually played) and the projected season prize.
- Winner takes all by default — but it's your league, split it however you like.

---

## Notes

- **Adding rounds:** unlimited. Add as many as you want from the Enter Scores tab.
- **Missed a week?** Just don't enter a card for that player that round — they score 0 for it.
- **Your data** is saved in `data.json`. Back it up by copying that file. Delete it (or use **Settings → Reset**) to start a fresh season.
- Everything runs on your own machine. Nothing is sent anywhere.

Enjoy the season. 🏆
