# heist-game-01

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/jehan771/heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/jehan771/heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Copper Chip** — a casino heist game. Rook Marlowe, cardsharp, hits five rooms of The Copper Chip casino: plan the job, slip past guards with vision cones and sweeping cameras, lift the chip stacks, crack the safes, hack a camera terminal, grab the Golden Chip and walk out the green EXIT before the clock — or the alarm meter — runs out.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests: the game is static files under `game/`, all art drawn procedurally on canvas, all sound synthesized with WebAudio.

## How to play

- **WASD / arrows** move, **click** to walk somewhere, **SHIFT** sprint (loud — guards come to listen), **C** crouch (harder to spot)
- **E** (hold) cracks a safe (+500) or hacks a camera terminal (blinds the nearest camera for 25s)
- **1–5** pick a heist, **ENTER** to see the plan and begin, **P** pause, **M** mute, **R** restart, **ESC** menu
- Take the Golden Chip to open the exit. Finish unseen with all the loot for 3 stars and the ghost bonus.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8ddqhjma&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
