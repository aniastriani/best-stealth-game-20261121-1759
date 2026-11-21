// Lanterns of the Quiet Archive — the three levels. Each level is plain
// data: rectangles that block movement and sight (walls, shelves, crates,
// pillars), lanterns that pool light on the floor, the three sealed scrolls
// to steal, the exit doorway, where the courier starts, and each warden's
// patrol loop. Nothing here is copied from another game: the rooms, the
// routes and the names are this game's own.
export const LEVELS = [
  {
    name: 'I · The Reading Room',
    hint: 'Stay out of the yellow cones. Shelves and crates break a warden’s sight.',
    playerStart: { x: 70, y: 650 },
    exit: { x: 1180, y: 20, w: 70, h: 60 },
    walls: [],
    cover: [
      { x: 180, y: 150, w: 220, h: 34, kind: 'shelf' },
      { x: 560, y: 150, w: 220, h: 34, kind: 'shelf' },
      { x: 900, y: 150, w: 180, h: 34, kind: 'shelf' },
      { x: 180, y: 420, w: 220, h: 34, kind: 'shelf' },
      { x: 560, y: 420, w: 220, h: 34, kind: 'shelf' },
      { x: 900, y: 420, w: 180, h: 34, kind: 'shelf' },
      { x: 480, y: 300, w: 44, h: 44, kind: 'crate' },
      { x: 760, y: 300, w: 44, h: 44, kind: 'crate' },
      { x: 480, y: 560, w: 36, h: 36, kind: 'pillar' },
      { x: 760, y: 560, w: 36, h: 36, kind: 'pillar' },
    ],
    lanterns: [
      { x: 640, y: 90, r: 150 },
      { x: 320, y: 580, r: 150 },
      { x: 960, y: 580, r: 150 },
    ],
    scrolls: [
      { x: 290, y: 260 },
      { x: 990, y: 260 },
      { x: 640, y: 620 },
    ],
    guards: [
      { waypoints: [[300, 90], [980, 90]] },
      { waypoints: [[980, 630], [300, 630]] },
    ],
  },
  {
    name: 'II · The Stacks',
    hint: 'Three wardens now. A thrown pebble pulls one away — click to toss it.',
    playerStart: { x: 1210, y: 650 },
    exit: { x: 30, y: 20, w: 70, h: 60 },
    walls: [],
    cover: [
      { x: 240, y: 120, w: 34, h: 200, kind: 'shelf' },
      { x: 240, y: 400, w: 34, h: 200, kind: 'shelf' },
      { x: 600, y: 120, w: 34, h: 200, kind: 'shelf' },
      { x: 600, y: 400, w: 34, h: 200, kind: 'shelf' },
      { x: 960, y: 120, w: 34, h: 200, kind: 'shelf' },
      { x: 960, y: 400, w: 34, h: 200, kind: 'shelf' },
      { x: 420, y: 330, w: 200, h: 34, kind: 'shelf' },
      { x: 420, y: 120, w: 44, h: 44, kind: 'crate' },
      { x: 820, y: 560, w: 44, h: 44, kind: 'crate' },
      { x: 120, y: 330, w: 44, h: 44, kind: 'crate' },
    ],
    lanterns: [
      { x: 420, y: 90, r: 140 },
      { x: 860, y: 90, r: 140 },
      { x: 640, y: 640, r: 150 },
    ],
    scrolls: [
      { x: 120, y: 120 },
      { x: 1160, y: 620 },
      { x: 860, y: 360 },
    ],
    guards: [
      { waypoints: [[180, 360], [1100, 360]] },
      { waypoints: [[420, 90], [420, 630]] },
      { waypoints: [[860, 630], [860, 90]] },
    ],
  },
  {
    name: 'III · The Vault Wing',
    hint: 'Four wardens, and the middle scroll sits in the open under a lantern.',
    playerStart: { x: 640, y: 680 },
    exit: { x: 605, y: 20, w: 70, h: 60 },
    walls: [
      { x: 320, y: 0, w: 30, h: 240, kind: 'wall' },
      { x: 320, y: 480, w: 30, h: 240, kind: 'wall' },
      { x: 930, y: 0, w: 30, h: 240, kind: 'wall' },
      { x: 930, y: 480, w: 30, h: 240, kind: 'wall' },
    ],
    cover: [
      { x: 480, y: 140, w: 180, h: 34, kind: 'shelf' },
      { x: 640, y: 520, w: 180, h: 34, kind: 'shelf' },
      { x: 480, y: 330, w: 120, h: 34, kind: 'shelf' },
      { x: 700, y: 140, w: 44, h: 44, kind: 'crate' },
      { x: 560, y: 520, w: 44, h: 44, kind: 'crate' },
      { x: 120, y: 330, w: 44, h: 44, kind: 'crate' },
      { x: 1120, y: 330, w: 44, h: 44, kind: 'crate' },
    ],
    lanterns: [
      { x: 640, y: 90, r: 150 },
      { x: 640, y: 360, r: 170 },
      { x: 640, y: 640, r: 150 },
    ],
    scrolls: [
      { x: 120, y: 90 },
      { x: 1160, y: 90 },
      { x: 640, y: 360 },
    ],
    guards: [
      { waypoints: [[120, 240], [1160, 240]] },
      { waypoints: [[1160, 480], [120, 480]] },
      { waypoints: [[480, 90], [480, 630]] },
      { waypoints: [[800, 630], [800, 90]] },
    ],
  },
];

/** The level at `index`, wrapping never: the last level repeats its name. */
export function levelAt(index) {
  return LEVELS[Math.min(index, LEVELS.length - 1)];
}
