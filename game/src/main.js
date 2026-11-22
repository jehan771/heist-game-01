// The Copper Chip — bootstrap + game loop + screen machine.
// Screens: menu, plan, playing, paused, complete, caught, gameover, victory.
// The loop steps pure state.js logic and renders it; sounds follow events.
import { VIEW_W, VIEW_H, LIVES_PER_HEIST } from "./config.js";
import { levelCount } from "./levels.js";
import { createGame, step } from "./state.js";
import { createInput } from "./input.js";
import { createAudio } from "./audio.js";
import {
  drawGame, drawMenu, drawPlan, drawPause, drawComplete,
  drawCaught, drawGameOver, drawVictory,
} from "./render.js";
import { parseShot, playPreset, endPreset } from "./shots.js";

const canvas = document.getElementById("game");
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext("2d");

const audio = createAudio();
let screen = "menu";
let selectedLevel = 0;
let game = createGame(0);
let totalScore = 0;
let best = 0;
let message = null;
let messageUntil = 0;
let stepTimer = 0;
let failKind = "caught"; // "caught" | "time" — what ended the last attempt

const input = createInput(canvas, onKey);

function startHeist(index) {
  selectedLevel = index;
  game = createGame(index, { lives: LIVES_PER_HEIST, score: totalScore });
  screen = "plan";
  render();
}

function beginPlay() {
  screen = "playing";
  message = "Lift the Golden Chip — then reach the green EXIT.";
  messageUntil = performance.now() + 3500;
}

function retryHeist() {
  game = createGame(selectedLevel, { lives: game.lives, score: game.missionScore });
  screen = "plan";
  render();
}

function onKey(code, down) {
  if (!down) return;
  audio.unlock();
  if (code === "KeyM") {
    audio.toggleMute();
    return;
  }
  if (code === "Enter") {
    if (screen === "menu") startHeist(selectedLevel);
    else if (screen === "plan") beginPlay();
    else if (screen === "complete") {
      totalScore = game.score;
      if (selectedLevel + 1 < levelCount()) startHeist(selectedLevel + 1);
      else screen = "victory";
    } else if (screen === "caught") {
      if (failKind === "time") retryHeist();
      else if (game.lives > 0) retryHeist();
      else { totalScore = 0; screen = "menu"; }
    } else if (screen === "gameover" || screen === "victory") {
      totalScore = 0;
      screen = "menu";
    }
    render();
    return;
  }
  if (code === "Escape") {
    if (screen === "plan" || screen === "paused" || screen === "complete" || screen === "caught") {
      screen = "menu";
      render();
    }
    return;
  }
  if (code === "KeyP") {
    if (screen === "playing") { screen = "paused"; render(); }
    else if (screen === "paused") { screen = "playing"; }
    return;
  }
  if (code === "KeyR") {
    if (screen === "playing" || screen === "paused" || screen === "complete") retryHeist();
    return;
  }
  if (code.startsWith("Digit")) {
    const n = parseInt(code.slice(5), 10);
    if (n >= 1 && n <= levelCount() && (screen === "menu" || screen === "complete")) {
      selectedLevel = n - 1;
      render();
    }
  }
}

function handleEvents() {
  for (const ev of game.events) {
    if (ev === "pickup") audio.pickup();
    else if (ev === "target") { audio.target(); message = "Golden Chip secured — get to the EXIT!"; messageUntil = performance.now() + 3500; }
    else if (ev === "safe") { audio.safeOpen(); message = "Safe cracked! +500"; messageUntil = performance.now() + 2500; }
    else if (ev === "hack") { audio.hack(); message = "Camera blinded for 25s"; messageUntil = performance.now() + 2500; }
    else if (ev === "lockdown") { audio.alarm(); message = "LOCKDOWN!"; messageUntil = performance.now() + 3000; }
    else if (ev === "caught") audio.caught();
    else if (ev === "complete") { audio.win(); best = Math.max(best, game.score); }
    else if (ev === "failed") message = "Time ran out — the crew walks away empty-handed.";
  }
  game.events.length = 0;
}

function render() {
  const meta = { message: message && performance.now() < messageUntil ? message : null };
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (screen === "menu") drawMenu(ctx, best);
  else if (screen === "plan") drawPlan(ctx, game);
  else if (screen === "playing") drawGame(ctx, game, meta);
  else if (screen === "paused") { drawGame(ctx, game, meta); drawPause(ctx); }
  else if (screen === "complete") { drawGame(ctx, game, meta); drawComplete(ctx, game); }
  else if (screen === "caught") { drawGame(ctx, game, meta); drawCaught(ctx, game, failKind); }
  else if (screen === "gameover") { drawGame(ctx, game, meta); drawGameOver(ctx, game); }
  else if (screen === "victory") drawVictory(ctx, totalScore);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (screen === "playing") {
    step(game, dt, input);
    input.clickTile = null;
    handleEvents();
    // Footsteps while walking.
    if (game.player.moving) {
      stepTimer -= dt;
      if (stepTimer <= 0) {
        audio.step();
        stepTimer = game.player.sprint ? 0.22 : 0.38;
      }
    }
    if (game.status === "complete") screen = "complete";
    else if (game.status === "caught") { screen = "caught"; failKind = "caught"; }
    else if (game.status === "failed") { screen = "caught"; failKind = "time"; }
    else if (game.status === "gameover") screen = "gameover";
    render();
  }
  requestAnimationFrame(loop);
}

// Screenshot presets render one frozen frame and stop.
const shot = parseShot();
if (shot) {
  if (shot.kind === "start") {
    drawMenu(ctx, 0);
  } else if (shot.kind === "play") {
    const preset = playPreset(shot.level - 1);
    drawGame(ctx, preset, { message: "Lift the Golden Chip — then reach the green EXIT." });
  } else if (shot.kind === "end") {
    drawVictory(ctx, endPreset().totalScore);
  }
  document.title = "The Copper Chip — shot:" + shot.kind;
} else {
  render();
  requestAnimationFrame(loop);
}

// Exposed for headless playtests.
window.__copper = {
  get screen() { return screen; },
  get game() { return game; },
  get selectedLevel() { return selectedLevel; },
  startHeist,
  beginPlay,
};
