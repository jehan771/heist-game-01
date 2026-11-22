// The Copper Chip — keyboard + mouse input. One job: turn DOM events into
// the small input object state.js consumes each tick.
import { TILE } from "./config.js";

export function createInput(canvas, onKey) {
  const keys = new Set();
  const input = {
    up: false, down: false, left: false, right: false,
    sprint: false, crouch: false, interact: false,
    clickTile: null,
  };
  const codeToKey = {
    KeyW: "up", ArrowUp: "up",
    KeyS: "down", ArrowDown: "down",
    KeyA: "left", ArrowLeft: "left",
    KeyD: "right", ArrowRight: "right",
    ShiftLeft: "sprint", ShiftRight: "sprint",
    KeyC: "crouch",
    KeyE: "interact",
  };
  function sync() {
    input.up = keys.has("up");
    input.down = keys.has("down");
    input.left = keys.has("left");
    input.right = keys.has("right");
    input.sprint = keys.has("sprint");
    input.crouch = keys.has("crouch");
    input.interact = keys.has("interact");
  }
  window.addEventListener("keydown", (e) => {
    const k = codeToKey[e.code];
    if (k) {
      keys.add(k);
      sync();
      e.preventDefault();
    }
    if (onKey) onKey(e.code, true);
  });
  window.addEventListener("keyup", (e) => {
    const k = codeToKey[e.code];
    if (k) {
      keys.delete(k);
      sync();
    }
    if (onKey) onKey(e.code, false);
  });
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.clickTile = { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
  });
  return input;
}
