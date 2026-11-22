// The Copper Chip — pure game logic. No DOM, no canvas: Node can run it.
// The browser only renders this state and feeds it input.
import {
  COLS, ROWS, WALK_SPEED, SPRINT_SPEED, CROUCH_SPEED, PLAYER_RADIUS,
  GUARD_VIEW_RANGE, GUARD_VIEW_RANGE_CROUCH, GUARD_CONE_HALF,
  GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_SUSPICION_RATE,
  GUARD_SUSPICION_DECAY, GUARD_INVESTIGATE_AT, GUARD_ALARM_AT,
  GUARD_CATCH_RADIUS, GUARD_WAYPOINT_PAUSE, CAMERA_VIEW_RANGE,
  CAMERA_CONE_HALF, CAMERA_ALARM_RATE, CAMERA_DISABLE_SECONDS,
  ALARM_GUARD_RATE, ALARM_DECAY, ALARM_LOCKDOWN_SECONDS,
  ALARM_AFTER_LOCKDOWN, NOISE_RADIUS, SAFE_CRACK_SECONDS,
  TERMINAL_HACK_SECONDS, INTERACT_RANGE, SCORE_LOOT_CHIP,
  SCORE_TARGET, SCORE_SAFE, SCORE_GHOST_BONUS, SCORE_TIME_PER_SECOND,
} from "./config.js";
import { getLevel } from "./levels.js";

const SIGHT_BLOCKERS = new Set(["#", "T", "H"]);
const MOVE_BLOCKERS = new Set(["#", "T", "H", "F", "K"]);

export function tileChar(grid, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return "#";
  return grid[y][x];
}

export function isBlocked(grid, x, y) {
  return MOVE_BLOCKERS.has(tileChar(grid, x, y));
}

export function blocksSight(grid, x, y) {
  return SIGHT_BLOCKERS.has(tileChar(grid, x, y));
}

// Sampled line of sight: true when no sight-blocking tile is crossed.
export function hasLOS(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 0.1));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(grid, Math.floor(x0 + dx * t), Math.floor(y0 + dy * t))) return false;
  }
  return true;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

// Is the target tile visible from (ox, oy) facing `angle`?
export function canSee(grid, ox, oy, angle, range, halfAngle, tx, ty) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist > 0.05 && Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return hasLOS(grid, ox, oy, tx, ty);
}

// Breadth-first path over walkable tiles; returns tile centers, start excluded.
export function findPath(grid, sx, sy, tx, ty) {
  sx = Math.floor(sx);
  sy = Math.floor(sy);
  tx = Math.floor(tx);
  ty = Math.floor(ty);
  if (isBlocked(grid, tx, ty)) return null;
  if (sx === tx && sy === ty) return [];
  const key = (x, y) => y * COLS + x;
  const prev = new Map();
  const seen = new Set([key(sx, sy)]);
  const queue = [[sx, sy]];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (isBlocked(grid, nx, ny)) continue;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      prev.set(k, [cx, cy]);
      if (nx === tx && ny === ty) {
        const path = [];
        let cur = [tx, ty];
        while (!(cur[0] === sx && cur[1] === sy)) {
          path.unshift({ x: cur[0] + 0.5, y: cur[1] + 0.5 });
          cur = prev.get(key(cur[0], cur[1]));
        }
        return path;
      }
      queue.push([nx, ny]);
    }
  }
  return null;
}

export function createGame(levelIndex, opts = {}) {
  const level = getLevel(levelIndex);
  const grid = level.map.map((row) => row.split(""));
  const game = {
    levelIndex,
    levelName: level.name,
    brief: level.brief,
    timeTotal: level.time,
    timeLeft: level.time,
    grid,
    lives: opts.lives ?? 3,
    score: opts.score ?? 0,
    missionScore: opts.score ?? 0,
    alarm: 0,
    lockdown: 0,
    ghost: true,
    status: "playing", // playing | caught | complete | failed | gameover
    elapsed: 0,
    events: [],
    exit: { x: 0, y: 0, open: false },
    target: { x: 0, y: 0, taken: false },
    player: { x: 1.5, y: 1.5, angle: 0, crouch: false, sprint: false, moving: false, path: null },
    guards: [],
    cameras: [],
    loot: [],
    safes: [],
    terminals: [],
  };
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      if (c === "P") { game.player.x = x + 0.5; game.player.y = y + 0.5; }
      else if (c === "E") game.exit = { x: x + 0.5, y: y + 0.5, open: false };
      else if (c === "L") game.loot.push({ x: x + 0.5, y: y + 0.5, taken: false });
      else if (c === "*") game.target = { x: x + 0.5, y: y + 0.5, taken: false };
      else if (c === "F") game.safes.push({ x: x + 0.5, y: y + 0.5, progress: 0, opened: false });
      else if (c === "K") game.terminals.push({ x: x + 0.5, y: y + 0.5, progress: 0, used: false });
    }
  }
  game.guards = level.guards.map((def) => {
    const [sx, sy] = def.waypoints[0];
    const [nx, ny] = def.waypoints[1];
    return {
      x: sx + 0.5,
      y: sy + 0.5,
      angle: Math.atan2(ny - sy, nx - sx),
      state: "patrol",
      suspicion: 0,
      wpIndex: 1,
      pause: 0,
      scanTime: 0,
      lastSeen: null,
      loseSight: 0,
      repath: 0,
      path: null,
    };
  });
  game.cameras = level.cameras.map((def) => ({
    x: def.x + 0.5,
    y: def.y + 0.5,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    phase: 0,
    angle: def.baseAngle,
    disabled: 0,
  }));
  return game;
}

function moveCircle(game, entity, dx, dy) {
  // Axis-separated circle-vs-tile collision.
  const r = PLAYER_RADIUS;
  const nx = entity.x + dx;
  if (!isBlocked(game.grid, Math.floor(nx + Math.sign(dx) * r), Math.floor(entity.y - r + 0.01)) &&
      !isBlocked(game.grid, Math.floor(nx + Math.sign(dx) * r), Math.floor(entity.y + r - 0.01)) &&
      !isBlocked(game.grid, Math.floor(nx + Math.sign(dx) * r), Math.floor(entity.y))) {
    entity.x = nx;
  }
  const ny = entity.y + dy;
  if (!isBlocked(game.grid, Math.floor(entity.x - r + 0.01), Math.floor(ny + Math.sign(dy) * r)) &&
      !isBlocked(game.grid, Math.floor(entity.x + r - 0.01), Math.floor(ny + Math.sign(dy) * r)) &&
      !isBlocked(game.grid, Math.floor(entity.x), Math.floor(ny + Math.sign(dy) * r))) {
    entity.y = ny;
  }
}

function turnToward(entity, targetAngle, rate, dt) {
  const d = angleDiff(targetAngle, entity.angle);
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  entity.angle += step;
}

function guardSeesPlayer(game, guard) {
  const range = game.player.crouch ? GUARD_VIEW_RANGE_CROUCH : GUARD_VIEW_RANGE;
  return canSee(game.grid, guard.x, guard.y, guard.angle, range, GUARD_CONE_HALF, game.player.x, game.player.y);
}

function cameraSeesPlayer(game, cam) {
  if (cam.disabled > 0) return false;
  return canSee(game.grid, cam.x, cam.y, cam.angle, CAMERA_VIEW_RANGE, CAMERA_CONE_HALF, game.player.x, game.player.y);
}

// Danger of standing on a tile right now (for the self-test bot): 1 when a
// guard or camera cone covers it, else 0.
export function tileDanger(game, tx, ty) {
  const cx = tx + 0.5;
  const cy = ty + 0.5;
  for (const guard of game.guards) {
    if (canSee(game.grid, guard.x, guard.y, guard.angle, GUARD_VIEW_RANGE, GUARD_CONE_HALF, cx, cy)) return 1;
  }
  for (const cam of game.cameras) {
    if (cam.disabled <= 0 && canSee(game.grid, cam.x, cam.y, cam.angle, CAMERA_VIEW_RANGE, CAMERA_CONE_HALF, cx, cy)) return 1;
  }
  return 0;
}

export function step(game, dt, input) {
  if (game.status !== "playing") return game;
  game.elapsed += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.status = "failed";
    game.events.push("failed");
    return game;
  }
  const p = game.player;

  // --- Player movement: keys override click-to-move. ---
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx !== 0 || my !== 0) p.path = null;
  if (input.clickTile) {
    const path = findPath(game.grid, p.x, p.y, input.clickTile.x, input.clickTile.y);
    if (path) p.path = path;
  }
  if (mx === 0 && my === 0 && p.path && p.path.length) {
    const node = p.path[0];
    const dx = node.x - p.x;
    const dy = node.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.08) {
      p.path.shift();
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  const len = Math.hypot(mx, my);
  p.crouch = !!input.crouch;
  p.sprint = !!input.sprint && !p.crouch;
  const speed = p.crouch ? CROUCH_SPEED : p.sprint ? SPRINT_SPEED : WALK_SPEED;
  p.moving = len > 0;
  if (len > 0) {
    const nx = (mx / len) * speed * dt;
    const ny = (my / len) * speed * dt;
    moveCircle(game, p, nx, ny);
    p.angle = Math.atan2(my, mx);
  }

  // --- Noise: sprinting draws nearby guards to the player's position. ---
  if (p.moving && p.sprint) {
    for (const guard of game.guards) {
      const d = Math.hypot(guard.x - p.x, guard.y - p.y) * 32;
      if (d < NOISE_RADIUS && guard.state !== "chase") {
        guard.state = "investigate";
        guard.lastSeen = { x: p.x, y: p.y };
        guard.suspicion = Math.max(guard.suspicion, GUARD_INVESTIGATE_AT);
      }
    }
  }

  // --- Guards. ---
  let anyGuardSees = false;
  for (const guard of game.guards) {
    const sees = guardSeesPlayer(game, guard);
    if (sees) {
      anyGuardSees = true;
      game.ghost = false;
      guard.suspicion = Math.min(100, guard.suspicion + GUARD_SUSPICION_RATE * dt);
      guard.lastSeen = { x: p.x, y: p.y };
      guard.loseSight = 0;
      if (guard.suspicion >= GUARD_ALARM_AT) guard.state = "chase";
      else if (guard.suspicion >= GUARD_INVESTIGATE_AT && guard.state === "patrol") guard.state = "investigate";
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - GUARD_SUSPICION_DECAY * dt);
      if (guard.state === "chase") {
        guard.loseSight += dt;
        if (guard.loseSight > 3) {
          guard.state = "investigate";
          guard.loseSight = 0;
        }
      } else if (guard.state === "investigate" && guard.suspicion < 10 && !guard.lastSeen) {
        guard.state = "patrol";
      }
    }

    if (guard.state === "patrol") {
      if (guard.pause > 0) {
        guard.pause -= dt;
      } else {
        // Patrol along the waypoint loop via the tile path, so guards walk
        // around walls and through door gaps instead of through them.
        const level = getLevel(game.levelIndex);
        const def = level.guards[game.guards.indexOf(guard)];
        const wp = def.waypoints[guard.wpIndex];
        const tx = wp[0] + 0.5;
        const ty = wp[1] + 0.5;
        if (!guard.path) guard.path = findPath(game.grid, guard.x, guard.y, tx, ty);
        if (guard.path && guard.path.length) {
          const node = guard.path[0];
          const dx = node.x - guard.x;
          const dy = node.y - guard.y;
          const d = Math.hypot(dx, dy);
          if (d < 0.12) guard.path.shift();
          else {
            const sp = GUARD_PATROL_SPEED * dt;
            guard.x += (dx / d) * sp;
            guard.y += (dy / d) * sp;
            turnToward(guard, Math.atan2(dy, dx), 6, dt);
          }
        } else {
          // Arrived at the waypoint: pause, then move on.
          guard.path = null;
          guard.wpIndex = (guard.wpIndex + 1) % def.waypoints.length;
          guard.pause = GUARD_WAYPOINT_PAUSE;
        }
      }
    } else {
      // Investigate or chase: walk toward the target point.
      const target = guard.state === "chase" ? { x: p.x, y: p.y } : guard.lastSeen;
      if (target) {
        guard.repath -= dt;
        if (!guard.path || guard.repath <= 0) {
          guard.path = findPath(game.grid, guard.x, guard.y, target.x, target.y);
          guard.repath = 0.5;
        }
        const sp = (guard.state === "chase" ? GUARD_CHASE_SPEED : GUARD_PATROL_SPEED * 1.3) * dt;
        if (guard.path && guard.path.length) {
          const node = guard.path[0];
          const dx = node.x - guard.x;
          const dy = node.y - guard.y;
          const d = Math.hypot(dx, dy);
          if (d < 0.12) guard.path.shift();
          else {
            guard.x += (dx / d) * sp;
            guard.y += (dy / d) * sp;
            turnToward(guard, Math.atan2(dy, dx), 8, dt);
          }
        } else {
          // No path (already there): scan the area, then give up.
          guard.scanTime += dt;
          guard.angle += 1.6 * dt;
          if (guard.scanTime > 2.5) {
            guard.scanTime = 0;
            guard.lastSeen = null;
            guard.path = null;
            if (guard.state === "investigate") guard.state = "patrol";
          }
        }
      }
    }

    // Caught: a guard touches the player.
    if (Math.hypot(guard.x - p.x, guard.y - p.y) < GUARD_CATCH_RADIUS) {
      game.lives -= 1;
      game.events.push("caught");
      game.status = game.lives > 0 ? "caught" : "gameover";
      return game;
    }
  }

  // --- Cameras: sweep, and spot the player. ---
  let anyCameraSees = false;
  for (const cam of game.cameras) {
    if (cam.disabled > 0) cam.disabled -= dt;
    cam.phase += cam.speed * dt;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
    if (cameraSeesPlayer(game, cam)) {
      anyCameraSees = true;
      game.ghost = false;
    }
  }

  // --- Alarm meter. ---
  if (game.lockdown > 0) {
    game.lockdown -= dt;
    game.alarm = 100;
    if (game.lockdown <= 0) {
      game.alarm = ALARM_AFTER_LOCKDOWN;
      game.events.push("lockdownOver");
    }
  } else {
    if (anyGuardSees) game.alarm += ALARM_GUARD_RATE * dt;
    if (anyCameraSees) game.alarm += CAMERA_ALARM_RATE * dt;
    if (!anyGuardSees && !anyCameraSees) game.alarm -= ALARM_DECAY * dt;
    game.alarm = Math.max(0, Math.min(100, game.alarm));
    if (game.alarm >= 100) {
      game.lockdown = ALARM_LOCKDOWN_SECONDS;
      game.events.push("lockdown");
      for (const guard of game.guards) {
        guard.state = "chase";
        guard.lastSeen = { x: p.x, y: p.y };
      }
    }
  }

  // --- Loot + target. ---
  for (const loot of game.loot) {
    if (!loot.taken && Math.hypot(loot.x - p.x, loot.y - p.y) < 0.6) {
      loot.taken = true;
      game.score += SCORE_LOOT_CHIP;
      game.events.push("pickup");
    }
  }
  if (!game.target.taken && Math.hypot(game.target.x - p.x, game.target.y - p.y) < 0.6) {
    game.target.taken = true;
    game.score += SCORE_TARGET;
    game.exit.open = true;
    game.events.push("target");
  }

  // --- Interact: safes and camera terminals (hold E nearby). ---
  const interact = !!input.interact;
  for (const safe of game.safes) {
    if (safe.opened) continue;
    const near = Math.hypot(safe.x - p.x, safe.y - p.y) < INTERACT_RANGE;
    if (near && interact) {
      safe.progress += dt / SAFE_CRACK_SECONDS;
      if (safe.progress >= 1) {
        safe.opened = true;
        game.score += SCORE_SAFE;
        game.events.push("safe");
      }
    } else {
      safe.progress = Math.max(0, safe.progress - dt * 0.5);
    }
  }
  for (const term of game.terminals) {
    if (term.used) continue;
    const near = Math.hypot(term.x - p.x, term.y - p.y) < INTERACT_RANGE;
    if (near && interact) {
      term.progress += dt / TERMINAL_HACK_SECONDS;
      if (term.progress >= 1) {
        term.used = true;
        let best = null;
        let bestD = Infinity;
        for (const cam of game.cameras) {
          const d = Math.hypot(cam.x - term.x, cam.y - term.y);
          if (d < bestD) { bestD = d; best = cam; }
        }
        if (best) best.disabled = CAMERA_DISABLE_SECONDS;
        game.events.push("hack");
      }
    } else {
      term.progress = Math.max(0, term.progress - dt * 0.5);
    }
  }

  // --- Exit: the heist is done when the target is taken and Rook reaches it. ---
  if (game.exit.open && Math.hypot(game.exit.x - p.x, game.exit.y - p.y) < 0.6) {
    game.score += Math.round(game.timeLeft) * SCORE_TIME_PER_SECOND;
    if (game.ghost) game.score += SCORE_GHOST_BONUS;
    game.status = "complete";
    game.events.push("complete");
  }
  return game;
}

export function lootLeft(game) {
  return game.loot.filter((l) => !l.taken).length + (game.target.taken ? 0 : 1);
}

export function starsFor(game) {
  if (game.status !== "complete") return 0;
  const allLoot = game.loot.every((l) => l.taken) && game.safes.every((s) => s.opened);
  if (game.ghost && allLoot) return 3;
  if (game.timeLeft >= 30) return 2;
  return 1;
}
