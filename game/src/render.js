// The Copper Chip — all drawing. Canvas 2D, procedural art only: the
// casino floor, the thief, the guards and their cones, the cameras, the
// loot, the HUD and every screen. No images, no network.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, GUARD_CONE_HALF, CAMERA_CONE_HALF, GUARD_VIEW_RANGE, CAMERA_VIEW_RANGE, LIVES_PER_HEIST } from "./config.js";
import { blocksSight, lootLeft, starsFor } from "./state.js";

function px(x) { return x * TILE; }

function conePoints(grid, ox, oy, angle, range, half) {
  const pts = [{ x: ox, y: oy }];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const a = angle - half + (2 * half * i) / steps;
    let d = range;
    for (let t = 0.3; t < range; t += 0.25) {
      const x = ox + Math.cos(a) * t;
      const y = oy + Math.sin(a) * t;
      if (blocksSight(grid, Math.floor(x), Math.floor(y))) { d = Math.max(0.3, t - 0.25); break; }
    }
    pts.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d });
  }
  return pts;
}

function drawCone(ctx, grid, ox, oy, angle, range, half, fill) {
  const pts = conePoints(grid, ox, oy, angle, range, half);
  ctx.beginPath();
  ctx.moveTo(px(pts[0].x), px(pts[0].y));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(px(pts[i].x), px(pts[i].y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, game) {
  const grid = game.grid;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      const X = px(x);
      const Y = px(y);
      if (c === "#") {
        ctx.fillStyle = "#241f31";
        ctx.fillRect(X, Y, TILE, TILE);
        ctx.fillStyle = "#3a3348";
        ctx.fillRect(X, Y, TILE, 4);
        ctx.fillStyle = "rgba(212,175,55,0.35)";
        ctx.fillRect(X, Y + TILE - 2, TILE, 2);
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#0d3b2e" : "#0c352a";
        ctx.fillRect(X, Y, TILE, TILE);
        if ((x * 7 + y * 13) % 11 === 0) {
          ctx.fillStyle = "rgba(212,175,55,0.10)";
          ctx.beginPath();
          ctx.arc(X + TILE / 2, Y + TILE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (c === "T") {
        // Slot machine: cabinet + glowing reels.
        ctx.fillStyle = "#4a2b6b";
        roundRect(ctx, X + 3, Y + 3, TILE - 6, TILE - 6, 5);
        ctx.fill();
        ctx.fillStyle = "#e8d44d";
        ctx.fillRect(X + 7, Y + 7, TILE - 14, 9);
        ctx.fillStyle = "#7b1e3b";
        ctx.fillRect(X + 7, Y + 19, TILE - 14, 6);
        ctx.fillStyle = "#f5f0dc";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("777", X + TILE / 2, Y + 15);
      } else if (c === "H") {
        ctx.fillStyle = "#123f2a";
        ctx.beginPath();
        ctx.arc(X + TILE / 2, Y + TILE / 2, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1d6b3c";
        ctx.beginPath();
        ctx.arc(X + TILE / 2 - 4, Y + TILE / 2 - 3, 8, 0, Math.PI * 2);
        ctx.arc(X + TILE / 2 + 5, Y + TILE / 2 + 2, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (c === "F") {
        ctx.fillStyle = "#3c3f45";
        roundRect(ctx, X + 2, Y + 2, TILE - 4, TILE - 4, 4);
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(X + TILE / 2, Y + TILE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (c === "K") {
        ctx.fillStyle = "#123b3b";
        roundRect(ctx, X + 3, Y + 3, TILE - 6, TILE - 6, 4);
        ctx.fill();
        ctx.fillStyle = "#39d0c0";
        ctx.fillRect(X + 8, Y + 8, TILE - 16, 10);
        ctx.fillStyle = "#0b2a28";
        ctx.fillRect(X + 8, Y + 21, TILE - 16, 3);
      } else if (c === "E") {
        // Service door: drawn by drawExit (state-dependent).
      }
    }
  }
  // Velvet rope line along the strong-room door area is part of the room.
}

function drawExit(ctx, game) {
  const e = game.exit;
  const X = px(e.x) - TILE / 2;
  const Y = px(e.y) - TILE / 2;
  ctx.fillStyle = e.open ? "#1d7a3d" : "#4a4a4a";
  roundRect(ctx, X + 2, Y + 2, TILE - 4, TILE - 4, 4);
  ctx.fill();
  ctx.strokeStyle = e.open ? "#7dff9e" : "#8a8a8a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(e.open ? "EXIT" : "LOCK", X + TILE / 2, Y + TILE / 2 + 3);
  if (e.open) {
    ctx.strokeStyle = "rgba(125,255,158,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X + TILE / 2, Y + TILE / 2, 18 + Math.sin(Date.now() / 300) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLoot(ctx, game) {
  for (const loot of game.loot) {
    if (loot.taken) continue;
    const X = px(loot.x);
    const Y = px(loot.y);
    const cols = ["#d4af37", "#c0392b", "#2e6fb0"];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.ellipse(X, Y + 6 - i * 4, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = "#fff3b0";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("$", X, Y - 8);
  }
  // The Golden Chip target: pedestal + glow + pulsing ring.
  const t = game.target;
  if (!t.taken) {
    const X = px(t.x);
    const Y = px(t.y);
    const pulse = 1 + Math.sin(Date.now() / 350) * 0.12;
    ctx.save();
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(X, Y, 15 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#8a6d00";
    ctx.beginPath();
    ctx.arc(X, Y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("C", X, Y + 4);
    ctx.strokeStyle = "rgba(255,215,0,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X, Y, 25 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSafesAndTerminals(ctx, game) {
  for (const safe of game.safes) {
    if (safe.opened) {
      ctx.fillStyle = "#7dff9e";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("OPEN", px(safe.x), px(safe.y) - 14);
    } else if (safe.progress > 0) {
      const X = px(safe.x);
      const Y = px(safe.y) - 20;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(X - 20, Y, 40, 7);
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(X - 19, Y + 1, 38 * safe.progress, 5);
    }
  }
  for (const term of game.terminals) {
    if (term.used) {
      ctx.fillStyle = "#39d0c0";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HACKED", px(term.x), px(term.y) - 14);
    } else if (term.progress > 0) {
      const X = px(term.x);
      const Y = px(term.y) - 20;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(X - 20, Y, 40, 7);
      ctx.fillStyle = "#39d0c0";
      ctx.fillRect(X - 19, Y + 1, 38 * term.progress, 5);
    }
  }
}

function drawCameras(ctx, game) {
  for (const cam of game.cameras) {
    if (cam.disabled <= 0) {
      drawCone(ctx, game.grid, cam.x, cam.y, cam.angle, CAMERA_VIEW_RANGE, CAMERA_CONE_HALF, "rgba(255,220,80,0.27)");
    }
    const X = px(cam.x);
    const Y = px(cam.y);
    ctx.fillStyle = cam.disabled > 0 ? "#555" : "#2b2b2b";
    ctx.beginPath();
    ctx.arc(X, Y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cam.disabled > 0 ? "#888" : "#ffd700";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = cam.disabled > 0 ? "#888" : "#ff4040";
    ctx.beginPath();
    ctx.arc(X, Y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (cam.disabled > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(Math.ceil(cam.disabled) + "s", X, Y - 13);
    }
  }
}

function drawGuards(ctx, game) {
  for (const guard of game.guards) {
    const hot = guard.suspicion >= 45;
    const fill = guard.state === "chase" ? "rgba(255,60,60,0.36)"
      : hot ? "rgba(255,150,50,0.32)" : "rgba(255,170,60,0.27)";
    drawCone(ctx, game.grid, guard.x, guard.y, guard.angle, GUARD_VIEW_RANGE, GUARD_CONE_HALF, fill);
    const X = px(guard.x);
    const Y = px(guard.y);
    ctx.fillStyle = "#2b3a67";
    ctx.beginPath();
    ctx.arc(X, Y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = guard.state === "chase" ? "#ff4040" : "#8fa3d9";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick + cap.
    ctx.strokeStyle = "#dfe6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X, Y);
    ctx.lineTo(X + Math.cos(guard.angle) * 14, Y + Math.sin(guard.angle) * 14);
    ctx.stroke();
    ctx.fillStyle = "#1a2440";
    ctx.fillRect(X - 7, Y - 9, 14, 4);
    if (guard.suspicion > 5) {
      ctx.fillStyle = guard.state === "chase" ? "#ff4040" : "#ffb347";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(guard.state === "chase" ? "!" : "?", X, Y - 16);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(X - 12, Y - 14, 24, 3);
      ctx.fillStyle = guard.state === "chase" ? "#ff4040" : "#ffb347";
      ctx.fillRect(X - 11, Y - 13, 22 * (guard.suspicion / 100), 1);
    }
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  const X = px(p.x);
  const Y = px(p.y);
  // Click-to-move target marker.
  if (p.path && p.path.length) {
    const node = p.path[p.path.length - 1];
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px(node.x), px(node.y), 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(node.x) - 4, px(node.y));
    ctx.lineTo(px(node.x) + 4, px(node.y));
    ctx.moveTo(px(node.x), px(node.y) - 4);
    ctx.lineTo(px(node.x), px(node.y) + 4);
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = "#39d0c0";
  ctx.shadowBlur = p.crouch ? 8 : 16;
  ctx.fillStyle = "#17171f";
  ctx.beginPath();
  ctx.arc(X, Y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = p.crouch ? "#9a9a9a" : "#39d0c0";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hat brim + facing tick.
  ctx.fillStyle = "#17171f";
  ctx.beginPath();
  ctx.ellipse(X, Y - 2, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#39d0c0";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(X, Y);
  ctx.lineTo(X + Math.cos(p.angle) * 17, Y + Math.sin(p.angle) * 17);
  ctx.stroke();
}

export function drawHUD(ctx, game, meta) {
  // Top bar.
  ctx.fillStyle = "rgba(8,8,14,0.82)";
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("THE COPPER CHIP", 14, 20);
  ctx.fillStyle = "#cfc8a8";
  ctx.font = "13px sans-serif";
  ctx.fillText("— " + game.levelName, 196, 20);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("SCORE " + game.score, 470, 20);
  ctx.fillStyle = "#ffd700";
  ctx.fillText("LOOT " + (game.loot.filter((l) => l.taken).length + (game.target.taken ? 1 : 0)) + "/" + (game.loot.length + 1), 620, 20);
  // Timer.
  const t = Math.max(0, Math.ceil(game.timeLeft));
  ctx.fillStyle = t <= 15 ? "#ff5040" : "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("⏱ " + Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"), 740, 20);
  // Alarm meter.
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("ALARM", 850, 20);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(920, 9, 200, 14);
  ctx.fillStyle = game.alarm > 70 ? "#ff2d2d" : game.alarm > 35 ? "#ff9a2d" : "#ffcf3d";
  ctx.fillRect(921, 10, 198 * (game.alarm / 100), 12);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(920, 9, 200, 14);
  if (game.lockdown > 0) {
    ctx.fillStyle = "#ff2d2d";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("LOCKDOWN " + Math.ceil(game.lockdown) + "s", 1130, 20);
  }
  // Lives as chips.
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("LIVES", 1130, 40);
  for (let i = 0; i < LIVES_PER_HEIST; i++) {
    ctx.fillStyle = i < game.lives ? "#d4af37" : "#444";
    ctx.beginPath();
    ctx.arc(1185 + i * 22, 36, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bottom hint bar.
  ctx.fillStyle = "rgba(8,8,14,0.82)";
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = "#bdb49a";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WASD / arrows move · click to walk · SHIFT sprint (noisy) · C crouch · E hold: crack safe / hack camera · P pause · M mute · R restart · ESC menu", VIEW_W / 2, VIEW_H - 8);
  // Lockdown banner.
  if (game.lockdown > 0) {
    ctx.fillStyle = "rgba(120,0,0,0.55)";
    ctx.fillRect(0, 46, VIEW_W, 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚠ LOCKDOWN — the exit is sealed, the floor men are coming ⚠", VIEW_W / 2, 70);
  }
  if (meta && meta.message) {
    ctx.fillStyle = "rgba(8,8,14,0.85)";
    const w = ctx.measureText(meta.message).width + 36;
    ctx.fillRect((VIEW_W - w) / 2, 96, w, 34);
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(meta.message, VIEW_W / 2, 119);
  }
}

export function drawGame(ctx, game, meta) {
  drawFloor(ctx, game);
  drawExit(ctx, game);
  drawLoot(ctx, game);
  drawSafesAndTerminals(ctx, game);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawPlayer(ctx, game);
  drawHUD(ctx, game, meta);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(8,10,18,0.92)";
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawMenu(ctx, best) {
  ctx.fillStyle = "#0a241c";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Decorative felt + chips.
  ctx.fillStyle = "#0d3b2e";
  ctx.fillRect(0, 520, VIEW_W, 280);
  ctx.strokeStyle = "rgba(212,175,55,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 660, 420, 110, 0, 0, Math.PI * 2);
  ctx.stroke();
  const cols = ["#d4af37", "#c0392b", "#2e6fb0", "#e8e8e8"];
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = cols[i % 4];
    ctx.beginPath();
    ctx.ellipse(180 + i * 68, 640 + ((i * 37) % 60), 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 64px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("THE COPPER CHIP", VIEW_W / 2, 150);
  ctx.fillStyle = "#e8dcc0";
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText("A casino heist in five rooms — plan it, slip in, lift the Golden Chip, walk out.", VIEW_W / 2, 195);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("1  The Lobby          2  The Slots Floor          3  The High-Roller Room", VIEW_W / 2, 280);
  ctx.fillText("4  The Count Room          5  The Vault Beneath", VIEW_W / 2, 312);
  ctx.fillStyle = "#bdb49a";
  ctx.font = "15px sans-serif";
  ctx.fillText("Press 1–5 to pick a heist, then ENTER to see the plan. Guards patrol with vision cones —", VIEW_W / 2, 380);
  ctx.fillText("cameras sweep, the alarm meter climbs when you are seen. Grab the Golden Chip, then reach the exit.", VIEW_W / 2, 404);
  ctx.fillText("WASD / arrows move · click to walk · SHIFT sprint (noisy) · C crouch · E hold: safe / terminal · P pause · M mute", VIEW_W / 2, 440);
  if (best > 0) {
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 17px sans-serif";
    ctx.fillText("Best score so far: " + best, VIEW_W / 2, 490);
  }
  ctx.fillStyle = "#8fa3d9";
  ctx.font = "13px sans-serif";
  ctx.fillText("An original game — no assets, no network. Rook Marlowe thanks you for your discretion.", VIEW_W / 2, 760);
}

export function drawPlan(ctx, game) {
  // Dimmed floor behind the plan panel.
  drawFloor(ctx, game);
  ctx.fillStyle = "rgba(5,5,10,0.72)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 290, 110, 700, 560);
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 30px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("THE PLAN — " + game.levelName.toUpperCase(), VIEW_W / 2, 165);
  ctx.fillStyle = "#e8dcc0";
  ctx.font = "16px sans-serif";
  const words = game.brief.split(" ");
  let line = "";
  let y = 210;
  for (const w of words) {
    if ((line + " " + w).length > 62) {
      ctx.fillText(line.trim(), VIEW_W / 2, y);
      y += 24;
      line = w;
    } else line += " " + w;
  }
  ctx.fillText(line.trim(), VIEW_W / 2, y);
  const counts = {
    Guards: game.guards.length,
    Cameras: game.cameras.length,
    "Chip stacks": game.loot.length,
    Safes: game.safes.length,
    "Hack terminals": game.terminals.length,
  };
  y += 50;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px sans-serif";
  for (const [k, v] of Object.entries(counts)) {
    ctx.fillText(k + ": " + v, VIEW_W / 2, y);
    y += 28;
  }
  y += 16;
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Take the Golden Chip, then leave by the green EXIT door.", VIEW_W / 2, y);
  y += 30;
  ctx.fillStyle = "#bdb49a";
  ctx.font = "15px sans-serif";
  ctx.fillText("Sprint is loud — guards come to listen. Crouch to shrink their sight.", VIEW_W / 2, y);
  y += 24;
  ctx.fillText("Hold E at a safe to crack it (+500). Hold E at a terminal to blind a camera for 25s.", VIEW_W / 2, y);
  y += 24;
  ctx.fillText("Alarm 100 = lockdown: exit sealed, every guard runs at you.", VIEW_W / 2, y);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("ENTER — begin the heist      ESC — back to menu", VIEW_W / 2, 620);
}

export function drawPause(ctx) {
  ctx.fillStyle = "rgba(5,5,10,0.7)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 440, 300, 400, 170);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", VIEW_W / 2, 360);
  ctx.fillStyle = "#bdb49a";
  ctx.font = "15px sans-serif";
  ctx.fillText("P resume · R restart the heist · ESC menu", VIEW_W / 2, 410);
}

export function drawComplete(ctx, game) {
  ctx.fillStyle = "rgba(5,5,10,0.72)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 340, 180, 600, 420);
  const stars = starsFor(game);
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 34px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("CLEAN GETAWAY", VIEW_W / 2, 245);
  ctx.font = "44px sans-serif";
  ctx.fillText("★".repeat(stars) + "☆".repeat(3 - stars), VIEW_W / 2, 305);
  ctx.fillStyle = "#ffffff";
  ctx.font = "17px sans-serif";
  ctx.fillText(game.levelName + " — score " + game.score + (game.ghost ? "  ·  GHOST (never seen) +300" : ""), VIEW_W / 2, 350);
  ctx.fillText("Loot " + game.loot.filter((l) => l.taken).length + "/" + game.loot.length + "  ·  Safes " + game.safes.filter((s) => s.opened).length + "/" + game.safes.length + "  ·  Time left " + Math.ceil(game.timeLeft) + "s", VIEW_W / 2, 382);
  ctx.fillStyle = "#bdb49a";
  ctx.font = "15px sans-serif";
  ctx.fillText("ENTER — next heist      R — replay      ESC — menu", VIEW_W / 2, 450);
  ctx.fillText("1–5 — jump to a heist", VIEW_W / 2, 480);
}

export function drawCaught(ctx, game, kind) {
  ctx.fillStyle = "rgba(60,5,5,0.72)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 340, 220, 600, 340);
  ctx.fillStyle = "#ff5040";
  ctx.font = "bold 38px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(kind === "time" ? "TIME'S UP!" : "CAUGHT!", VIEW_W / 2, 290);
  ctx.fillStyle = "#ffffff";
  ctx.font = "17px sans-serif";
  if (kind === "time") {
    ctx.fillText("The clock hit zero — the crew walks away empty-handed.", VIEW_W / 2, 340);
  } else {
    ctx.fillText("A floor man has you by the collar. " + (game.lives > 0 ? game.lives + (game.lives === 1 ? " life" : " lives") + " left." : "That was the last life."), VIEW_W / 2, 340);
  }
  ctx.fillStyle = "#bdb49a";
  ctx.font = "15px sans-serif";
  if (kind === "time" || game.lives > 0) ctx.fillText("ENTER — try the heist again      ESC — menu", VIEW_W / 2, 400);
  else ctx.fillText("ENTER — back to the menu", VIEW_W / 2, 400);
}

export function drawGameOver(ctx, game) {
  drawCaught(ctx, game);
}

export function drawVictory(ctx, totalScore) {
  ctx.fillStyle = "#0a241c";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 56px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("THE CREW WALKS AWAY", VIEW_W / 2, 200);
  ctx.fillStyle = "#e8dcc0";
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText("Five rooms, five Golden Chips, and nobody saw a thing — or lived to tell it.", VIEW_W / 2, 250);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("TOTAL SCORE  " + totalScore, VIEW_W / 2, 340);
  ctx.font = "44px sans-serif";
  ctx.fillText("★ ★ ★", VIEW_W / 2, 410);
  ctx.fillStyle = "#bdb49a";
  ctx.font = "16px sans-serif";
  ctx.fillText("ENTER — play again      ESC — menu", VIEW_W / 2, 480);
  ctx.fillStyle = "#8fa3d9";
  ctx.font = "13px sans-serif";
  ctx.fillText("The Copper Chip — an original heist game. Thanks for playing.", VIEW_W / 2, 760);
}
