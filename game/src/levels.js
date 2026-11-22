// The Copper Chip — the five casino floors.
// Map legend: # wall, . floor, T table/slot (blocks sight + movement),
// H tall plant (blocks sight + movement), P player spawn, E service exit,
// L chip-stack loot, * the Golden Chip target, F safe, K camera terminal,
// G guard spawn. Maps are built programmatically (border + placements) so
// every row is exactly 40 wide and the grid exactly 25 tall. Patrols and
// camera sweeps are defined per level below. All waypoints sit on floor.
import { MISSIONS } from "./config.js";

function buildMap(place) {
  const grid = [];
  for (let y = 0; y < 25; y++) {
    const row = new Array(40).fill(".");
    row[0] = "#";
    row[39] = "#";
    grid.push(row);
  }
  for (let x = 0; x < 40; x++) {
    grid[0][x] = "#";
    grid[24][x] = "#";
  }
  // Player spawn and service exit are the same on every floor.
  grid[1][1] = "P";
  grid[23][1] = "E";
  place(grid);
  return grid.map((row) => row.join(""));
}

function put(grid, x, y, ch) {
  grid[y][x] = ch;
}

function putAll(grid, list, ch) {
  for (const [x, y] of list) put(grid, x, y, ch);
}

// A walled room with a two-tile door gap in its south wall.
function room(grid, x0, y0, x1, y1, doorX) {
  for (let x = x0; x <= x1; x++) {
    grid[y0][x] = "#";
    if (x !== doorX && x !== doorX + 1) grid[y1][x] = "#";
  }
  for (let y = y0; y <= y1; y++) {
    grid[y][x0] = "#";
    grid[y][x1] = "#";
  }
}

const MAP_LOBBY = buildMap((g) => {
  putAll(g, [[7, 1], [14, 1], [25, 1], [32, 1], [9, 2], [17, 2], [27, 2], [35, 2], [3, 3], [12, 3], [22, 3], [31, 3], [37, 3], [11, 4], [29, 4], [3, 5], [7, 5], [30, 5], [35, 5], [8, 7], [30, 7], [3, 9], [7, 9], [30, 9], [35, 9], [5, 11], [13, 11], [22, 11], [30, 11], [36, 11], [3, 13], [7, 13], [17, 13], [26, 13], [34, 13], [37, 13], [7, 15], [12, 15], [22, 15], [28, 15], [35, 15], [3, 16], [8, 17], [14, 17], [19, 17], [24, 17], [30, 17], [35, 17], [3, 19], [7, 19], [17, 19], [27, 19], [35, 19], [37, 20], [4, 21], [11, 21], [28, 21], [33, 21]], "T");
  room(g, 16, 5, 21, 9, 18); // small strong-room, door faces south
  put(g, 18, 7, "F");
  put(g, 18, 3, "L");
  put(g, 33, 21, "L");
  put(g, 18, 21, "*");
  put(g, 20, 16, "K");
  put(g, 3, 7, "G");
  put(g, 35, 7, "G");
});

const MAP_SLOTS = buildMap((g) => {
  // Rows of slot machines, alternating offsets; even rows stay open lanes.
  const rowA = [4, 8, 12, 16, 20, 24, 28, 32, 36];
  const rowB = [2, 6, 10, 14, 18, 22, 26, 30, 34];
  for (const y of [1, 5, 9, 13, 17, 21]) putAll(g, rowA.map((x) => [x, y]), "T");
  for (const y of [3, 7, 15, 19]) putAll(g, rowB.map((x) => [x, y]), "T");
  put(g, 18, 5, "L");
  put(g, 15, 18, "L");
  put(g, 18, 22, "*");
  put(g, 19, 15, "K");
  put(g, 3, 10, "G");
  put(g, 36, 10, "G");
  put(g, 20, 6, "G");
});

const MAP_HIGH_ROLLER = buildMap((g) => {
  putAll(g, [[8, 1], [16, 1], [30, 1], [10, 2], [28, 2], [3, 3], [35, 3], [7, 5], [31, 5], [8, 7], [31, 7], [7, 9], [31, 9], [3, 13], [7, 13], [15, 13], [24, 13], [31, 13], [35, 13], [8, 17], [15, 17], [24, 17], [31, 17], [7, 19], [30, 19], [3, 21], [7, 21], [15, 21], [24, 21], [31, 21], [35, 21]], "T");
  putAll(g, [[11, 3], [28, 3], [9, 15], [30, 15]], "H");
  room(g, 14, 5, 23, 11, 18); // high-roller strong-room
  put(g, 16, 7, "L");
  put(g, 18, 9, "F");
  put(g, 8, 21, "L");
  put(g, 31, 21, "L");
  put(g, 19, 21, "*");
  put(g, 19, 17, "K");
  put(g, 3, 7, "G");
  put(g, 35, 7, "G");
  put(g, 19, 2, "G");
});

const MAP_COUNT_ROOM = buildMap((g) => {
  putAll(g, [[6, 1], [12, 1], [18, 1], [24, 1], [30, 1], [3, 3], [9, 3], [15, 3], [21, 3], [27, 3], [33, 3], [5, 5], [30, 5], [31, 7], [5, 9], [30, 9], [5, 11], [30, 11], [3, 13], [9, 13], [15, 13], [21, 13], [27, 13], [33, 13], [5, 15], [11, 15], [27, 15], [33, 15], [3, 17], [9, 17], [15, 17], [21, 17], [27, 17], [33, 17], [5, 19], [11, 19], [27, 19], [33, 19], [3, 21], [9, 21], [15, 21], [27, 21], [33, 21]], "T");
  room(g, 14, 5, 23, 11, 18); // count-room cage
  put(g, 16, 7, "L");
  put(g, 18, 9, "F");
  put(g, 18, 19, "L");
  put(g, 20, 21, "*");
  put(g, 19, 15, "K");
  put(g, 3, 7, "G");
  put(g, 35, 7, "G");
  put(g, 19, 2, "G");
  put(g, 10, 21, "G");
});

const MAP_VAULT = buildMap((g) => {
  const rowA = [4, 8, 12, 16, 20, 24, 28, 32, 36];
  const rowB = [2, 6, 10, 14, 18, 22, 26, 30, 34];
  for (const y of [1, 13, 21]) putAll(g, rowA.map((x) => [x, y]), "T");
  for (const y of [3, 17]) putAll(g, rowB.map((x) => [x, y]), "T");
  putAll(g, [[5, 5], [30, 5], [31, 7], [5, 9], [30, 9], [5, 11], [30, 11], [5, 15], [11, 15], [27, 15], [33, 15], [5, 19], [11, 19], [27, 19], [33, 19]], "T");
  room(g, 14, 5, 23, 11, 18); // the vault
  put(g, 16, 7, "L");
  put(g, 18, 7, "F");
  put(g, 18, 9, "F");
  put(g, 18, 17, "L");
  put(g, 19, 19, "*");
  put(g, 18, 15, "K");
  put(g, 3, 7, "G");
  put(g, 35, 7, "G");
  put(g, 19, 2, "G");
  put(g, 10, 21, "G");
  put(g, 19, 22, "G");
});

const MAPS = [MAP_LOBBY, MAP_SLOTS, MAP_HIGH_ROLLER, MAP_COUNT_ROOM, MAP_VAULT];

// Guard patrols: waypoints in tile coordinates (x, y). The first waypoint
// is the guard's spawn and sits on a G tile in the map.
const GUARDS = [
  // The Lobby
  [
    { waypoints: [[3, 7], [12, 7], [12, 16], [3, 15]] },
    { waypoints: [[35, 7], [26, 7], [26, 16], [35, 16]] },
  ],
  // The Slots Floor
  [
    { waypoints: [[3, 10], [20, 10], [20, 20], [3, 20]] },
    { waypoints: [[36, 10], [20, 10], [20, 20], [36, 20]] },
    { waypoints: [[20, 6], [20, 11], [20, 19], [10, 11]] },
  ],
  // The High-Roller Room
  [
    { waypoints: [[3, 7], [12, 7], [12, 17], [3, 17]] },
    { waypoints: [[35, 7], [26, 7], [26, 17], [35, 17]] },
    { waypoints: [[19, 2], [19, 13], [30, 13], [30, 2]] },
  ],
  // The Count Room
  [
    { waypoints: [[3, 7], [12, 7], [12, 18], [3, 18]] },
    { waypoints: [[35, 7], [26, 7], [26, 18], [35, 18]] },
    { waypoints: [[19, 2], [19, 12], [30, 12], [30, 2]] },
    { waypoints: [[10, 21], [21, 21], [21, 14], [10, 14]] },
  ],
  // The Vault Beneath
  [
    { waypoints: [[3, 7], [12, 7], [12, 18], [3, 18]] },
    { waypoints: [[35, 7], [26, 7], [26, 18], [35, 18]] },
    { waypoints: [[19, 2], [19, 13], [30, 13], [30, 2]] },
    { waypoints: [[10, 21], [21, 21], [21, 14], [10, 14]] },
    { waypoints: [[19, 22], [32, 22], [32, 15], [19, 15]] },
  ],
];

// Cameras: mounted on a floor tile next to a wall. baseAngle in radians
// (0 = east, PI/2 = south); the cone sweeps baseAngle +/- sweep.
const CAMERAS = [
  // The Lobby: one camera high on the north wall, sweeping the middle.
  [{ x: 20, y: 1, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.45 }],
  // The Slots Floor: two cameras, north and south walls.
  [
    { x: 10, y: 1, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.5 },
    { x: 30, y: 23, baseAngle: -Math.PI / 2, sweep: 0.7, speed: 0.5 },
  ],
  // The High-Roller Room: north + east.
  [
    { x: 19, y: 1, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.55 },
    { x: 38, y: 12, baseAngle: Math.PI, sweep: 0.7, speed: 0.5 },
  ],
  // The Count Room: north, south, east.
  [
    { x: 10, y: 1, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.5 },
    { x: 30, y: 23, baseAngle: -Math.PI / 2, sweep: 0.7, speed: 0.5 },
    { x: 38, y: 12, baseAngle: Math.PI, sweep: 0.7, speed: 0.6 },
  ],
  // The Vault Beneath: north, south, east.
  [
    { x: 19, y: 1, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.6 },
    { x: 19, y: 23, baseAngle: -Math.PI / 2, sweep: 0.8, speed: 0.6 },
    { x: 38, y: 12, baseAngle: Math.PI, sweep: 0.7, speed: 0.55 },
  ],
];

export function getLevel(index) {
  const mission = MISSIONS[index];
  return {
    index,
    name: mission.name,
    time: mission.time,
    brief: mission.brief,
    map: MAPS[index],
    guards: GUARDS[index],
    cameras: CAMERAS[index],
  };
}

export function levelCount() {
  return MAPS.length;
}
