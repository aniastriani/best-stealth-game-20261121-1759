// Keyboard and mouse, in the shape the world step reads: four directions,
// sneak held, and one-shot actions the main loop drains each frame.
export function newInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    tossAt: null,
    pausePressed: false,
    restartPressed: false,
    mutePressed: false,
    startPressed: false,
  };
}

const KEYS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

/** Wire the keyboard and the canvas mouse to `input`; returns a cleanup. */
export function bindInput(input, canvas) {
  function onKeyDown(event) {
    const field = KEYS[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyP') input.pausePressed = true;
    if (event.code === 'KeyR') input.restartPressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
    if (event.code === 'Enter' || event.code === 'Space') input.startPressed = true;
  }
  function onKeyUp(event) {
    const field = KEYS[event.code];
    if (field) input[field] = false;
  }
  function onMouse(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.tossAt = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouse);
  return function unbind() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousedown', onMouse);
  };
}
