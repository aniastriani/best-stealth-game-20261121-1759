// Lanterns of the Quiet Archive — everything the player sees, drawn on one
// canvas: the tiled archive floor, lantern pools, shelves and crates, the
// wardens with their vision cones (raycast so cover really blocks them),
// the hooded courier, the sealed scrolls, the exit, and the HUD.
import { FIELD, GUARD, PALETTE } from './config.js';
import { dangerLevel, MOOD_CHASE, MOOD_CHECK, MOOD_SUSPECT, SCREEN_CAUGHT, SCREEN_CLEAR, SCREEN_DONE, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { levelScore } from './world.js';

const TAU = Math.PI * 2;

/** Distance along a ray before it enters rectangle r, or Infinity. */
function rayRectDistance(x, y, dx, dy, r) {
  let low = 0;
  let high = Infinity;
  if (dx === 0) {
    if (x < r.x || x > r.x + r.w) return Infinity;
  } else {
    let t1 = (r.x - x) / dx;
    let t2 = (r.x + r.w - x) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    low = Math.max(low, t1);
    high = Math.min(high, t2);
    if (low > high) return Infinity;
  }
  if (dy === 0) {
    if (y < r.y || y > r.y + r.h) return Infinity;
  } else {
    let t1 = (r.y - y) / dy;
    let t2 = (r.y + r.h - y) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    low = Math.max(low, t1);
    high = Math.min(high, t2);
    if (low > high) return Infinity;
  }
  return low;
}

/** The vision cone as a polygon: rays stop at the first solid they meet. */
function conePolygon(world, guard) {
  const solids = [...world.level.walls, ...world.level.cover];
  const points = [];
  const rays = 26;
  for (let i = 0; i <= rays; i += 1) {
    const angle = guard.angle - GUARD.sightHalfAngle + (2 * GUARD.sightHalfAngle * i) / rays;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let reach = GUARD.sightRange;
    for (const solid of solids) {
      const hit = rayRectDistance(guard.x, guard.y, dx, dy, solid);
      if (hit < reach) reach = hit;
    }
    points.push([guard.x + dx * reach, guard.y + dy * reach]);
  }
  return points;
}

function drawFloor(ctx, world) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.floorB;
  const tile = 80;
  for (let y = 0; y < FIELD.height / tile; y += 1) {
    for (let x = 0; x < FIELD.width / tile; x += 1) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD.height);
    ctx.stroke();
  }
  for (let y = 0; y <= FIELD.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();
  }
  // The archive's border wall.
  ctx.strokeStyle = PALETTE.wallTop;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, FIELD.width - 10, FIELD.height - 10);
}

function drawLanterns(ctx, world) {
  for (const lamp of world.level.lanterns) {
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    glow.addColorStop(0, 'rgba(255, 205, 110, 0.28)');
    glow.addColorStop(1, 'rgba(255, 205, 110, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8a6a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 10, 0, TAU);
    ctx.stroke();
  }
}

function drawExit(ctx, world) {
  const e = world.level.exit;
  const open = world.exitOpen;
  ctx.fillStyle = open ? PALETTE.exitOpen : PALETTE.exitClosed;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#b8ffd2' : '#6b8f7a';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 1.5, e.y + 1.5, e.w - 3, e.h - 3);
  ctx.fillStyle = open ? '#0c2b18' : '#cfe8d8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 5);
  if (open) {
    ctx.fillStyle = 'rgba(88, 214, 138, 0.25)';
    ctx.fillRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16);
  }
}

function drawScrolls(ctx, world) {
  for (const scroll of world.scrolls) {
    if (scroll.taken) continue;
    const pulse = 0.7 + 0.3 * Math.sin(world.time * 3 + scroll.x);
    ctx.fillStyle = `rgba(242, 217, 140, ${0.25 * pulse})`;
    ctx.beginPath();
    ctx.arc(scroll.x, scroll.y, 22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = PALETTE.scroll;
    ctx.fillRect(scroll.x - 9, scroll.y - 6, 18, 12);
    ctx.fillStyle = '#a8873a';
    ctx.fillRect(scroll.x - 11, scroll.y - 7, 3, 14);
    ctx.fillRect(scroll.x + 8, scroll.y - 7, 3, 14);
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scroll.x - 5, scroll.y - 2);
    ctx.lineTo(scroll.x + 5, scroll.y - 2);
    ctx.moveTo(scroll.x - 5, scroll.y + 2);
    ctx.lineTo(scroll.x + 5, scroll.y + 2);
    ctx.stroke();
  }
}

function drawCover(ctx, world) {
  for (const solid of [...world.level.walls, ...world.level.cover]) {
    if (solid.kind === 'wall') {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(solid.x, solid.y, solid.w, 6);
    } else if (solid.kind === 'shelf') {
      ctx.fillStyle = PALETTE.shelf;
      ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
      ctx.strokeStyle = PALETTE.shelfEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(solid.x + 1, solid.y + 1, solid.w - 2, solid.h - 2);
      // Book spines along the shelf.
      ctx.fillStyle = 'rgba(220, 190, 130, 0.5)';
      const horizontal = solid.w >= solid.h;
      const count = Math.floor((horizontal ? solid.w : solid.h) / 12);
      for (let i = 0; i < count; i += 1) {
        if (horizontal) ctx.fillRect(solid.x + 4 + i * 12, solid.y + 5, 5, solid.h - 10);
        else ctx.fillRect(solid.x + 5, solid.y + 4 + i * 12, solid.w - 10, 5);
      }
    } else if (solid.kind === 'crate') {
      ctx.fillStyle = PALETTE.crate;
      ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
      ctx.strokeStyle = PALETTE.crateEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(solid.x + 1, solid.y + 1, solid.w - 2, solid.h - 2);
      ctx.beginPath();
      ctx.moveTo(solid.x, solid.y);
      ctx.lineTo(solid.x + solid.w, solid.y + solid.h);
      ctx.moveTo(solid.x + solid.w, solid.y);
      ctx.lineTo(solid.x, solid.y + solid.h);
      ctx.stroke();
    } else {
      ctx.fillStyle = PALETTE.pillar;
      ctx.beginPath();
      ctx.arc(solid.x + solid.w / 2, solid.y + solid.h / 2, solid.w / 2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = PALETTE.wallTop;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawCone(ctx, world, guard) {
  const points = conePolygon(world, guard);
  const fill = guard.mood === MOOD_CHASE
    ? PALETTE.coneChase
    : guard.mood === MOOD_SUSPECT || guard.mood === MOOD_CHECK
      ? PALETTE.coneSuspect
      : PALETTE.coneCalm;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawGuard(ctx, guard) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x + 3, guard.y + 5, GUARD.radius, GUARD.radius * 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = PALETTE.guardHelmet;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius - 4, 0, TAU);
  ctx.fill();
  // The direction the warden faces.
  ctx.strokeStyle = '#ffd9d0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * (GUARD.radius + 6), guard.y + Math.sin(guard.angle) * (GUARD.radius + 6));
  ctx.stroke();
  // Suspicion ticks above the warden's head.
  if (guard.suspicion > 5) {
    const width = 34;
    const frac = guard.suspicion / 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(guard.x - width / 2, guard.y - GUARD.radius - 14, width, 5);
    ctx.fillStyle = guard.mood === MOOD_CHASE ? PALETTE.danger : PALETTE.gold;
    ctx.fillRect(guard.x - width / 2, guard.y - GUARD.radius - 14, width * frac, 5);
  }
  if (guard.mood === MOOD_CHASE) {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - GUARD.radius - 18);
  } else if (guard.mood === MOOD_SUSPECT) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - GUARD.radius - 18);
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x + 3, p.y + 5, 13, 8, 0, 0, TAU);
  ctx.fill();
  // A small pool of light from the courier's own lantern.
  const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 46);
  glow.addColorStop(0, 'rgba(255, 205, 110, 0.20)');
  glow.addColorStop(1, 'rgba(255, 205, 110, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 46, 0, TAU);
  ctx.fill();
  ctx.fillStyle = PALETTE.playerHood;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, TAU);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4, 8, 0, TAU);
  ctx.fill();
  // Hood point showing the facing.
  ctx.fillStyle = PALETTE.playerHood;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.angle) * 13, p.y + Math.sin(p.angle) * 13);
  ctx.lineTo(p.x + Math.cos(p.angle + 2.4) * 9, p.y + Math.sin(p.angle + 2.4) * 9);
  ctx.lineTo(p.x + Math.cos(p.angle - 2.4) * 9, p.y + Math.sin(p.angle - 2.4) * 9);
  ctx.closePath();
  ctx.fill();
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(232, 182, 76, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPings(ctx, world) {
  for (const ping of world.pings) {
    const frac = ping.age / 1.1;
    ctx.strokeStyle = `rgba(255, 220, 120, ${0.9 * (1 - frac)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ping.x, ping.y, 8 + frac * 34, 0, TAU);
    ctx.stroke();
  }
  for (const flight of world.pebbleFlights) {
    ctx.fillStyle = '#cfd3e0';
    ctx.beginPath();
    ctx.arc(flight.x, flight.y, 4, 0, TAU);
    ctx.fill();
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, 40);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(world.level.name, 14, 26);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText(`Scrolls ${world.scrollsTaken}/3   Lives ${'●'.repeat(world.lives)}${'○'.repeat(Math.max(0, 3 - world.lives))}   Pebbles ${world.pebbles}   ${Math.floor(world.time)}s`, 250, 26);
  // The eye meter: the worst suspicion among the wardens.
  const danger = dangerLevel(world);
  const meterX = 980;
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SEEN', meterX - 8, 26);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(meterX, 14, 150, 12);
  ctx.fillStyle = danger >= 100 ? PALETTE.danger : danger >= 45 ? PALETTE.gold : '#7ec98f';
  ctx.fillRect(meterX, 14, 150 * Math.min(1, danger / 100), 12);
  ctx.fillStyle = PALETTE.hud;
  ctx.textAlign = 'left';
  ctx.font = '13px sans-serif';
  ctx.fillText(world.exitOpen ? 'EXIT OPEN' : 'EXIT LOCKED', 1145, 26);

  if (world.messageTimer > 0) {
    ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
    const text = world.message;
    ctx.font = '15px sans-serif';
    const width = ctx.measureText(text).width + 28;
    ctx.fillRect((FIELD.width - width) / 2, 52, width, 30);
    ctx.fillStyle = PALETTE.gold;
    ctx.textAlign = 'center';
    ctx.fillText(text, FIELD.width / 2, 72);
  }
  if (world.alarm > 0) {
    ctx.fillStyle = `rgba(220, 60, 45, ${0.25 + 0.2 * Math.sin(world.time * 10)})`;
    ctx.fillRect(0, 40, FIELD.width, 5);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, FIELD.width / 2, 300);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '19px sans-serif';
  let y = 350;
  for (const line of lines) {
    ctx.fillText(line, FIELD.width / 2, y);
    y += 30;
  }
}

function drawScreen(ctx, world, totalScore) {
  if (world.screen === SCREEN_TITLE) {
    overlay(ctx, 'Lanterns of the Quiet Archive', [
      'You are Wren, a courier in the night archive. Steal the three sealed scrolls,',
      'slip past the wardens, and leave through the exit — unseen.',
      '',
      'WASD or arrows to move · hold Shift to sneak · click to toss a pebble',
      'Hide behind shelves and crates · lantern light makes you easier to spot',
      '',
      'Click or press Enter to begin',
    ], PALETTE.gold);
    return;
  }
  if (world.screen === SCREEN_CAUGHT) {
    overlay(ctx, 'Caught!', [
      'A warden laid hands on you in the dark.',
      `Lives left: ${world.lives}`,
      '',
      'The level starts again…',
    ], PALETTE.danger);
    return;
  }
  if (world.screen === SCREEN_CLEAR) {
    const last = world.levelIndex >= 2;
    overlay(ctx, last ? 'The Vault Wing is yours' : 'Level clear!', [
      `Scrolls stolen: ${world.scrollsTaken} of 3   ·   Time: ${Math.floor(world.time)}s`,
      `Level score: ${levelScore(world)}`,
      '',
      last ? 'Press Enter for the final tally.' : 'Press Enter for the next wing.',
    ], PALETTE.exitOpen);
    return;
  }
  if (world.screen === SCREEN_DONE) {
    overlay(ctx, 'The archive is yours', [
      'Three wings, nine scrolls, and not a single warden the wiser.',
      `Total score: ${totalScore}`,
      '',
      'Press R to play again.',
    ], PALETTE.gold);
    return;
  }
  if (world.screen === SCREEN_OVER) {
    overlay(ctx, 'The archive keeps its secrets', [
      'Out of lives. The wardens relight the lanterns and the night goes on.',
      '',
      'Press R to try again.',
    ], PALETTE.danger);
  }
}

/** Draw the whole world, then the screen overlay when one applies. */
export function drawWorld(ctx, world, totalScore) {
  drawFloor(ctx, world);
  drawCover(ctx, world);
  // Night darkens the floor and the shelves; the lantern pools, the cones
  // and the people are drawn over the dark, so they stay readable.
  ctx.fillStyle = PALETTE.dark;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawLanterns(ctx, world);
  drawExit(ctx, world);
  drawScrolls(ctx, world);
  for (const guard of world.guards) drawCone(ctx, world, guard);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, world);
  drawPings(ctx, world);
  drawHud(ctx, world);
  if (world.screen !== SCREEN_PLAY) drawScreen(ctx, world, totalScore);
}
