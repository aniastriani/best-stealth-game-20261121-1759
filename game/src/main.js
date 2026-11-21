// Lanterns of the Quiet Archive — the boot and the frame loop. One world at
// a time, stepped at a fixed 60 Hz whatever the display's rate; the screens
// (title, caught, clear, done, over) are states of the same world, and the
// ?shot= scenes freeze a staged world for the screenshots.
import { FIELD, LIVES, PEBBLE, STEP } from './config.js';
import { bindInput, newInput } from './input.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';
import { levelScore, newWorld, SCREEN_CAUGHT, SCREEN_CLEAR, SCREEN_DONE, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, stepWorld, tossPebble } from './world.js';
import { ensureAudio, newAudio, playAlert, playCaught, playClear, playPebble, playPickup, playStep } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

// Keep the canvas at the field's own 1280x720, scaled by CSS to the window.
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

const input = newInput();
const audio = newAudio();
bindInput(input, canvas);

let world = newWorld(0, LIVES, PEBBLE.startCount, seed);
let totalScore = 0;
let paused = false;
let frozen = false;
let stepSoundTimer = 0;

if (shotName) {
  const staged = stageShot(shotName, world);
  world = staged.world;
  frozen = true;
  drawWorld(ctx, world, totalScore);
} else {
  requestAnimationFrame(frame);
}

/** Start the current level from its title screen. */
function beginLevel() {
  world.screen = SCREEN_PLAY;
  world.message = world.level.hint;
  world.messageTimer = 3.5;
}

/** Restart the current level after being caught, or lose the last life. */
function afterCaught() {
  world.lives -= 1;
  if (world.lives <= 0) {
    world.screen = SCREEN_OVER;
    return;
  }
  world = newWorld(world.levelIndex, world.lives, PEBBLE.startCount, seed + world.levelIndex);
  beginLevel();
}

/** Move on after a cleared level, or finish the game. */
function afterClear() {
  totalScore += levelScore(world);
  if (world.levelIndex >= 2) {
    world.screen = SCREEN_DONE;
    return;
  }
  world = newWorld(world.levelIndex + 1, world.lives, PEBBLE.startCount, seed + world.levelIndex + 1);
  beginLevel();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (frozen) return;
  if (input.mutePressed) {
    input.mutePressed = false;
    audio.muted = !audio.muted;
  }
  if (input.restartPressed) {
    input.restartPressed = false;
    totalScore = 0;
    world = newWorld(0, LIVES, PEBBLE.startCount, seed);
    return;
  }
  if (input.pausePressed) {
    input.pausePressed = false;
    if (world.screen === SCREEN_PLAY) paused = !paused;
  }
  if (input.startPressed) {
    input.startPressed = false;
    ensureAudio(audio);
    if (world.screen === SCREEN_TITLE) beginLevel();
    else if (world.screen === SCREEN_CLEAR) afterClear();
    else if (world.screen === SCREEN_DONE || world.screen === SCREEN_OVER) {
      totalScore = 0;
      world = newWorld(0, LIVES, PEBBLE.startCount, seed);
    }
  }
  if (input.tossAt) {
    const point = input.tossAt;
    input.tossAt = null;
    ensureAudio(audio);
    if (world.screen === SCREEN_TITLE) beginLevel();
    else if (tossPebble(world, point.x, point.y)) playPebble(audio);
  }
  if (paused || world.screen !== SCREEN_PLAY) {
    if (world.screen === SCREEN_CAUGHT) {
      world.caughtTimer -= STEP;
      if (world.caughtTimer <= 0) afterCaught();
    }
    drawWorld(ctx, world, totalScore);
    return;
  }

  const scrollsBefore = world.scrollsTaken;
  const wasChasing = world.guards.some((g) => g.mood === 'chase');
  stepWorld(world, input, STEP);
  if (world.scrollsTaken > scrollsBefore) playPickup(audio);
  if (!wasChasing && world.guards.some((g) => g.mood === 'chase')) playAlert(audio);
  if (world.screen === SCREEN_CAUGHT) playCaught(audio);
  if (world.screen === SCREEN_CLEAR) playClear(audio);
  if (world.player.moving) {
    stepSoundTimer -= STEP;
    if (stepSoundTimer <= 0) {
      stepSoundTimer = world.player.sneaking ? 0.55 : 0.34;
      playStep(audio, world.player.sneaking);
    }
  }
  status.textContent = `Level ${world.levelIndex + 1}, ${world.scrollsTaken} of 3 scrolls, ${world.lives} lives.`;
  drawWorld(ctx, world, totalScore);
}
