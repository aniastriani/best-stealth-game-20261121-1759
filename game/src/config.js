// Lanterns of the Quiet Archive — every tuning number and colour in one
// place. The playfield is a fixed 1280x720 logical area; the renderer
// scales it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 115,
  /** Seconds a caught player waits before the level restarts. */
  caughtPause: 1.4,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 168,
  investigateSpeed: 118,
  /** How far a guard can see, in pixels. */
  sightRange: 235,
  /** Half of the vision cone's angle, in radians. */
  sightHalfAngle: 0.62,
  /** Suspicion gained per second while the player is plainly visible. */
  spotRate: 95,
  /** Suspicion gained per second while the player is visible but sneaking. */
  sneakSpotRate: 42,
  /** Suspicion lost per second while the player is out of sight. */
  calmRate: 26,
  /** Suspicion at which a guard stops to stare, and at which it gives chase. */
  suspectAt: 45,
  chaseAt: 100,
  /** Seconds a chasing guard keeps hunting after losing sight. */
  chaseMemory: 5,
  /** Distance at which a chasing guard catches the player. */
  catchDistance: 26,
};

export const PEBBLE = {
  startCount: 3,
  /** How far a tossed pebble flies from the player, at most. */
  throwRange: 300,
  /** Radius in which guards hear a pebble land. */
  hearRadius: 260,
  /** Radius in which running footsteps are heard. */
  footstepRadius: 150,
};

export const LIVES = 3;

export const PALETTE = {
  floorA: '#20242e',
  floorB: '#232833',
  floorLine: '#2b3040',
  wall: '#3a3f52',
  wallTop: '#4a5068',
  shelf: '#5a4632',
  shelfEdge: '#7a5f42',
  crate: '#6b5636',
  crateEdge: '#8a744a',
  pillar: '#444a63',
  scroll: '#f2d98c',
  exitClosed: '#3f6b4f',
  exitOpen: '#58d68a',
  player: '#e8b64c',
  playerHood: '#7a5a1e',
  guard: '#c94f42',
  guardHelmet: '#8f2f26',
  coneCalm: 'rgba(232, 196, 76, 0.20)',
  coneSuspect: 'rgba(232, 150, 60, 0.34)',
  coneChase: 'rgba(220, 70, 55, 0.38)',
  lanternGlow: 'rgba(255, 196, 90, 0.16)',
  dark: 'rgba(8, 10, 18, 0.55)',
  hud: '#d8dceb',
  hudDim: '#8a90a5',
  danger: '#ff5a4a',
  gold: '#f2c14e',
};
