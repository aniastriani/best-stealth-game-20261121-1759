// The screenshot scenes behind ?shot=start|play|alert|win. Each one sets the
// real game state directly — the same world the player plays, the same
// renderer — frozen at a moment that shows the game at its best, so the
// frame a screenshot takes is one a short game really reaches.
import { MOOD_CHASE, MOOD_PATROL, MOOD_SUSPECT, newWorld, SCREEN_CLEAR, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

/** Place a guard at (x, y) facing `angle`, in the given mood. */
function poseGuard(world, index, x, y, angle, mood, suspicion) {
  const guard = world.guards[index];
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.mood = mood;
  guard.suspicion = suspicion;
  guard.pause = 99;
  return guard;
}

/**
 * Set `world` to the named scene (start, play, alert or win; any other name
 * is start) and return the world to draw and the screen over it.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    // Mid-level: the courier crouched behind a shelf with one scroll stolen,
    // a warden's cone sweeping just past her hiding place.
    world.screen = SCREEN_PLAY;
    world.player.x = 470;
    world.player.y = 340;
    world.player.angle = Math.PI / 2;
    world.player.sneaking = true;
    world.scrolls[0].taken = true;
    world.scrollsTaken = 1;
    world.message = 'Sealed scroll 1 of 3 — the exit is still shut.';
    world.messageTimer = 99;
    poseGuard(world, 0, 640, 90, Math.PI / 2, MOOD_PATROL, 0);
    poseGuard(world, 1, 700, 630, -Math.PI / 2, MOOD_SUSPECT, 52);
    return { world, screen: SCREEN_PLAY };
  }
  if (name === 'alert') {
    // The second wing, mid-alarm: a warden gives chase while the courier
    // runs for the exit with two scrolls already stolen.
    const wing = newWorld(1, 2, 1, 7);
    wing.screen = SCREEN_PLAY;
    wing.player.x = 700;
    wing.player.y = 560;
    wing.player.angle = -Math.PI / 2;
    wing.scrolls[0].taken = true;
    wing.scrolls[1].taken = true;
    wing.scrollsTaken = 2;
    wing.alarm = 99;
    wing.message = 'Spotted! Run for cover!';
    wing.messageTimer = 99;
    poseGuard(wing, 0, 640, 360, Math.PI / 2, MOOD_CHASE, 100);
    poseGuard(wing, 1, 420, 300, Math.PI, MOOD_SUSPECT, 70);
    poseGuard(wing, 2, 860, 500, -Math.PI / 2, MOOD_PATROL, 10);
    return { world: wing, screen: SCREEN_PLAY };
  }
  if (name === 'win') {
    // The first wing cleared: all three scrolls stolen, the exit open, the
    // wardens still walking their rounds, none the wiser.
    world.screen = SCREEN_CLEAR;
    world.player.x = 1120;
    world.player.y = 120;
    world.player.angle = -Math.PI / 4;
    for (const scroll of world.scrolls) scroll.taken = true;
    world.scrollsTaken = 3;
    world.exitOpen = true;
    world.time = 74;
    poseGuard(world, 0, 500, 90, 0, MOOD_PATROL, 0);
    poseGuard(world, 1, 800, 630, Math.PI, MOOD_PATROL, 0);
    return { world, screen: SCREEN_CLEAR };
  }
  // start: the title over the first wing, wardens on patrol.
  world.screen = SCREEN_TITLE;
  poseGuard(world, 0, 500, 90, 0, MOOD_PATROL, 0);
  poseGuard(world, 1, 780, 630, Math.PI, MOOD_PATROL, 0);
  return { world, screen: SCREEN_TITLE };
}
