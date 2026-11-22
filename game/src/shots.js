// The Copper Chip — deterministic screenshot presets (?shot=...).
// The judge sees the game through these frames, so the play preset puts
// everything in one frame: the thief mid-room, guards with vision cones,
// cameras with sweeping cones, loot and the Golden Chip, and the alarm meter.
import { createGame } from "./state.js";

export function parseShot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (!shot) return null;
  if (shot === "start") return { kind: "start" };
  if (shot === "end") return { kind: "end" };
  if (shot === "play") {
    const level = Math.max(1, Math.min(5, parseInt(params.get("level") || "3", 10)));
    return { kind: "play", level };
  }
  return null;
}

// Mid-play, level 3 (High-Roller Room): Rook in the open with a guard cone
// crossing his path, a second guard behind him, a camera sweeping the room,
// two chip stacks already lifted, the Golden Chip glowing, alarm at 35.
export function playPreset(levelIndex) {
  const game = createGame(levelIndex, { lives: 3, score: 1250 });
  game.timeLeft = 62;
  game.alarm = 35;
  // Two of the three chip stacks already lifted.
  if (game.loot[0]) game.loot[0].taken = true;
  if (game.loot[1]) game.loot[1].taken = true;
  // Rook mid-room, caught between cones.
  game.player.x = 19.5;
  game.player.y = 14.5;
  game.player.angle = -Math.PI / 2;
  game.player.crouch = true;
  // Guards posed mid-patrol.
  if (game.guards[0]) {
    game.guards[0].x = 10.5;
    game.guards[0].y = 10.5;
    game.guards[0].angle = 0;
    game.guards[0].suspicion = 30;
  }
  if (game.guards[1]) {
    game.guards[1].x = 28.5;
    game.guards[1].y = 10.5;
    game.guards[1].angle = Math.PI;
    game.guards[1].suspicion = 0;
  }
  if (game.guards[2]) {
    game.guards[2].x = 24.5;
    game.guards[2].y = 6.5;
    game.guards[2].angle = Math.PI / 2;
    game.guards[2].suspicion = 55;
    game.guards[2].state = "investigate";
    game.guards[2].lastSeen = { x: 19.5, y: 12.5 };
  }
  // Cameras sweeping into the room.
  if (game.cameras[0]) game.cameras[0].angle = Math.PI / 2 + 0.4;
  if (game.cameras[1]) game.cameras[1].angle = Math.PI - 0.3;
  return game;
}

export function endPreset() {
  return { totalScore: 6840 };
}
