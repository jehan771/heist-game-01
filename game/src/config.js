// The Copper Chip — constants, mission meta and scoring.
// One job: every number the game balances on lives here.
export const TILE = 32;
export const COLS = 40;
export const ROWS = 25;
export const VIEW_W = 1280;
export const VIEW_H = 800;

// Player movement, tiles per second.
export const WALK_SPEED = 3.4;
export const SPRINT_SPEED = 5.2;
export const CROUCH_SPEED = 1.9;
export const PLAYER_RADIUS = 0.32; // tiles

// Guard senses.
export const GUARD_VIEW_RANGE = 7.5; // tiles, player standing
export const GUARD_VIEW_RANGE_CROUCH = 5.2; // tiles, player crouched
export const GUARD_CONE_HALF = 0.61; // radians (~35 deg)
export const GUARD_PATROL_SPEED = 2.1;
export const GUARD_CHASE_SPEED = 3.5;
export const GUARD_SUSPICION_RATE = 55; // per second while seen
export const GUARD_SUSPICION_DECAY = 14; // per second while unseen
export const GUARD_INVESTIGATE_AT = 45;
export const GUARD_ALARM_AT = 100;
export const GUARD_CATCH_RADIUS = 0.55; // tiles
export const GUARD_WAYPOINT_PAUSE = 0.8; // seconds

// Cameras.
export const CAMERA_VIEW_RANGE = 8.0;
export const CAMERA_CONE_HALF = 0.52; // radians (~30 deg)
export const CAMERA_ALARM_RATE = 26; // alarm per second while seen
export const CAMERA_DISABLE_SECONDS = 25;

// Alarm meter (global, 0..100).
export const ALARM_GUARD_RATE = 9; // per second while any guard sees player
export const ALARM_DECAY = 4; // per second while nobody sees player
export const ALARM_LOCKDOWN_SECONDS = 8;
export const ALARM_AFTER_LOCKDOWN = 40;

// Noise: sprinting is heard this far (pixels).
export const NOISE_RADIUS = 120;

// Interact (hold E).
export const SAFE_CRACK_SECONDS = 3;
export const TERMINAL_HACK_SECONDS = 2;
export const INTERACT_RANGE = 1.3; // tiles

// Scoring.
export const SCORE_LOOT_CHIP = 100;
export const SCORE_LOOT_CASH = 150;
export const SCORE_TARGET = 400;
export const SCORE_SAFE = 500;
export const SCORE_GHOST_BONUS = 300;
export const SCORE_TIME_PER_SECOND = 5;

// Mission meta: name, par time, loot kinds are placed on the map itself.
export const MISSIONS = [
  { name: "The Lobby", time: 120, brief: "Slip past the floor men, lift the chips, grab the Golden Chip and leave by the service door." },
  { name: "The Slots Floor", time: 120, brief: "Rows of machines, rows of eyes. The Golden Chip waits at the far wall." },
  { name: "The High-Roller Room", time: 110, brief: "One safe, velvet ropes, and guards who know the high rollers by name." },
  { name: "The Count Room", time: 100, brief: "Cash cages and a safe. Cameras sweep the counting tables — hack a terminal to blind one." },
  { name: "The Vault Beneath", time: 100, brief: "Two safes, five guards, three cameras. The Copper Chip itself is down here." },
];

export const LIVES_PER_HEIST = 3;
