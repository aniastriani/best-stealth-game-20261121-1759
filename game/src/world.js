// Lanterns of the Quiet Archive — the world: one level's live state and the
// fixed-step rules that move it. The player sneaks past patrolling wardens,
// steals three sealed scrolls and slips out the exit unseen. Wardens see
// through a cone that shelves, crates, walls and pillars block; standing in
// lantern light makes the courier easier to spot, and running is loud.
import { FIELD, GUARD, PEBBLE, PLAYER, STEP } from './config.js';
import { levelAt } from './levels.js';
import { makeRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_DONE = 'done';
export const SCREEN_OVER = 'over';

/** Guard moods, in order of alarm. */
export const MOOD_PATROL = 'patrol';
export const MOOD_SUSPECT = 'suspect';
export const MOOD_CHASE = 'chase';
export const MOOD_CHECK = 'check';

const TAU = Math.PI * 2;

/** True when the segment from (x1,y1) to (x2,y2) crosses rectangle r. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let low = 0;
  let high = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    low = Math.max(low, t1);
    high = Math.min(high, t2);
    if (low > high) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    low = Math.max(low, t1);
    high = Math.min(high, t2);
    if (low > high) return false;
  }
  return true;
}

/** Every solid rectangle of a level: its walls and its cover. */
export function solidsOf(level) {
  return [...level.walls, ...level.cover];
}

/** True when a clear line runs from (x1,y1) to (x2,y2): no solid in the way. */
export function hasLineOfSight(level, x1, y1, x2, y2) {
  for (const solid of solidsOf(level)) {
    if (segmentHitsRect(x1, y1, x2, y2, solid)) return false;
  }
  return true;
}

/** True when the point (x,y) is inside a lantern's pool of light. */
export function inLight(level, x, y) {
  for (const lamp of level.lanterns) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy < lamp.r * lamp.r) return true;
  }
  return false;
}

/** A fresh guard standing at the first waypoint of its patrol. */
function newGuard(spec, index) {
  const start = spec.waypoints[0];
  return {
    id: index,
    x: start[0],
    y: start[1],
    angle: 0,
    waypoints: spec.waypoints,
    leg: 1,
    legDir: 1,
    mood: MOOD_PATROL,
    suspicion: 0,
    memory: 0,
    checkX: 0,
    checkY: 0,
    pause: 0,
    lastSeenX: start[0],
    lastSeenY: start[1],
  };
}

/** A fresh world for level `index`, with `lives` and `pebbles` carried in. */
export function newWorld(index, lives, pebbles, seed) {
  const level = levelAt(index);
  const random = makeRandom(seed);
  return {
    levelIndex: index,
    level,
    random,
    screen: SCREEN_TITLE,
    player: {
      x: level.playerStart.x,
      y: level.playerStart.y,
      angle: -Math.PI / 2,
      sneaking: false,
      moving: false,
    },
    guards: level.guards.map((spec, i) => newGuard(spec, i)),
    scrolls: level.scrolls.map((s) => ({ x: s.x, y: s.y, taken: false })),
    scrollsTaken: 0,
    exitOpen: false,
    lives,
    pebbles,
    time: 0,
    caughtTimer: 0,
    alarm: 0,
    message: '',
    messageTimer: 0,
    pebbleFlights: [],
    pings: [],
    best: 0,
  };
}

/** Move a circle out of every solid it overlaps, and clamp it to the field. */
function resolveSolids(level, body, radius) {
  body.x = Math.max(radius, Math.min(FIELD.width - radius, body.x));
  body.y = Math.max(radius, Math.min(FIELD.height - radius, body.y));
  for (const solid of solidsOf(level)) {
    const nearX = Math.max(solid.x, Math.min(body.x, solid.x + solid.w));
    const nearY = Math.max(solid.y, Math.min(body.y, solid.y + solid.h));
    const dx = body.x - nearX;
    const dy = body.y - nearY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= radius * radius) continue;
    if (distSq === 0) {
      body.y = solid.y - radius;
      continue;
    }
    const dist = Math.sqrt(distSq);
    body.x = nearX + (dx / dist) * radius;
    body.y = nearY + (dy / dist) * radius;
  }
}

/** The shortest turn from `from` toward `to`, wrapped to [-PI, PI]. */
function turnToward(from, to, maxStep) {
  let diff = to - from;
  while (diff > Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;
  if (Math.abs(diff) <= maxStep) return to;
  return from + Math.sign(diff) * maxStep;
}

/** Can this guard see the player right now, and how clearly (0 to 1)? */
function guardSees(world, guard) {
  const player = world.player;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.sightRange) return 0;
  const toPlayer = Math.atan2(dy, dx);
  let diff = Math.abs(toPlayer - guard.angle);
  if (diff > Math.PI) diff = TAU - diff;
  if (diff > GUARD.sightHalfAngle) return 0;
  if (!hasLineOfSight(world.level, guard.x, guard.y, player.x, player.y)) return 0;
  const closeness = 1 - dist / GUARD.sightRange;
  const lit = inLight(world.level, player.x, player.y) ? 1.35 : 0.8;
  return Math.min(1, 0.35 + closeness * 0.65) * lit;
}

/** One guard's fixed step: patrol, stare, chase, or check a noise. */
function stepGuard(world, guard, dt) {
  const player = world.player;
  const seen = guardSees(world, guard);
  if (seen > 0) {
    const rate = player.sneaking ? GUARD.sneakSpotRate : GUARD.spotRate;
    guard.suspicion = Math.min(GUARD.chaseAt, guard.suspicion + rate * seen * dt);
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.memory = GUARD.chaseMemory;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.calmRate * dt);
    guard.memory = Math.max(0, guard.memory - dt);
  }

  if (guard.mood !== MOOD_CHASE && guard.suspicion >= GUARD.chaseAt) {
    guard.mood = MOOD_CHASE;
    world.alarm = Math.max(world.alarm, 1.2);
    world.message = 'Spotted! Run for cover!';
    world.messageTimer = 1.6;
  } else if (guard.mood === MOOD_PATROL && guard.suspicion >= GUARD.suspectAt) {
    guard.mood = MOOD_SUSPECT;
    guard.pause = 0.7;
  } else if (guard.mood === MOOD_SUSPECT && guard.suspicion < GUARD.suspectAt - 10) {
    guard.mood = MOOD_PATROL;
  }

  if (guard.mood === MOOD_CHASE) {
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy);
    guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), 6 * dt);
    if (dist > 4) {
      guard.x += (dx / dist) * GUARD.chaseSpeed * dt;
      guard.y += (dy / dist) * GUARD.chaseSpeed * dt;
    }
    resolveSolids(world.level, guard, GUARD.radius);
    if (dist < GUARD.catchDistance) {
      world.screen = SCREEN_CAUGHT;
      world.caughtTimer = PLAYER.caughtPause;
    } else if (guard.memory <= 0 && guard.suspicion < GUARD.chaseAt - 25) {
      guard.mood = MOOD_CHECK;
      guard.checkX = guard.lastSeenX;
      guard.checkY = guard.lastSeenY;
    }
    return;
  }

  if (guard.mood === MOOD_CHECK) {
    const dx = guard.checkX - guard.x;
    const dy = guard.checkY - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12) {
      guard.pause -= dt;
      guard.angle += dt * 1.6;
      if (guard.pause <= 0) guard.mood = MOOD_PATROL;
      return;
    }
    guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), 5 * dt);
    guard.x += (dx / dist) * GUARD.investigateSpeed * dt;
    guard.y += (dy / dist) * GUARD.investigateSpeed * dt;
    resolveSolids(world.level, guard, GUARD.radius);
    return;
  }

  if (guard.mood === MOOD_SUSPECT) {
    guard.angle = turnToward(guard.angle, Math.atan2(player.y - guard.y, player.x - guard.x), 4 * dt);
    guard.pause -= dt;
    if (guard.pause <= 0) {
      if (guard.suspicion >= GUARD.suspectAt) {
        guard.mood = MOOD_CHECK;
        guard.checkX = guard.lastSeenX;
        guard.checkY = guard.lastSeenY;
        guard.pause = 1.2;
      } else {
        guard.mood = MOOD_PATROL;
      }
    }
    return;
  }

  // Patrol: walk the waypoint loop, pausing a beat at each corner.
  if (guard.pause > 0) {
    guard.pause -= dt;
    return;
  }
  const target = guard.waypoints[guard.leg];
  const dx = target[0] - guard.x;
  const dy = target[1] - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) {
    guard.leg += guard.legDir;
    if (guard.leg >= guard.waypoints.length || guard.leg < 0) {
      guard.legDir *= -1;
      guard.leg += guard.legDir * 2;
    }
    guard.pause = 0.9;
    return;
  }
  guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), 5 * dt);
  guard.x += (dx / dist) * GUARD.patrolSpeed * dt;
  guard.y += (dy / dist) * GUARD.patrolSpeed * dt;
  resolveSolids(world.level, guard, GUARD.radius);
}

/** A thrown pebble lands: every guard in earshot goes to look. */
function landPebble(world, x, y) {
  world.pings.push({ x, y, age: 0, kind: 'pebble' });
  for (const guard of world.guards) {
    if (guard.mood === MOOD_CHASE) continue;
    const dist = Math.hypot(guard.x - x, guard.y - y);
    if (dist < PEBBLE.hearRadius) {
      guard.mood = MOOD_CHECK;
      guard.checkX = x;
      guard.checkY = y;
      guard.pause = 1.4;
      guard.suspicion = Math.max(guard.suspicion, 30);
    }
  }
}

/** The player's fixed step: move, sneak, pick up scrolls, reach the exit. */
function stepPlayer(world, input, dt) {
  const player = world.player;
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  player.sneaking = input.sneak;
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    player.x += (dx / len) * speed * dt;
    player.y += (dy / len) * speed * dt;
    player.angle = Math.atan2(dy, dx);
    resolveSolids(world.level, player, PLAYER.radius);
    if (!player.sneaking) {
      for (const guard of world.guards) {
        if (guard.mood === MOOD_CHASE) continue;
        if (Math.hypot(guard.x - player.x, guard.y - player.y) < PEBBLE.footstepRadius) {
          guard.checkX = player.x;
          guard.checkY = player.y;
          if (guard.mood === MOOD_PATROL) {
            guard.mood = MOOD_CHECK;
            guard.pause = 0.8;
          }
        }
      }
    }
  }

  for (const scroll of world.scrolls) {
    if (scroll.taken) continue;
    if (Math.hypot(scroll.x - player.x, scroll.y - player.y) < 30) {
      scroll.taken = true;
      world.scrollsTaken += 1;
      world.message = `Sealed scroll ${world.scrollsTaken} of 3 — the exit is ${world.scrollsTaken === 3 ? 'open' : 'still shut'}.`;
      world.messageTimer = 2.2;
      if (world.scrollsTaken === 3) world.exitOpen = true;
    }
  }

  if (world.exitOpen) {
    const e = world.level.exit;
    if (player.x > e.x - 6 && player.x < e.x + e.w + 6 && player.y > e.y - 6 && player.y < e.y + e.h + 6) {
      world.screen = SCREEN_CLEAR;
    }
  }
}

/** One fixed step of the whole level. Returns nothing; the screen changes. */
export function stepWorld(world, input, dt = STEP) {
  if (world.screen !== SCREEN_PLAY) return;
  world.time += dt;
  world.alarm = Math.max(0, world.alarm - dt);
  world.messageTimer = Math.max(0, world.messageTimer - dt);
  for (const ping of world.pings) ping.age += dt;
  world.pings = world.pings.filter((p) => p.age < 1.1);

  // Pebble flights finish where they land.
  for (const flight of world.pebbleFlights) {
    flight.left -= dt;
    if (flight.left <= 0) landPebble(world, flight.x, flight.y);
  }
  world.pebbleFlights = world.pebbleFlights.filter((f) => f.left > 0);

  stepPlayer(world, input, dt);
  if (world.screen !== SCREEN_PLAY) return;
  for (const guard of world.guards) {
    stepGuard(world, guard, dt);
    if (world.screen !== SCREEN_PLAY) return;
  }
}

/** Toss a pebble toward (x, y); returns false when none is left. */
export function tossPebble(world, x, y) {
  if (world.pebbles <= 0 || world.screen !== SCREEN_PLAY) return false;
  const player = world.player;
  const dx = x - player.x;
  const dy = y - player.y;
  const dist = Math.hypot(dx, dy);
  const reach = Math.min(dist, PEBBLE.throwRange);
  const landX = dist === 0 ? player.x : player.x + (dx / dist) * reach;
  const landY = dist === 0 ? player.y : player.y + (dy / dist) * reach;
  world.pebbles -= 1;
  world.pebbleFlights.push({ x: landX, y: landY, left: 0.35, fromX: player.x, fromY: player.y });
  return true;
}

/** The highest suspicion among the wardens: what the eye meter shows. */
export function dangerLevel(world) {
  let worst = 0;
  for (const guard of world.guards) worst = Math.max(worst, guard.suspicion);
  return worst;
}

/** A level's score: scrolls, speed and lives left, for the clear screen. */
export function levelScore(world) {
  const timeBonus = Math.max(0, Math.round(900 - world.time * 6));
  return world.scrollsTaken * 300 + timeBonus + world.lives * 150;
}
