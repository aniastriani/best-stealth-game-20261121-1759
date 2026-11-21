# Lanterns of the Quiet Archive

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/aniastriani/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/aniastriani/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down stealth game set in a moonlit archive at night. You are Wren, a courier who must steal three sealed scrolls from each wing and slip out through the exit — unseen. Wardens walk their patrols with cones of lamplight for eyes: shelves, crates, walls and pillars break their sight, lantern pools make you easier to spot, and running is loud enough to hear. Hold Shift to sneak, toss a pebble with a click to pull a warden away, and watch the eye meter at the top: when it fills, the chase is on.

Three wings grow harder as you go — the Reading Room, the Stacks, and the Vault Wing, where the middle scroll sits in the open under a lantern. Every level is drawn in code with the Canvas 2D API — no image files, no network, no libraries — and every sound is synthesized with the Web Audio API. Vision cones are raycast against the room, so cover really does hide you.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080/ in a desktop browser and play. Keyboard: WASD or arrows to move, Shift to sneak, P to pause, R to restart, M to mute, Enter to start. Click anywhere to toss a pebble toward it.

Screenshot poses for the entry's own screenshots live behind a query string: `?shot=start`, `?shot=play`, `?shot=alert` and `?shot=win`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=nr75efcw&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
