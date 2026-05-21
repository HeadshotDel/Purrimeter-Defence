"use strict";

// Config and balance live near the top so the MVP is easy to tune.
const CONFIG = {
  useImageAssets: true,
  gridRows: 5,
  gridCols: 12,
  startFish: 125,
  startLives: 5,
  naturalFishValue: 25,
  fishCatDropValue: 32,
  fishDropLifetime: 8,
  firstNaturalFishDropDelay: 0.8,
  interWaveDelay: 8,
  firstWaveDelay: 6,
  waveStartDelay: 0.8,
  feedbackFlashSeconds: 0.55,
  bossWarningSeconds: 2.4,
  enemyEntranceOffset: 64,
  baseColumnBuffer: -0.45,
  bestRunStorageKey: "catline-defense-best-runs",
  mutedStorageKey: "purrimeter-muted",
  debugWaveFlow: false,
  debugPanic: false,
};

const UI_TEXT = {
  startTagline: "Pixel cats defend the rooftop",
  rules: [
    "Collect falling fish by hovering over them",
    "Place cats",
    "Cards recharge after deployment",
    "Stop mice, rats and rogue machines",
  ],
  hints: {
    empty: "Select a cat",
    selected: "Choose a tile",
    deployed: "Cat deployed",
    noFish: "Not enough fish",
    occupied: "Tile occupied",
    coolingDown: "Cooling down",
    removed: "Cat removed",
    removeCancelled: "Remove cancelled",
    startWaveFirst: "Start the wave first",
    upgradeSoon: "Upgrade coming soon",
    paused: "Paused",
    ready: "Ready",
  },
  waveTips: [
    "Hover fish to collect resources.",
    "Build a few lanes before pressure rises.",
    "Economy cats help against armored rats.",
    "Roombas need blockers and heavy shots.",
    "Watch drones near your best shooters.",
    "Freeze and tanks are key against the boss.",
  ],
  waveMessages: [
    "Small pests incoming",
    "More paws on deck",
    "Armored rats detected",
    "Machines are rolling in",
    "Fast trouble on the roof",
    "Smart Vacuum Boss approaching",
  ],
  results: {
    victory: {
      title: "Victory!",
      message: "The rooftop is safe.",
      kicker: "Defense complete",
    },
    gameover: {
      title: "Game Over",
      message: "The pests broke through.",
      kicker: "Defense failed",
    },
  },
};

const catTypes = {
  yarn: {
    id: "yarn",
    name: "Yarn Cat",
    price: 50,
    role: "Basic ranged",
    description: "Good vs small pests. Weak vs machines.",
    hp: 135,
    placeCooldown: 5,
    upgradeCost: 75,
    level2: { damage: 1.5, attackCooldown: 0.85, hp: 1.2 },
    damage: 18,
    attackCooldown: 1.35,
    attackKind: "projectile",
    attackType: "yarn",
    projectileType: "yarn",
    projectileSpeed: 300,
    className: "cat-yarn",
  },
  tank: {
    id: "tank",
    name: "Tank Cat",
    price: 100,
    role: "Blocks lanes",
    description: "High HP wall that buys time for shooters.",
    hp: 520,
    placeCooldown: 7,
    upgradeCost: 90,
    level2: { hp: 1.7 },
    damage: 0,
    attackCooldown: 0,
    attackKind: "none",
    attackType: "block",
    className: "cat-tank",
  },
  sniper: {
    id: "sniper",
    name: "Sniper Cat",
    price: 120,
    role: "Heavy shots",
    description: "Good vs armored machines.",
    hp: 115,
    placeCooldown: 9,
    upgradeCost: 130,
    level2: { damage: 1.6, attackCooldown: 0.9 },
    damage: 95,
    attackCooldown: 2.6,
    attackKind: "projectile",
    attackType: "pierce",
    projectileType: "sniper",
    projectileSpeed: 560,
    className: "cat-sniper",
  },
  fish: {
    id: "fish",
    name: "Fish Cat",
    price: 70,
    role: "Generates fish",
    description: "Creates collectible fish.",
    hp: 95,
    placeCooldown: 9,
    upgradeCost: 100,
    level2: { produceAmountBonus: 10, produceCooldown: 0.85 },
    damage: 0,
    attackCooldown: 0,
    attackKind: "producer",
    attackType: "economy",
    produceCooldown: 8.5,
    produceAmount: 32,
    className: "cat-fish",
  },
  ninja: {
    id: "ninja",
    name: "Ninja Cat",
    price: 90,
    role: "Close combat",
    description: "Good vs fast pests.",
    hp: 170,
    placeCooldown: 6,
    upgradeCost: 110,
    level2: { damage: 1.4, attackCooldown: 0.8, hp: 1.25 },
    damage: 34,
    attackCooldown: 0.62,
    attackKind: "melee",
    attackType: "melee",
    meleeRangeCells: 0.92,
    className: "cat-ninja",
  },
  freezer: {
    id: "freezer",
    name: "Freezer Cat",
    price: 110,
    role: "Slows enemies",
    description: "Slows, weaker vs machines.",
    hp: 135,
    placeCooldown: 10,
    upgradeCost: 120,
    level2: { damage: 1.25, slowDuration: 1.1, attackCooldown: 0.9 },
    damage: 11,
    attackCooldown: 2.05,
    attackKind: "projectile",
    attackType: "freeze",
    projectileType: "freeze",
    projectileSpeed: 250,
    slowDuration: 1.9,
    slowFactor: 0.6,
    className: "cat-freezer",
  },
};

const enemyTypes = {
  mouse: {
    id: "mouse",
    name: "Mouse",
    hp: 54,
    speed: 48,
    damage: 13,
    attackCooldown: 1.05,
    reward: 8,
    tags: ["organic", "swarm"],
    className: "enemy-mouse",
  },
  rat: {
    id: "rat",
    name: "Rat",
    hp: 110,
    speed: 31,
    damage: 18,
    attackCooldown: 1.15,
    reward: 13,
    tags: ["organic"],
    className: "enemy-rat",
  },
  canRat: {
    id: "canRat",
    name: "Can Rat",
    hp: 245,
    speed: 18,
    damage: 22,
    attackCooldown: 1.2,
    reward: 22,
    armor: 3,
    tags: ["organic", "armored"],
    className: "enemy-can-rat",
  },
  roomba: {
    id: "roomba",
    name: "Roomba",
    hp: 330,
    speed: 21,
    damage: 24,
    attackCooldown: 1,
    reward: 28,
    armor: 5,
    blockRadiusCells: 0.52,
    tags: ["mechanical", "armored"],
    className: "enemy-roomba",
  },
  pigeon: {
    id: "pigeon",
    name: "Pigeon",
    hp: 86,
    speed: 51,
    damage: 16,
    attackCooldown: 0.9,
    reward: 14,
    tags: ["organic", "fast"],
    className: "enemy-pigeon",
  },
  laserDrone: {
    id: "laserDrone",
    name: "Laser Drone",
    hp: 142,
    speed: 28,
    damage: 15,
    attackCooldown: 1.1,
    reward: 20,
    debuffRadiusCells: 1.55,
    debuffFactor: 1.8,
    debuffEffectText: "jam",
    tags: ["mechanical", "flying", "debuff"],
    className: "enemy-laser-drone",
  },
  cucumber: {
    id: "cucumber",
    name: "Cucumber",
    hp: 82,
    speed: 61,
    damage: 12,
    attackCooldown: 0.9,
    reward: 12,
    debuffRadiusCells: 0.95,
    debuffFactor: 1.35,
    debuffEffectText: "panic",
    tags: ["hazard", "panic"],
    className: "enemy-cucumber",
  },
  "spray-bottle": {
    id: "spray-bottle",
    name: "Spray Bottle",
    hp: 155,
    speed: 27,
    damage: 14,
    attackCooldown: 1.05,
    reward: 18,
    debuffRadiusCells: 1.35,
    debuffFactor: 1.55,
    debuffEffectText: "spritz",
    tags: ["hazard", "water"],
    className: "enemy-spray-bottle",
  },
  "hair-dryer": {
    id: "hair-dryer",
    name: "Hair Dryer",
    hp: 460,
    speed: 16,
    damage: 22,
    attackCooldown: 1,
    reward: 38,
    armor: 2,
    blockRadiusCells: 0.55,
    debuffRadiusCells: 2.2,
    debuffFactor: 1.65,
    debuffEffectText: "wind",
    tags: ["hazard", "wind", "armored"],
    className: "enemy-hair-dryer",
  },
  "robot-mop": {
    id: "robot-mop",
    name: "Robot Mop",
    hp: 520,
    speed: 19,
    damage: 26,
    attackCooldown: 1.05,
    reward: 42,
    armor: 4,
    blockRadiusCells: 0.58,
    debuffRadiusCells: 1.45,
    debuffFactor: 1.7,
    debuffEffectText: "wet",
    tags: ["mechanical", "water", "armored"],
    className: "enemy-robot-mop",
  },
  "foil-ball": {
    id: "foil-ball",
    name: "Tin Foil Ball",
    hp: 34,
    speed: 67,
    damage: 10,
    attackCooldown: 0.85,
    reward: 7,
    tags: ["swarm", "fast"],
    className: "enemy-foil-ball",
  },
  boss: {
    id: "boss",
    name: "Smart Vacuum Boss",
    hp: 1320,
    speed: 13.5,
    damage: 38,
    attackCooldown: 0.9,
    reward: 95,
    armor: 6,
    blockRadiusCells: 0.72,
    tags: ["mechanical", "boss", "armored"],
    className: "enemy-boss enemy-smart-vacuum-boss",
  },
};

const fallbackEnemyType = {
  id: "unknown",
  name: "Unknown Enemy",
  hp: 90,
  speed: 24,
  damage: 12,
  attackCooldown: 1.15,
  reward: 0,
  tags: [],
  className: "enemy-generic",
};

function getEnemyDefinition(typeId) {
  const type = enemyTypes[typeId];
  if (type) return type;
  debugWave("unknown enemy type fallback", { enemyType: typeId });
  return fallbackEnemyType;
}

function getEnemyTags(enemy) {
  const typeId = typeof enemy === "string" ? enemy : enemy?.type ?? enemy?.id;
  return getEnemyDefinition(typeId).tags ?? [];
}

function enemyHasTag(enemy, tag) {
  return getEnemyTags(enemy).includes(tag);
}

// Keep counters readable: each attack type has a few broad strengths and weaknesses.
function getDamageMultiplier(attackType, enemy) {
  switch (attackType) {
    case "yarn":
      if (enemyHasTag(enemy, "boss")) return 0.5;
      if (enemyHasTag(enemy, "mechanical")) return 0.65;
      if (enemyHasTag(enemy, "armored")) return 0.75;
      if (enemyHasTag(enemy, "swarm")) return 1.15;
      return 1;
    case "pierce":
      if (enemyHasTag(enemy, "swarm")) return 0.75;
      if (enemyHasTag(enemy, "boss")) return 1;
      if (enemyHasTag(enemy, "armored")) return 1.25;
      if (enemyHasTag(enemy, "mechanical")) return 1.2;
      return 1;
    case "melee":
      if (enemyHasTag(enemy, "boss")) return 0.75;
      if (enemyHasTag(enemy, "mechanical")) return 0.8;
      if (enemyHasTag(enemy, "armored")) return 0.85;
      if (enemyHasTag(enemy, "swarm")) return 1.25;
      if (enemyHasTag(enemy, "organic")) return 1.15;
      return 1;
    case "freeze":
      if (enemyHasTag(enemy, "boss")) return 0.35;
      if (enemyHasTag(enemy, "mechanical")) return 0.5;
      if (enemyHasTag(enemy, "swarm")) return 0.8;
      if (enemyHasTag(enemy, "organic")) return 0.75;
      return 0.75;
    default:
      return 1;
  }
}

function calculateDamage(baseDamage, attackType, enemy) {
  const multiplier = getDamageMultiplier(attackType, enemy);
  return {
    amount: baseDamage * multiplier,
    multiplier,
  };
}

function createCatCooldowns() {
  return Object.fromEntries(Object.keys(catTypes).map((typeId) => [typeId, 0]));
}

const alleyRushWaves = [
  { name: "Wave 1", interval: 2.35, groups: [{ type: "mouse", count: 4 }, { type: "rat", count: 2 }] },
  { name: "Wave 2", interval: 2.15, groups: [{ type: "mouse", count: 6 }, { type: "rat", count: 4 }] },
  { name: "Wave 3", interval: 1.9, groups: [{ type: "mouse", count: 4 }, { type: "foil-ball", count: 4 }, { type: "rat", count: 4 }, { type: "canRat", count: 2 }] },
  { name: "Wave 4", interval: 1.78, groups: [{ type: "mouse", count: 4 }, { type: "cucumber", count: 2 }, { type: "rat", count: 4 }, { type: "pigeon", count: 3 }] },
  { name: "Wave 5", interval: 1.62, groups: [{ type: "cucumber", count: 2 }, { type: "rat", count: 4 }, { type: "canRat", count: 2 }, { type: "roomba", count: 2 }] },
  { name: "Wave 6", interval: 1.52, groups: [{ type: "rat", count: 4 }, { type: "cucumber", count: 2 }, { type: "canRat", count: 3 }, { type: "laserDrone", count: 2 }, { type: "roomba", count: 1 }] },
  { name: "Wave 7", interval: 1.52, groups: [{ type: "mouse", count: 4 }, { type: "rat", count: 5 }, { type: "cucumber", count: 3 }, { type: "foil-ball", count: 3 }] },
  { name: "Wave 8", interval: 1.44, groups: [{ type: "rat", count: 4 }, { type: "spray-bottle", count: 2 }, { type: "roomba", count: 2 }, { type: "canRat", count: 2 }] },
  { name: "Wave 9", interval: 1.36, groups: [{ type: "rat", count: 4 }, { type: "pigeon", count: 3 }, { type: "canRat", count: 3 }, { type: "laserDrone", count: 2 }, { type: "roomba", count: 2 }] },
  { name: "Wave 10", interval: 1.32, groups: [{ type: "rat", count: 4 }, { type: "canRat", count: 3 }, { type: "spray-bottle", count: 2 }, { type: "laserDrone", count: 2 }, { type: "roomba", count: 2 }, { type: "boss", count: 1 }] },
];

const vacuumSiegeWaves = [
  { name: "Wave 1", interval: 2.2, groups: [{ type: "mouse", count: 5 }, { type: "rat", count: 3 }] },
  { name: "Wave 2", interval: 2.02, groups: [{ type: "mouse", count: 4 }, { type: "rat", count: 4 }, { type: "canRat", count: 2 }] },
  { name: "Wave 3", interval: 1.76, groups: [{ type: "mouse", count: 4 }, { type: "foil-ball", count: 5 }, { type: "rat", count: 4 }, { type: "pigeon", count: 4 }] },
  { name: "Wave 4", interval: 1.62, groups: [{ type: "cucumber", count: 2 }, { type: "rat", count: 4 }, { type: "canRat", count: 3 }, { type: "roomba", count: 2 }] },
  { name: "Wave 5", interval: 1.48, groups: [{ type: "mouse", count: 5 }, { type: "cucumber", count: 3 }, { type: "rat", count: 4 }, { type: "laserDrone", count: 2 }, { type: "foil-ball", count: 5 }, { type: "roomba", count: 1 }] },
  { name: "Wave 6", interval: 1.38, groups: [{ type: "cucumber", count: 3 }, { type: "rat", count: 4 }, { type: "spray-bottle", count: 3 }, { type: "canRat", count: 2 }, { type: "robot-mop", count: 1 }] },
  { name: "Wave 7", interval: 1.42, groups: [{ type: "rat", count: 4 }, { type: "canRat", count: 3 }, { type: "robot-mop", count: 1 }, { type: "roomba", count: 2 }] },
  { name: "Wave 8", interval: 1.34, groups: [{ type: "rat", count: 4 }, { type: "hair-dryer", count: 1 }, { type: "pigeon", count: 3 }, { type: "laserDrone", count: 2 }, { type: "spray-bottle", count: 2 }] },
  { name: "Wave 9", interval: 1.28, groups: [{ type: "rat", count: 4 }, { type: "canRat", count: 3 }, { type: "robot-mop", count: 2 }, { type: "laserDrone", count: 2 }, { type: "roomba", count: 2 }, { type: "cucumber", count: 3 }] },
  { name: "Wave 10", interval: 1.24, groups: [{ type: "rat", count: 4 }, { type: "canRat", count: 3 }, { type: "laserDrone", count: 3 }, { type: "roomba", count: 3 }, { type: "spray-bottle", count: 2 }, { type: "boss", count: 1 }] },
];

const expertSiegeWaves = [
  { name: "Wave 1", interval: 2.08, groups: [{ type: "mouse", count: 4 }, { type: "rat", count: 4 }] },
  { name: "Wave 2", interval: 1.92, groups: [{ type: "rat", count: 4 }, { type: "canRat", count: 2 }, { type: "pigeon", count: 3 }] },
  { name: "Wave 3", interval: 1.62, groups: [{ type: "mouse", count: 4 }, { type: "foil-ball", count: 5 }, { type: "rat", count: 4 }, { type: "canRat", count: 2 }, { type: "roomba", count: 2 }] },
  { name: "Wave 4", interval: 1.5, groups: [{ type: "cucumber", count: 4 }, { type: "rat", count: 3 }, { type: "spray-bottle", count: 2 }, { type: "laserDrone", count: 2 }, { type: "foil-ball", count: 5 }] },
  { name: "Wave 5", interval: 1.42, groups: [{ type: "cucumber", count: 3 }, { type: "rat", count: 4 }, { type: "canRat", count: 3 }, { type: "spray-bottle", count: 3 }, { type: "pigeon", count: 3 }, { type: "roomba", count: 1 }] },
  { name: "Wave 6", interval: 1.34, groups: [{ type: "mouse", count: 5 }, { type: "cucumber", count: 3 }, { type: "rat", count: 4 }, { type: "robot-mop", count: 2 }, { type: "roomba", count: 2 }, { type: "foil-ball", count: 5 }] },
  { name: "Wave 7", interval: 1.36, groups: [{ type: "rat", count: 4 }, { type: "hair-dryer", count: 1 }, { type: "roomba", count: 3 }, { type: "cucumber", count: 3 }, { type: "canRat", count: 2 }] },
  { name: "Wave 8", interval: 1.3, groups: [{ type: "rat", count: 4 }, { type: "laserDrone", count: 3 }, { type: "spray-bottle", count: 3 }, { type: "pigeon", count: 3 }, { type: "robot-mop", count: 2 }, { type: "roomba", count: 2 }, { type: "foil-ball", count: 4 }] },
  { name: "Wave 9", interval: 1.24, groups: [{ type: "rat", count: 3 }, { type: "canRat", count: 4 }, { type: "robot-mop", count: 2 }, { type: "hair-dryer", count: 2 }, { type: "laserDrone", count: 2 }, { type: "spray-bottle", count: 2 }, { type: "cucumber", count: 3 }] },
  { name: "Wave 10", interval: 1.18, groups: [{ type: "rat", count: 3 }, { type: "canRat", count: 3 }, { type: "robot-mop", count: 2 }, { type: "hair-dryer", count: 1 }, { type: "laserDrone", count: 3 }, { type: "roomba", count: 2 }, { type: "foil-ball", count: 6 }, { type: "boss", count: 1 }] },
];

const difficultyDefinitions = {
  cozy: {
    id: "cozy",
    name: "Cozy Rooftop",
    label: "Hard",
    description: "Ten waves of rooftop trouble.",
    startingFish: 125,
    lives: 5,
    naturalDropInterval: [4, 5.4],
    waves: alleyRushWaves,
  },
  alley: {
    id: "alley",
    name: "Alley Rush",
    label: "Expert",
    description: "Debuffs and machines stack up.",
    startingFish: 115,
    lives: 5,
    naturalDropInterval: [4.3, 5.8],
    waves: vacuumSiegeWaves,
  },
  siege: {
    id: "siege",
    name: "Vacuum Siege",
    label: "Nightmare",
    description: "Ten waves of household menace.",
    startingFish: 100,
    lives: 5,
    naturalDropInterval: [4.8, 6.4],
    waves: expertSiegeWaves,
  },
};

let board;
let boardShell;
let unitLayer;
let fishDropLayer;
let effectLayer;
let catCards;
let enemyPreview;
let baseZone;
let fishCount;
let placementHint;
let livesCount;
let waveCount;
let waveStatus;
let pauseButton;
let soundToggleButton;
let startSoundToggleButton;
let restartButton;
let startButton;
let startWaveButton;
let resetBestButton;
let startBestRun;
let difficultySelector;
let removeConfirm;
let confirmRemoveButton;
let cancelRemoveButton;
let cellActionMenu;
let cellUpgradeButton;
let cellRemoveButton;
let cellCancelButton;
let pauseOverlay;
let startScreen;
let waveOverlay;
let waveKicker;
let waveTitle;
let waveTip;
let waveEnemies;
let bossWarning;
let modal;
let modalTitle;
let modalMessage;
let modalKicker;
let endStats;

let lastTimestamp = 0;
let idCounter = 0;

const audioState = {
  context: null,
  muted: false,
  lastPlayed: {},
};

const soundCooldowns = {
  hit: 0.09,
  catHurt: 0.15,
  error: 0.15,
  button: 0.06,
  fishCollect: 0.035,
  debuff: 0.55,
  panic: 0.28,
};

const state = {
  gridRows: CONFIG.gridRows,
  gridCols: CONFIG.gridCols,
  cats: [],
  enemies: [],
  projectiles: [],
  fishDrops: [],
  effects: [],
  fish: difficultyDefinitions.cozy.startingFish,
  lives: difficultyDefinitions.cozy.lives,
  selectedDifficulty: "cozy",
  activeDifficulty: "cozy",
  selectedCatType: null,
  pendingRemoveCatId: null,
  pendingRemoveCell: null,
  activeCellMenu: null,
  catCooldowns: createCatCooldowns(),
  waveIndex: 0,
  waveTimer: 0,
  wavePhase: "preview",
  waveActive: false,
  activeWaveSpawnAllowed: false,
  waveIntroActive: false,
  waveIntroTimer: 0,
  waveSpawnList: [],
  waveSpawnCursor: 0,
  currentWaveSpawnComplete: false,
  nextSpawnIn: 0,
  hasStartedFirstWave: false,
  naturalFishDropTimer: 0,
  fishFlashTimer: 0,
  hintTimer: 0,
  hintMessage: "",
  runStats: resetRunStats(difficultyDefinitions.cozy.lives),
  bestRun: null,
  currentScore: 0,
  isNewBest: false,
  baseFlashTimer: 0,
  bossWarningTimer: 0,
  wavePulseTimer: 0,
  isPaused: false,
  gameStatus: "start",
};

function debugWave(message, data = {}) {
  if (!CONFIG.debugWaveFlow) return;
  console.debug("[wave]", message, {
    waveIndex: state.waveIndex,
    wavePhase: state.wavePhase,
    currentWaveSpawnComplete: state.currentWaveSpawnComplete,
    enemies: state.enemies.length,
    waveIntroActive: state.waveIntroActive,
    waveTimer: state.waveTimer,
    waveSpawnCursor: state.waveSpawnCursor,
    waveSpawnTotal: state.waveSpawnList.length,
    nextSpawnIn: state.nextSpawnIn,
    activeWaveSpawnAllowed: state.activeWaveSpawnAllowed,
    gameStatus: state.gameStatus,
    isPaused: state.isPaused,
    ...data,
  });
}

function loadMutedPreference() {
  try {
    audioState.muted = window.localStorage.getItem(CONFIG.mutedStorageKey) === "true";
  } catch (_error) {
    audioState.muted = false;
  }
}

function saveMutedPreference() {
  try {
    window.localStorage.setItem(CONFIG.mutedStorageKey, String(audioState.muted));
  } catch (_error) {
    // Sound preference is optional; ignore storage failures.
  }
}

function isAudioAvailable() {
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

function initAudio() {
  if (audioState.context || !isAudioAvailable()) return audioState.context;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioState.context = new AudioContextClass();
  } catch (_error) {
    audioState.context = null;
  }
  return audioState.context;
}

function maybeUnlockAudio() {
  if (audioState.muted) return null;
  const audioContext = initAudio();
  if (!audioContext) return null;
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function setMuted(value) {
  audioState.muted = Boolean(value);
  saveMutedPreference();
  renderSoundToggle();
  if (!audioState.muted) maybeUnlockAudio();
}

function toggleMuted() {
  setMuted(!audioState.muted);
  if (!audioState.muted) playSound("button");
}

function renderSoundToggle() {
  [soundToggleButton, startSoundToggleButton].forEach((button) => {
    if (!button) return;
    button.textContent = audioState.muted ? "Sound: Off" : "Sound: On";
    button.setAttribute("aria-label", audioState.muted ? "Sound off" : "Sound on");
    button.classList.toggle("is-muted", audioState.muted);
  });
}

function canPlaySound(name, audioContext) {
  const cooldown = soundCooldowns[name] ?? 0;
  const lastPlayed = audioState.lastPlayed[name] ?? -Infinity;
  if (audioContext.currentTime - lastPlayed < cooldown) return false;
  audioState.lastPlayed[name] = audioContext.currentTime;
  return true;
}

function playTone({ frequency, duration = 0.12, type = "square", gain = 0.05, attack = 0.006, release = 0.05, start = 0, detune = 0 }) {
  const audioContext = maybeUnlockAudio();
  if (!audioContext) return;
  const startTime = audioContext.currentTime + start;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.detune.setValueAtTime(detune, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + release);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + release + 0.02);
}

function playNoise({ duration = 0.08, gain = 0.025, filterFrequency = 800, start = 0 }) {
  const audioContext = maybeUnlockAudio();
  if (!audioContext) return;
  const startTime = audioContext.currentTime + start;
  const buffer = audioContext.createBuffer(1, Math.max(1, Math.floor(audioContext.sampleRate * duration)), audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gainNode = audioContext.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFrequency, startTime);
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(startTime);
}

function playArpeggio(frequencies, options = {}) {
  const step = options.step ?? 0.065;
  frequencies.forEach((frequency, index) => {
    playTone({
      frequency,
      duration: options.duration ?? 0.1,
      type: options.type ?? "triangle",
      gain: options.gain ?? 0.04,
      attack: options.attack ?? 0.006,
      release: options.release ?? 0.06,
      start: (options.start ?? 0) + index * step,
    });
  });
}

function playSound(name) {
  if (audioState.muted) return;
  const audioContext = maybeUnlockAudio();
  if (!audioContext || !canPlaySound(name, audioContext)) return;

  switch (name) {
    case "fishCollect":
      playTone({ frequency: 760, duration: 0.055, type: "triangle", gain: 0.035, release: 0.04 });
      playTone({ frequency: 1120, duration: 0.04, type: "sine", gain: 0.025, start: 0.035, release: 0.04 });
      break;
    case "cardSelect":
    case "button":
      playTone({ frequency: 380, duration: 0.035, type: "square", gain: 0.024, release: 0.03 });
      break;
    case "catPlaced":
      playTone({ frequency: 520, duration: 0.08, type: "triangle", gain: 0.04, release: 0.06 });
      playTone({ frequency: 690, duration: 0.08, type: "triangle", gain: 0.026, start: 0.055, release: 0.05 });
      break;
    case "error":
      playTone({ frequency: 118, duration: 0.11, type: "sawtooth", gain: 0.04, release: 0.05 });
      break;
    case "hit":
      playNoise({ duration: 0.045, gain: 0.018, filterFrequency: 1100 });
      playTone({ frequency: 170, duration: 0.035, type: "triangle", gain: 0.018, release: 0.025 });
      break;
    case "enemyDefeated":
      playNoise({ duration: 0.08, gain: 0.026, filterFrequency: 1600 });
      playTone({ frequency: 420, duration: 0.07, type: "triangle", gain: 0.025, start: 0.02 });
      break;
    case "catHurt":
      playTone({ frequency: 230, duration: 0.08, type: "sawtooth", gain: 0.032, release: 0.045 });
      break;
    case "debuff":
      playNoise({ duration: 0.09, gain: 0.018, filterFrequency: 520 });
      playTone({ frequency: 145, duration: 0.08, type: "triangle", gain: 0.02, release: 0.04 });
      break;
    case "panic":
      playTone({ frequency: 190, duration: 0.045, type: "square", gain: 0.025, release: 0.025 });
      playTone({ frequency: 155, duration: 0.055, type: "sawtooth", gain: 0.018, start: 0.04, release: 0.035 });
      break;
    case "removeRefund":
      playTone({ frequency: 420, duration: 0.055, type: "triangle", gain: 0.028, release: 0.04 });
      playTone({ frequency: 780, duration: 0.07, type: "sine", gain: 0.035, start: 0.055, release: 0.05 });
      break;
    case "upgrade":
      playArpeggio([620, 820, 1100, 1480], { gain: 0.035, duration: 0.075, step: 0.055 });
      break;
    case "waveStart":
      playArpeggio([220, 330, 440, 660], { gain: 0.04, duration: 0.09, step: 0.055, type: "sawtooth" });
      break;
    case "bossWarning":
      playTone({ frequency: 92, duration: 0.16, type: "sawtooth", gain: 0.055, release: 0.08 });
      playTone({ frequency: 72, duration: 0.16, type: "sawtooth", gain: 0.04, start: 0.18, release: 0.08 });
      break;
    case "victory":
      playArpeggio([392, 523, 659, 784, 1046], { gain: 0.045, duration: 0.11, step: 0.075 });
      break;
    case "gameover":
      playArpeggio([392, 330, 262, 196], { gain: 0.045, duration: 0.13, step: 0.085, type: "sawtooth" });
      break;
    default:
      break;
  }
}

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function init() {
  document.querySelector(".game-shell").classList.toggle("uses-image-asset", CONFIG.useImageAssets);
  board = document.getElementById("board");
  boardShell = document.querySelector(".board-shell");
  unitLayer = document.getElementById("unitLayer");
  fishDropLayer = document.getElementById("fishDropLayer");
  effectLayer = document.getElementById("effectLayer");
  catCards = document.getElementById("catCards");
  enemyPreview = document.getElementById("enemyPreview");
  baseZone = document.getElementById("baseZone");
  fishCount = document.getElementById("fishCount");
  placementHint = document.getElementById("placementHint");
  livesCount = document.getElementById("livesCount");
  waveCount = document.getElementById("waveCount");
  waveStatus = document.getElementById("waveStatus");
  pauseButton = document.getElementById("pauseButton");
  soundToggleButton = document.getElementById("soundToggleButton");
  startSoundToggleButton = document.getElementById("startSoundToggleButton");
  restartButton = document.getElementById("restartButton");
  startButton = document.getElementById("startButton");
  startWaveButton = document.getElementById("startWaveButton");
  resetBestButton = document.getElementById("resetBestButton");
  startBestRun = document.getElementById("startBestRun");
  difficultySelector = document.getElementById("difficultySelector");
  removeConfirm = document.getElementById("removeConfirm");
  confirmRemoveButton = document.getElementById("confirmRemoveButton");
  cancelRemoveButton = document.getElementById("cancelRemoveButton");
  cellActionMenu = document.getElementById("cellActionMenu");
  cellUpgradeButton = document.getElementById("cellUpgradeButton");
  cellRemoveButton = document.getElementById("cellRemoveButton");
  cellCancelButton = document.getElementById("cellCancelButton");
  pauseOverlay = document.getElementById("pauseOverlay");
  startScreen = document.getElementById("startScreen");
  waveOverlay = document.getElementById("waveOverlay");
  waveKicker = document.getElementById("waveKicker");
  waveTitle = document.getElementById("waveTitle");
  waveTip = document.getElementById("waveTip");
  waveEnemies = document.getElementById("waveEnemies");
  bossWarning = document.getElementById("bossWarning");
  modal = document.getElementById("gameModal");
  modalTitle = document.getElementById("modalTitle");
  modalMessage = document.getElementById("modalMessage");
  modalKicker = document.getElementById("modalKicker");
  endStats = document.getElementById("endStats");
  state.bestRun = loadBestRun(state.selectedDifficulty);
  document.getElementById("startTagline").textContent = UI_TEXT.startTagline;
  document.getElementById("ruleList").innerHTML = UI_TEXT.rules.map((rule) => `<li>${rule}</li>`).join("");
  loadMutedPreference();
  renderSoundToggle();

  createGrid();
  createCatCards();
  createDifficultyCards();
  // Fish are collected by hover, then removed immediately so tile clicks still feel natural.
  fishDropLayer.addEventListener("pointerover", (event) => {
    const drop = event.target.closest(".fish-drop");
    if (drop) collectFishDrop(drop.dataset.id);
  });

  pauseButton.addEventListener("click", () => {
    maybeUnlockAudio();
    playSound("button");
    if (state.isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  });
  soundToggleButton.addEventListener("click", () => {
    maybeUnlockAudio();
    toggleMuted();
  });
  startSoundToggleButton.addEventListener("click", () => {
    maybeUnlockAudio();
    toggleMuted();
  });
  startButton.addEventListener("click", () => {
    maybeUnlockAudio();
    playSound("button");
    startGame();
  });
  startWaveButton.addEventListener("click", startWave);
  restartButton.addEventListener("click", () => {
    maybeUnlockAudio();
    playSound("button");
    restartGame();
  });
  resetBestButton.addEventListener("click", () => {
    maybeUnlockAudio();
    playSound("button");
    resetBestRun();
  });
  confirmRemoveButton.addEventListener("click", confirmRemoveCat);
  cancelRemoveButton.addEventListener("click", cancelRemoveCat);
  cellUpgradeButton.addEventListener("click", handleCellMenuUpgrade);
  cellRemoveButton.addEventListener("click", handleCellMenuRemove);
  cellCancelButton.addEventListener("click", handleCellMenuCancel);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      handleEscapeKey();
    }
  });
  window.addEventListener("resize", render);

  render();
  requestAnimationFrame(gameLoop);
}

function createGrid() {
  board.innerHTML = "";
  for (let row = 0; row < CONFIG.gridRows; row += 1) {
    for (let col = 0; col < CONFIG.gridCols; col += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}`);
      cell.addEventListener("click", () => handleCellClick(row, col));
      board.appendChild(cell);
    }
  }
}

function createCatCards() {
  catCards.innerHTML = "";
  Object.values(catTypes).forEach((type) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "cat-card";
    card.dataset.type = type.id;
    card.title = type.description;
    card.innerHTML = `
      <div class="card-top">
        <span class="mini-sprite mini-${type.id}"></span>
        <span>
          <span class="card-name">${type.name}</span>
          <span class="card-cost">${type.price} fish</span>
        </span>
      </div>
      <p class="card-role">${type.role}</p>
      <p class="card-desc">${type.description}</p>
      <div class="card-cooldown hidden" aria-hidden="true">
        <div class="card-cooldown-fill"></div>
        <span class="card-cooldown-time"></span>
      </div>
    `;
    card.addEventListener("click", () => selectCat(type.id));
    catCards.appendChild(card);
  });
}

function createDifficultyCards() {
  if (!difficultySelector) return;
  difficultySelector.innerHTML = Object.values(difficultyDefinitions).map((difficulty) => `
    <button class="difficulty-card" type="button" data-difficulty="${difficulty.id}">
      <span class="difficulty-label">${difficulty.label}</span>
      <strong>${difficulty.name}</strong>
      <span>${difficulty.description}</span>
    </button>
  `).join("");

  difficultySelector.querySelectorAll(".difficulty-card").forEach((card) => {
    card.addEventListener("click", () => selectDifficulty(card.dataset.difficulty));
  });
}

function selectDifficulty(difficultyId) {
  if (!difficultyDefinitions[difficultyId] || state.gameStatus !== "start") return;
  const difficulty = getDifficulty(difficultyId);
  state.selectedDifficulty = difficultyId;
  state.activeDifficulty = difficultyId;
  state.bestRun = loadBestRun(difficultyId);
  state.fish = difficulty.startingFish;
  state.lives = difficulty.lives;
  state.runStats = resetRunStats(difficulty.lives);
  state.waveIndex = 0;
  state.currentScore = 0;
  state.isNewBest = false;
  render();
}

function getDifficulty(difficultyId = state.activeDifficulty) {
  return difficultyDefinitions[difficultyId] ?? difficultyDefinitions.cozy;
}

function getSelectedDifficulty() {
  return getDifficulty(state.selectedDifficulty);
}

function getActiveWaves() {
  return getDifficulty().waves;
}

function render() {
  const dims = getBoardMetrics();
  const activeDifficulty = getDifficulty();
  const activeWaves = getActiveWaves();

  reconcileSelectedCat();
  reconcileRemoveState();
  reconcileCellActionMenu();
  fishCount.textContent = Math.floor(state.fish).toString();
  placementHint.textContent = getPlacementHintText();
  placementHint.classList.toggle("is-active", Boolean(state.selectedCatType) || Boolean(state.activeCellMenu) || Boolean(state.pendingRemoveCatId));
  placementHint.classList.toggle("is-feedback", state.hintTimer > 0);
  livesCount.textContent = state.lives.toString();
  waveCount.textContent = `${activeDifficulty.name} · Wave ${Math.min(state.waveIndex + 1, activeWaves.length)} / ${activeWaves.length}`;
  waveStatus.textContent = getWaveStatusText();
  pauseButton.textContent = state.isPaused ? "Resume" : "Pause";
  pauseButton.disabled = state.gameStatus !== "playing";
  pauseButton.classList.toggle("is-paused", state.isPaused);
  renderSoundToggle();
  pauseOverlay.classList.toggle("hidden", !state.isPaused);
  startScreen.classList.toggle("hidden", state.gameStatus !== "start");
  renderDifficultyCards();
  renderStartBestRun();
  waveOverlay.classList.toggle("hidden", !state.waveIntroActive || state.gameStatus !== "playing");
  startWaveButton.disabled = !canStartWave();
  bossWarning.classList.toggle("hidden", state.bossWarningTimer <= 0);
  fishCount.parentElement.classList.toggle("is-flashing", state.fishFlashTimer > 0);
  livesCount.parentElement.classList.toggle("is-damaged", state.baseFlashTimer > 0);
  baseZone.classList.toggle("is-hit", state.baseFlashTimer > 0);
  boardShell.classList.toggle("is-active-wave", state.gameStatus === "playing" && state.wavePhase === "active");
  boardShell.classList.toggle("is-preview", state.gameStatus === "playing" && state.wavePhase === "preview");
  boardShell.classList.toggle("wave-start-pulse", state.wavePulseTimer > 0);
  boardShell.classList.toggle("board-warning-pulse", state.bossWarningTimer > 0);

  renderWaveOverlay();
  renderEnemyPreview();

  document.querySelectorAll(".cell").forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const hasCat = Boolean(getCatAt(row, col));
    const isPendingRemove = state.pendingRemoveCell?.row === row && state.pendingRemoveCell?.col === col;
    const isActionMenuTarget = state.activeCellMenu?.row === row && state.activeCellMenu?.col === col;
    cell.classList.toggle("occupied", hasCat);
    cell.classList.toggle("pending-remove", isPendingRemove);
    cell.classList.toggle("action-menu-target", isActionMenuTarget);
  });

  document.querySelectorAll(".cat-card").forEach((card) => {
    const type = catTypes[card.dataset.type];
    if (type) renderCatCardState(card, type);
  });

  unitLayer.innerHTML = [
    ...state.cats.map((cat) => renderCat(cat, dims)),
    ...state.enemies.map((enemy) => renderEnemy(enemy, dims)),
    ...state.projectiles.map((projectile) => renderProjectile(projectile)),
  ].join("");

  fishDropLayer.innerHTML = renderFishDrops();
  effectLayer.innerHTML = state.effects.map(renderEffect).join("");
  renderCellActionMenu(dims);
  renderRemoveConfirm(dims);
}

function renderCat(cat, dims) {
  const type = catTypes[cat.type];
  const stats = getCatStats(cat);
  const pos = cellCenter(cat.row, cat.col, dims);
  const hpPercent = Math.max(0, Math.min(100, (cat.hp / cat.maxHp) * 100));
  const effectiveCooldown = getEffectiveCooldown(cat);
  const cooldownPercent = stats.attackKind === "none"
    ? 0
    : Math.max(0, Math.min(100, (cat.attackTimer / effectiveCooldown) * 100));
  const producerClass = stats.attackKind === "producer" ? "producer-timer" : "";
  const attackingClass = cat.attackFlash > 0 ? "is-attacking" : "";
  const hitClass = cat.hitFlash > 0 ? "is-hit" : "";
  const debuffedClass = cat.debuffFactor > 1 ? "is-debuffed" : "";
  const panickedClass = isCatPanicked(cat, dims) ? "cat-panicked" : "";
  const upgradedClass = cat.level === 2 ? "cat-upgraded" : "";
  const cooldown = stats.attackKind === "none"
    ? ""
    : `<div class="cooldown ${producerClass}"><div class="cooldown-fill" style="height:${cooldownPercent}%"></div></div>`;

  return `
    <div class="unit cat cat-sprite ${type.className} ${attackingClass} ${hitClass} ${debuffedClass} ${panickedClass} ${upgradedClass}" style="left:${pos.x}px; top:${pos.y}px">
      <div class="hp-bar"><div class="hp-fill" style="width:${hpPercent}%"></div></div>
      ${renderCatLevelBadge(cat)}
      <div class="cat-tail"></div>
      <div class="cat-body"><span class="cat-face"></span></div>
      ${cooldown}
    </div>
  `;
}

function renderCatLevelBadge(cat) {
  return cat.level === 2 ? `<span class="cat-level-badge">Lv.2</span>` : "";
}

function renderEnemy(enemy, dims) {
  const type = getEnemyDefinition(enemy.type);
  const y = rowCenter(enemy.row, dims);
  const maxHp = enemy.maxHp || type.hp || 1;
  const hpPercent = Math.max(0, Math.min(100, (enemy.hp / maxHp) * 100));
  const hitClass = enemy.hitFlash > 0 ? "is-hit" : "";
  const slowClass = enemy.slowTimer > 0 ? "is-slowed" : "";

  return `
    <div class="unit enemy enemy-sprite ${type.className} ${hitClass} ${slowClass}" style="left:${enemy.x}px; top:${y}px">
      <div class="hp-bar"><div class="hp-fill" style="width:${hpPercent}%"></div></div>
      <div class="enemy-body"></div>
    </div>
  `;
}

function renderProjectile(projectile) {
  return `<div class="projectile projectile-sprite projectile-${projectile.kind} projectile-trail" style="left:${projectile.x}px; top:${projectile.y}px"></div>`;
}

function renderFishDrops() {
  return state.fishDrops.map((drop) => {
    const lifeRatio = Math.max(0, Math.min(1, drop.lifetime / drop.maxLifetime));
    const fadingClass = lifeRatio < 0.28 ? "is-fading" : "";
    const expiringClass = drop.lifetime < 1.5 ? "is-expiring" : "";
    return `
      <button
        class="fish-drop fish-drop-${drop.source} ${fadingClass} ${expiringClass}"
        data-id="${drop.id}"
        type="button"
        tabindex="-1"
        aria-label="Collect ${drop.value} fish"
        title="+${drop.value} fish"
        style="left:${drop.x}px; top:${drop.y}px"
      >
        <span class="fish-pop">+${drop.value}</span>
      </button>
    `;
  }).join("");
}

function renderCatCardState(card, type) {
  const cooldown = getCatCooldown(type.id);
  const isCoolingDown = cooldown > 0;
  const isTooExpensive = state.fish < type.price;
  const selected = state.selectedCatType === type.id;
  const cooldownFill = card.querySelector(".card-cooldown-fill");
  const cooldownTime = card.querySelector(".card-cooldown-time");
  const cooldownOverlay = card.querySelector(".card-cooldown");
  const remainingPercent = getCooldownRemainingPercent(type, cooldown);

  card.classList.toggle("selected", selected);
  card.classList.toggle("too-expensive", isTooExpensive && !isCoolingDown);
  card.classList.toggle("low-fish", isTooExpensive && isCoolingDown);
  card.classList.toggle("on-cooldown", isCoolingDown);
  card.classList.toggle("is-disabled", !canUseBoardActions() || isTooExpensive || isCoolingDown);
  card.setAttribute("aria-pressed", String(selected));
  card.setAttribute("aria-disabled", String(!canSelectCat(type.id)));

  if (cooldownOverlay) cooldownOverlay.classList.toggle("hidden", !isCoolingDown);
  if (cooldownFill) cooldownFill.style.height = `${remainingPercent}%`;
  if (cooldownTime) cooldownTime.textContent = isCoolingDown ? formatCooldownTime(cooldown) : "";
}

function renderEffect(effect) {
  return `<div class="float-text ${effect.kind}" style="left:${effect.x}px; top:${effect.y}px">${effect.text}</div>`;
}

function renderCellActionMenu(dims) {
  const cat = getActiveCellMenuCat();
  if (!cat) {
    cellActionMenu.classList.add("hidden");
    return;
  }

  const type = catTypes[cat.type];
  const upgradeCost = getUpgradeCost(cat);
  const canUpgrade = canUpgradeCat(cat);
  const isMaxLevel = cat.level === 2;
  cellActionMenu.classList.remove("hidden");
  cellActionMenu.style.visibility = "hidden";
  cellActionMenu.style.left = "0px";
  cellActionMenu.style.top = "0px";

  const title = cellActionMenu.querySelector(".cell-action-menu-title");
  const upgradeButton = cellActionMenu.querySelector(".upgrade");
  if (title) title.textContent = `${type.name} · Lv.${cat.level}`;
  if (upgradeButton) {
    upgradeButton.textContent = isMaxLevel ? "Max level" : `Upgrade: ${upgradeCost} fish`;
    upgradeButton.classList.toggle("disabled", !canUpgrade);
    upgradeButton.setAttribute("aria-disabled", String(!canUpgrade));
    upgradeButton.title = isMaxLevel ? "Max level" : `Upgrade for ${upgradeCost} fish`;
  }

  const position = getClampedPanelPosition(cat, dims, cellActionMenu);
  cellActionMenu.style.left = `${position.left}px`;
  cellActionMenu.style.top = `${position.top}px`;
  cellActionMenu.style.visibility = "visible";
  cellActionMenu.dataset.placement = position.placement;
}

function renderRemoveConfirm(dims) {
  const cat = getPendingRemoveCat();
  if (!cat) {
    removeConfirm.classList.add("hidden");
    return;
  }

  removeConfirm.classList.remove("hidden");
  removeConfirm.style.visibility = "hidden";
  removeConfirm.style.left = "0px";
  removeConfirm.style.top = "0px";

  const label = removeConfirm.querySelector("span");
  if (label) label.textContent = `Remove ${catTypes[cat.type].name}? Refund: ${getRemoveRefund(cat)} fish`;

  const position = getClampedPanelPosition(cat, dims, removeConfirm);
  removeConfirm.style.left = `${position.left}px`;
  removeConfirm.style.top = `${position.top}px`;
  removeConfirm.style.visibility = "visible";
  removeConfirm.dataset.placement = position.placement;
}

function getClampedPanelPosition(cat, dims, panel) {
  const pos = cellCenter(cat.row, cat.col, dims);
  const panelWidth = panel.offsetWidth || 190;
  const panelHeight = panel.offsetHeight || 76;
  const margin = 8;
  const gap = 10;
  const minLeft = margin;
  const maxLeft = Math.max(minLeft, dims.width - panelWidth - margin);
  const minTop = margin;
  const maxTop = Math.max(minTop, dims.height - panelHeight - margin);

  let left = pos.x - panelWidth / 2;
  let top = pos.y - dims.cellHeight * 0.58 - panelHeight - gap;
  let placement = "top";

  if (top < minTop) {
    top = pos.y + dims.cellHeight * 0.42 + gap;
    placement = "bottom";
  }

  if (top > maxTop) {
    top = pos.y - panelHeight / 2;
    placement = "side";
  }

  left = clamp(left, minLeft, maxLeft);
  top = clamp(top, minTop, maxTop);

  return { left, top, placement };
}

function renderDifficultyCards() {
  if (!difficultySelector) return;
  difficultySelector.querySelectorAll(".difficulty-card").forEach((card) => {
    const isSelected = card.dataset.difficulty === state.selectedDifficulty;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });
}

function renderWaveOverlay() {
  const waves = getActiveWaves();
  if (!state.waveIntroActive || state.waveIndex >= waves.length) return;
  debugWave("renderWaveOverlay");
  const wave = waves[state.waveIndex];
  waveKicker.textContent = `${getDifficulty().name} · Wave ${state.waveIndex + 1}/${waves.length}`;
  waveTitle.textContent = UI_TEXT.waveMessages[state.waveIndex] ?? wave.name;
  waveTip.textContent = UI_TEXT.waveTips[state.waveIndex] ?? "";
  waveEnemies.innerHTML = renderEnemyChips(wave.groups);
  startWaveButton.textContent = "Start wave";
}

function renderEnemyPreview() {
  const waves = getActiveWaves();
  const wave = waves[Math.min(state.waveIndex, waves.length - 1)];
  if (!wave || state.gameStatus === "victory") {
    enemyPreview.innerHTML = `<span class="preview-label">Wave preview</span><span class="preview-empty">Roof clear</span>`;
    return;
  }

  enemyPreview.innerHTML = `
    <span class="preview-label">Incoming</span>
    <span class="preview-wave">${getDifficulty().name} · Wave ${Math.min(state.waveIndex + 1, waves.length)}/${waves.length}</span>
    <span class="preview-icons">${renderEnemyChips(wave.groups)}</span>
  `;
}

function renderEnemyChips(groups) {
  return groups.map((group) => {
    const enemy = getEnemyDefinition(group.type);
    return `
      <span class="enemy-chip" title="${enemy.name}">
        <span class="enemy-icon ${enemy.className}"><span class="enemy-body"></span></span>
        <span class="enemy-count">x${group.count}</span>
      </span>
    `;
  }).join("");
}

function renderStartBestRun() {
  if (!startBestRun || !resetBestButton) return;
  const difficulty = getSelectedDifficulty();
  const best = loadBestRun(difficulty.id);
  state.bestRun = best;
  resetBestButton.classList.toggle("hidden", !best);
  resetBestButton.textContent = "Reset best for this mode";

  if (!best) {
    startBestRun.innerHTML = `
      <p class="best-title">Best run · ${difficulty.name}</p>
      <div class="best-empty">No local record yet</div>
    `;
    return;
  }

  startBestRun.innerHTML = `
    <p class="best-title">Best run · ${difficulty.name}</p>
    <div class="best-chips">
      <span><strong>${formatScore(best.bestScore)}</strong><small>Score</small></span>
      <span><strong>${best.bestResult}</strong><small>Result</small></span>
      <span><strong>${best.bestWavesCleared}/${difficulty.waves.length}</strong><small>Waves</small></span>
      <span><strong>${formatRunTime(best.bestRunTimeSeconds)}</strong><small>Time</small></span>
    </div>
  `;
}

function gameLoop(timestamp) {
  const rawDelta = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
  const delta = Math.min(rawDelta, 0.05);
  lastTimestamp = timestamp;

  if (!state.isPaused && state.gameStatus === "playing") {
    updateFeedbackTimers(delta);
    updateRunTime(delta);
    updateCatCooldowns(delta);
    updateFishDrops(delta);
    updateWaves(delta);
    updateEnemies(delta);
    updateCats(delta);
    updateProjectiles(delta);
    updateEffects(delta);
    checkWinLose();
  }

  render();
  requestAnimationFrame(gameLoop);
}

// Active waves spawn enemies first, then wait for the field to be cleared.
function updateWaves(delta) {
  if (state.gameStatus !== "playing") return;
  if (state.isPaused) return;
  if (state.wavePhase !== "active") return;
  if (state.waveIntroActive) return;

  const waves = getActiveWaves();
  const wave = waves[state.waveIndex];
  if (!wave) return;
  if (!state.waveActive) {
    debugWave("updateWaves blocked", { reason: "wave inactive" });
    return;
  }

  if (state.currentWaveSpawnComplete) {
    if (state.enemies.length === 0) {
      debugWave("updateWaves completing cleared wave");
      completeCurrentWave();
    }
    return;
  }

  if (!state.activeWaveSpawnAllowed) {
    debugWave("updateWaves blocked", { reason: "spawn disabled" });
    return;
  }

  state.nextSpawnIn -= delta;
  if (state.nextSpawnIn <= 0 && state.waveSpawnCursor < state.waveSpawnList.length) {
    const spawn = state.waveSpawnList[state.waveSpawnCursor];
    debugWave("updateWaves spawn due", { enemyType: spawn.type });
    if (spawnEnemy(spawn.type, randomRow())) {
      state.waveSpawnCursor += 1;
      state.nextSpawnIn = spawn.interval ?? wave.interval;
    }
  }

  if (state.waveSpawnCursor >= state.waveSpawnList.length) {
    state.currentWaveSpawnComplete = true;
    state.activeWaveSpawnAllowed = false;
    debugWave("updateWaves spawn schedule complete");
    if (state.enemies.length === 0) completeCurrentWave();
  }
}

function spawnEnemy(typeId, row) {
  if (state.gameStatus !== "playing") {
    debugWave("spawnEnemy blocked", { enemyType: typeId, reason: "not playing" });
    return false;
  }
  if (state.isPaused) {
    debugWave("spawnEnemy blocked", { enemyType: typeId, reason: "paused" });
    return false;
  }
  if (state.wavePhase !== "active") {
    debugWave("spawnEnemy blocked", { enemyType: typeId, reason: "not active phase" });
    return false;
  }
  if (state.waveIntroActive) {
    debugWave("spawnEnemy blocked", { enemyType: typeId, reason: "intro active" });
    return false;
  }
  if (!state.activeWaveSpawnAllowed) {
    debugWave("spawnEnemy blocked", { enemyType: typeId, reason: "spawn disabled" });
    return false;
  }

  const type = enemyTypes[typeId];
  if (!type) {
    debugWave("spawnEnemy blocked", { enemyType: typeId, reason: "unknown enemy type" });
    return false;
  }
  const dims = getBoardMetrics();
  debugWave("spawnEnemy", { enemyType: typeId, row });
  state.enemies.push({
    id: nextId("enemy"),
    type: typeId,
    row,
    x: dims.width + CONFIG.enemyEntranceOffset,
    hp: type.hp,
    maxHp: type.hp,
    speed: type.speed,
    attackTimer: 0,
    slowTimer: 0,
    slowFactor: 1,
    hitFlash: 0,
    debuffEffectTimer: 0,
    dead: false,
  });

  if (typeId === "boss") {
    playSound("bossWarning");
    state.bossWarningTimer = CONFIG.bossWarningSeconds;
    state.wavePulseTimer = CONFIG.bossWarningSeconds;
  }

  return true;
}

function updateFeedbackTimers(delta) {
  state.fishFlashTimer = Math.max(0, state.fishFlashTimer - delta);
  state.hintTimer = Math.max(0, state.hintTimer - delta);
  state.baseFlashTimer = Math.max(0, state.baseFlashTimer - delta);
  state.bossWarningTimer = Math.max(0, state.bossWarningTimer - delta);
  state.wavePulseTimer = Math.max(0, state.wavePulseTimer - delta);
}

function updateRunTime(delta) {
  state.runStats.runTimeSeconds += delta;
}

function updateCatCooldowns(delta) {
  Object.keys(state.catCooldowns).forEach((typeId) => {
    const nextCooldown = state.catCooldowns[typeId] - delta;
    state.catCooldowns[typeId] = nextCooldown <= 0.05 ? 0 : nextCooldown;
  });
}

function updateFishDrops(delta) {
  state.fishDrops.forEach((drop) => {
    drop.lifetime -= delta;
  });
  state.fishDrops = state.fishDrops.filter((drop) => drop.lifetime > 0);

  if (!canSpawnFishDrops()) return;

  state.naturalFishDropTimer -= delta;
  if (state.naturalFishDropTimer <= 0) {
    spawnFishDrop("natural");
    const [minDropDelay, maxDropDelay] = getDifficulty().naturalDropInterval;
    state.naturalFishDropTimer = randomRange(minDropDelay, maxDropDelay);
  }
}

function canSpawnFishDrops() {
  return (
    state.gameStatus === "playing" &&
    !state.isPaused &&
    state.wavePhase === "active" &&
    state.hasStartedFirstWave
  );
}

function spawnFishDrop(source, row, col, value) {
  // Drops live in board coordinates only, clamped inside the grid.
  const dims = getBoardMetrics();
  const dropValue = value ?? (source === "fishcat" ? CONFIG.fishCatDropValue : CONFIG.naturalFishValue);
  let x;
  let y;

  if (Number.isInteger(row) && Number.isInteger(col)) {
    const pos = cellCenter(row, col, dims);
    x = pos.x + randomRange(-0.32, 0.32) * dims.cellWidth;
    y = pos.y + randomRange(-0.24, 0.24) * dims.cellHeight;
  } else {
    x = randomRange(0.8, CONFIG.gridCols - 1.4) * dims.cellWidth;
    y = randomRange(0.45, CONFIG.gridRows - 0.45) * dims.cellHeight;
  }

  state.fishDrops.push({
    id: nextId("fish"),
    row: Number.isInteger(row) ? row : null,
    col: Number.isInteger(col) ? col : null,
    x: clamp(x, dims.cellWidth * 0.35, dims.width - dims.cellWidth * 0.7),
    y: clamp(y, dims.cellHeight * 0.24, dims.height - dims.cellHeight * 0.24),
    value: dropValue,
    lifetime: CONFIG.fishDropLifetime,
    maxLifetime: CONFIG.fishDropLifetime,
    source,
  });
}

function collectFishDrop(id) {
  const drop = state.fishDrops.find((candidate) => candidate.id === id);
  if (!drop || state.gameStatus !== "playing") return;

  playSound("fishCollect");
  state.fish += drop.value;
  state.runStats.fishCollected += drop.value;
  state.runStats.fishDropsCollected += 1;
  triggerFishFlash();
  addEffect("fish", `+${drop.value}`, drop.x, drop.y - 12);
  addEffect("collect-pop", "POP", drop.x, drop.y);
  state.fishDrops = state.fishDrops.filter((candidate) => candidate.id !== id);
  render();
}

// Enemies either move left or stop to chew through the first cat they reach.
function updateEnemies(delta) {
  const dims = getBoardMetrics();

  state.cats.forEach((cat) => {
    cat.debuffFactor = 1;
  });

  state.enemies.forEach((enemy) => {
    const type = getEnemyDefinition(enemy.type);
    if (enemy.hitFlash > 0) enemy.hitFlash -= delta;
    if (enemy.debuffEffectTimer > 0) enemy.debuffEffectTimer -= delta;
    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= delta;
      if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
    }

    if (type.debuffRadiusCells) {
      applyAttackDebuff(enemy, dims);
    }

    const blockingCat = findBlockingCat(enemy, dims);
    if (blockingCat) {
      enemy.attackTimer += delta;
      if (enemy.attackTimer >= type.attackCooldown) {
        enemy.attackTimer = 0;
        damageCat(blockingCat, type.damage);
      }
      return;
    }

    enemy.x -= type.speed * enemy.slowFactor * delta;
  });

  state.enemies = state.enemies.filter((enemy) => {
    if (enemy.hp <= 0) return false;
    if (enemy.x < dims.cellWidth * CONFIG.baseColumnBuffer) {
      state.lives -= 1;
      state.baseFlashTimer = CONFIG.feedbackFlashSeconds;
      playSound("catHurt");
      addEffect("warn", "-1 life", Math.max(18, enemy.x + 20), rowCenter(enemy.row, dims));
      return false;
    }
    return true;
  });
}

// Cats update their own cooldowns and choose targets only on their current lane.
function updateCats(delta) {
  const dims = getBoardMetrics();

  state.cats.forEach((cat) => {
    const stats = getCatStats(cat);
    if (cat.attackFlash > 0) cat.attackFlash -= delta;
    if (cat.hitFlash > 0) cat.hitFlash -= delta;

    if (stats.attackKind === "none") return;

    if (stats.attackKind === "producer") {
      if (!canSpawnFishDrops()) return;

      const effectiveCooldown = getEffectiveCooldown(cat);
      cat.attackTimer = Math.min(effectiveCooldown, cat.attackTimer + delta);
      if (cat.attackTimer >= effectiveCooldown) {
        cat.attackTimer = 0;
        spawnFishDrop("fishcat", cat.row, cat.col, stats.produceAmount);
      }
      return;
    }

    const effectiveCooldown = getEffectiveCooldown(cat);
    cat.attackTimer = Math.min(effectiveCooldown, cat.attackTimer + delta);

    if (cat.attackTimer < effectiveCooldown) return;

    if (stats.attackKind === "projectile") {
      const target = findRangedTarget(cat, dims);
      if (!target) return;
      if (shouldCatMiss(cat, dims)) {
        showMiss(cat, dims);
        cat.attackTimer = 0;
        cat.attackFlash = 0.12;
        return;
      }
      fireProjectile(cat, target, dims);
      cat.attackTimer = 0;
      cat.attackFlash = 0.2;
      return;
    }

    if (stats.attackKind === "melee") {
      const target = findMeleeTarget(cat, dims);
      if (!target) return;
      if (shouldCatMiss(cat, dims)) {
        showMiss(cat, dims);
        cat.attackTimer = 0;
        cat.attackFlash = 0.12;
        return;
      }
      damageEnemy(target, stats.damage, stats.attackType);
      cat.attackTimer = 0;
      cat.attackFlash = 0.18;
    }
  });

  state.cats = state.cats.filter((cat) => cat.hp > 0);
}

function updateProjectiles(delta) {
  state.projectiles.forEach((projectile) => {
    projectile.previousX = projectile.x;
    projectile.x += projectile.speed * delta;
  });

  state.projectiles = state.projectiles.filter((projectile) => {
    const enemy = findProjectileHit(projectile);

    if (enemy) {
      damageEnemy(enemy, projectile.damage, projectile.attackType);
      if (projectile.kind === "freeze") {
        applySlow(enemy, projectile.slowDuration, projectile.slowFactor, projectile.sourceCatLevel);
      }
      return false;
    }

    return projectile.x < getBoardMetrics().width + 90;
  });
}

function updateEffects(delta) {
  state.effects.forEach((effect) => {
    effect.ttl -= delta;
  });
  state.effects = state.effects.filter((effect) => effect.ttl > 0);
}

function canUseBoardActions() {
  return (
    state.gameStatus === "playing" &&
    !state.isPaused &&
    state.wavePhase === "active" &&
    !state.waveIntroActive
  );
}

function showBoardActionsBlockedHint(typeId) {
  if (typeId) shakeCard(typeId);
  playSound("error");
  showHint(state.isPaused ? UI_TEXT.hints.paused : UI_TEXT.hints.startWaveFirst);
  render();
}

function handleCellClick(row, col) {
  maybeUnlockAudio();
  if (state.gameStatus !== "playing") return;
  if (!canUseBoardActions()) {
    clearInteractionState();
    flashCell(row, col);
    playSound("error");
    showHint(state.isPaused ? UI_TEXT.hints.paused : UI_TEXT.hints.startWaveFirst);
    render();
    return;
  }

  const cat = getCatAt(row, col);
  if (!state.selectedCatType && cat) {
    openCellActionMenu(row, col);
    return;
  }

  if (!state.selectedCatType) {
    closeCellActionMenu();
    flashCell(row, col);
    showHint(UI_TEXT.hints.empty);
    return;
  }

  placeCat(row, col);
}

function selectCat(typeId) {
  maybeUnlockAudio();
  if (state.gameStatus !== "playing") return;
  if (state.pendingRemoveCatId) clearPendingRemove();
  closeCellActionMenu();
  if (!canUseBoardActions()) {
    showBoardActionsBlockedHint(typeId);
    return;
  }
  const type = catTypes[typeId];
  if (!type) return;
  if (isCatOnCooldown(typeId)) {
    playSound("error");
    shakeCard(typeId);
    showHint(UI_TEXT.hints.coolingDown);
    render();
    return;
  }
  if (state.fish < type.price) {
    playSound("error");
    triggerFishFlash();
    shakeCard(typeId);
    showHint(UI_TEXT.hints.noFish);
    render();
    return;
  }
  state.selectedCatType = state.selectedCatType === typeId ? null : typeId;
  if (state.selectedCatType) playSound("cardSelect");
  render();
}

function placeCat(row, col) {
  const type = catTypes[state.selectedCatType];
  if (!type) return;

  if (!canUseBoardActions()) {
    denyPlacement(row, col, type.id, UI_TEXT.hints.startWaveFirst);
    return;
  }

  if (isCatOnCooldown(type.id)) {
    denyPlacement(row, col, type.id, UI_TEXT.hints.coolingDown);
    return;
  }

  if (getCatAt(row, col)) {
    denyPlacement(row, col, type.id, UI_TEXT.hints.occupied);
    return;
  }

  if (state.fish < type.price) {
    triggerFishFlash();
    denyPlacement(row, col, type.id, UI_TEXT.hints.noFish);
    return;
  }

  state.fish -= type.price;
  clearPendingRemove();
  state.runStats.catsPlaced += 1;
  state.runStats.fishSpent += type.price;
  state.cats.push({
    id: nextId("cat"),
    type: type.id,
    row,
    col,
    level: 1,
    hp: type.hp,
    maxHp: type.hp,
    attackTimer: type.attackKind === "producer" ? type.produceCooldown * 0.35 : type.attackCooldown * 0.4,
    attackFlash: 0,
    hitFlash: 0,
    debuffFactor: 1,
    dead: false,
  });
  // Placement cooldown starts only after every validation passes and the cat is deployed.
  startCatCooldown(type.id);
  // Placement is single-shot by design; errors above keep the selection active.
  state.selectedCatType = null;
  playSound("catPlaced");
  showHint(UI_TEXT.hints.deployed);
  render();
}

function getCatCooldown(typeId) {
  const cooldown = state.catCooldowns[typeId] ?? 0;
  return cooldown <= 0.05 ? 0 : Math.max(0, cooldown);
}

function isCatOnCooldown(typeId) {
  return getCatCooldown(typeId) > 0;
}

function canSelectCat(typeId) {
  const type = catTypes[typeId];
  return Boolean(type)
    && canUseBoardActions()
    && state.fish >= type.price
    && !isCatOnCooldown(typeId);
}

function startCatCooldown(typeId) {
  const type = catTypes[typeId];
  if (!type) return;
  state.catCooldowns[typeId] = type.placeCooldown ?? 0;
}

function clearPlacementSelection() {
  state.selectedCatType = null;
}

function clearPendingRemove() {
  state.pendingRemoveCatId = null;
  state.pendingRemoveCell = null;
}

function confirmRemoveCat() {
  if (!canUseBoardActions()) {
    clearInteractionState();
    render();
    return;
  }
  if (!state.pendingRemoveCatId) return;
  const cat = getPendingRemoveCat();
  if (!cat) {
    clearInteractionState();
    render();
    return;
  }
  const refund = getRemoveRefund(cat);
  const removed = removeCatById(cat.id);
  clearInteractionState();
  if (removed) {
    refundCatCost(cat, refund);
    playSound("removeRefund");
    showHint(`Cat removed +${refund} fish`);
  }
  render();
}

function openCellActionMenu(row, col) {
  if (!canUseBoardActions()) {
    clearInteractionState();
    showHint(UI_TEXT.hints.startWaveFirst);
    render();
    return;
  }
  const cat = getCatAt(row, col);
  if (!cat) {
    closeCellActionMenu();
    return;
  }

  clearPlacementSelection();
  clearPendingRemove();
  state.activeCellMenu = { catId: cat.id, row, col };
  showHint(`${catTypes[cat.type].name} selected`);
  render();
}

function closeCellActionMenu() {
  state.activeCellMenu = null;
}

function handleCellMenuUpgrade() {
  const cat = getActiveCellMenuCat();
  if (!cat || !canUseBoardActions()) {
    clearInteractionState();
    render();
    return;
  }
  upgradeCat(cat.id);
  render();
}

function handleCellMenuRemove() {
  const cat = getActiveCellMenuCat();
  if (!cat || !canUseBoardActions()) {
    clearInteractionState();
    render();
    return;
  }

  closeCellActionMenu();
  clearPlacementSelection();
  state.pendingRemoveCatId = cat.id;
  state.pendingRemoveCell = { row: cat.row, col: cat.col };
  showHint("Remove this cat?");
  render();
}

function handleCellMenuCancel() {
  closeCellActionMenu();
  showHint(UI_TEXT.hints.empty);
  render();
}

function canUpgradeCat(cat) {
  return Boolean(cat)
    && cat.level === 1
    && canUseBoardActions()
    && state.fish >= getUpgradeCost(cat);
}

function getUpgradeCost(cat) {
  return catTypes[cat.type]?.upgradeCost ?? 0;
}

function getUpgradedCatStats(cat) {
  return getCatStats({ ...cat, level: 2 });
}

function upgradeCat(catId) {
  if (!canUseBoardActions()) {
    clearInteractionState();
    return false;
  }

  const cat = state.cats.find((candidate) => candidate.id === catId && candidate.hp > 0);
  if (!cat) {
    closeCellActionMenu();
    return false;
  }

  if (cat.level === 2) {
    showHint("Max level");
    return false;
  }

  const cost = getUpgradeCost(cat);
  if (state.fish < cost) {
    triggerFishFlash();
    showHint(UI_TEXT.hints.noFish);
    return false;
  }

  const previousMaxHp = cat.maxHp;
  const upgradedStats = getUpgradedCatStats(cat);
  state.fish -= cost;
  state.runStats.catsUpgraded += 1;
  state.runStats.fishSpent += cost;
  cat.level = 2;
  cat.maxHp = upgradedStats.hp;
  cat.hp = Math.min(cat.maxHp, cat.hp + Math.max(0, cat.maxHp - previousMaxHp));
  cat.attackTimer = Math.min(getEffectiveCooldown(cat), cat.attackTimer);
  renderUpgradeEffect(cat);
  closeCellActionMenu();
  playSound("upgrade");
  showHint("Cat upgraded");
  return true;
}

function renderUpgradeEffect(cat) {
  const dims = getBoardMetrics();
  const pos = cellCenter(cat.row, cat.col, dims);
  addEffect("upgrade-effect", "Lv.2", pos.x, pos.y);
  addEffect("sparkle", "UP", pos.x, pos.y - dims.cellHeight * 0.24);
}

function cancelRemoveCat() {
  if (!state.pendingRemoveCatId) return;
  clearPendingRemove();
  showHint(UI_TEXT.hints.removeCancelled);
  render();
}

function getCatInvestedCost(cat) {
  const type = catTypes[cat.type];
  if (!type) return 0;
  return type.price + (cat.level === 2 ? getUpgradeCost(cat) : 0);
}

function getRemoveRefund(cat) {
  return Math.floor(getCatInvestedCost(cat) * 0.3);
}

function refundCatCost(cat, refund = getRemoveRefund(cat)) {
  state.fish += refund;
  state.runStats.fishRefunded += refund;
  triggerFishFlash();
  addEffectAtCell("refund-pop", `+${refund}`, cat.row, cat.col);
}

function removeCatById(catId) {
  if (!canUseBoardActions()) return false;
  const cat = state.cats.find((candidate) => candidate.id === catId && candidate.hp > 0);
  if (!cat) return false;
  const dims = getBoardMetrics();
  const pos = cellCenter(cat.row, cat.col, dims);
  state.cats = state.cats.filter((candidate) => candidate.id !== catId);
  addEffect("remove-puff", "puff", pos.x, pos.y);
  return true;
}

function getPendingRemoveCat() {
  if (!state.pendingRemoveCatId) return null;
  const cat = state.cats.find((candidate) => candidate.id === state.pendingRemoveCatId && candidate.hp > 0);
  if (!cat) {
    state.pendingRemoveCatId = null;
    state.pendingRemoveCell = null;
    return null;
  }
  return cat;
}

function reconcileRemoveState() {
  if (!state.pendingRemoveCatId) return;
  if (!canUseBoardActions()) {
    state.pendingRemoveCatId = null;
    state.pendingRemoveCell = null;
    return;
  }
  const hasPendingCat = state.cats.some((cat) => cat.id === state.pendingRemoveCatId && cat.hp > 0);
  if (!hasPendingCat) {
    state.pendingRemoveCatId = null;
    state.pendingRemoveCell = null;
  }
}

function clearInteractionState() {
  clearPlacementSelection();
  clearPendingRemove();
  closeCellActionMenu();
}

function handleEscapeKey() {
  if (state.pendingRemoveCatId) {
    cancelRemoveCat();
    return;
  }
  if (state.activeCellMenu) {
    closeCellActionMenu();
    showHint(UI_TEXT.hints.empty);
    render();
    return;
  }
  if (state.selectedCatType) {
    clearPlacementSelection();
    showHint(UI_TEXT.hints.empty);
    render();
  }
}

function getActiveCellMenuCat() {
  if (!state.activeCellMenu) return null;
  const cat = state.cats.find((candidate) => candidate.id === state.activeCellMenu.catId && candidate.hp > 0);
  if (!cat) {
    closeCellActionMenu();
    return null;
  }
  return cat;
}

function reconcileCellActionMenu() {
  if (!state.activeCellMenu) return;
  const hasMenuCat = state.cats.some((cat) => cat.id === state.activeCellMenu.catId && cat.hp > 0);
  if (!hasMenuCat || !canUseBoardActions() || state.pendingRemoveCatId || state.selectedCatType) {
    closeCellActionMenu();
  }
}

function getCooldownRemainingPercent(type, cooldown) {
  if (!type.placeCooldown || cooldown <= 0) return 0;
  return Math.max(0, Math.min(100, (cooldown / type.placeCooldown) * 100));
}

function formatCooldownTime(cooldown) {
  if (cooldown <= 0) return "";
  if (cooldown < 1) return `${Math.max(0.1, cooldown).toFixed(1)}s`;
  if (cooldown < 3) return `${cooldown.toFixed(1)}s`;
  return `${Math.ceil(cooldown)}s`;
}

function reconcileSelectedCat() {
  if (!state.selectedCatType) return;
  const type = catTypes[state.selectedCatType];
  if (!type || !canUseBoardActions() || state.fish < type.price || isCatOnCooldown(type.id)) {
    state.selectedCatType = null;
  }
}

function damageCat(cat, amount) {
  if (cat.dead) return;
  playSound("catHurt");
  cat.hp -= amount;
  cat.hitFlash = 0.15;
  const dims = getBoardMetrics();
  const pos = cellCenter(cat.row, cat.col, dims);
  addEffect("damage", `-${Math.round(amount)}`, pos.x, pos.y - dims.cellHeight * 0.18);
  if (cat.hp <= 0) {
    cat.dead = true;
    addEffect("death", "down", pos.x, pos.y);
  }
}

function damageEnemy(enemy, amount, attackType = "generic") {
  if (enemy.dead) return;
  playSound("hit");
  const type = getEnemyDefinition(enemy.type);
  const damage = calculateDamage(amount, attackType, enemy);
  const armor = type.armor ?? 0;
  const finalDamage = Math.max(3, damage.amount - armor);
  enemy.hp -= finalDamage;
  enemy.hitFlash = 0.16;
  const dims = getBoardMetrics();
  addEffect("damage", `-${Math.round(finalDamage)}`, enemy.x, rowCenter(enemy.row, dims) - dims.cellHeight * 0.2);

  if (enemy.hp <= 0) {
    playSound("enemyDefeated");
    enemy.dead = true;
    state.runStats.enemiesDefeated += 1;
    state.fish += type.reward;
    addEffect("death-burst", "POP", enemy.x, rowCenter(enemy.row, dims));
    addEffect("death", "KO", enemy.x, rowCenter(enemy.row, dims));
    addEffect("fish", `+${type.reward}`, enemy.x, rowCenter(enemy.row, dims) + 8);
  }
}

function applySlow(enemy, duration, factor, sourceLevel = 1) {
  const slow = getSlowEffect(enemy, sourceLevel);
  enemy.slowTimer = Math.max(enemy.slowTimer, duration * slow.durationMultiplier);
  enemy.slowFactor = Math.min(enemy.slowFactor, slow.factor);
  const dims = getBoardMetrics();
  addEffect("freeze", "slow", enemy.x, rowCenter(enemy.row, dims));
}

function applyAttackDebuff(enemy, dims = getBoardMetrics()) {
  const type = getEnemyDefinition(enemy.type);
  const radius = dims.cellWidth * type.debuffRadiusCells;
  const target = state.cats
    .filter((cat) => cat.row === enemy.row && cat.hp > 0 && catTypes[cat.type].attackKind !== "none")
    .map((cat) => ({ cat, distance: Math.abs(cellCenter(cat.row, cat.col, dims).x - enemy.x) }))
    .filter((entry) => entry.distance <= radius)
    .sort((a, b) => a.distance - b.distance)[0]?.cat;

  if (target) {
    target.debuffFactor = Math.max(target.debuffFactor, type.debuffFactor);
    if ((enemy.debuffEffectTimer ?? 0) <= 0) {
      const pos = cellCenter(target.row, target.col, dims);
      addEffect("debuff", type.debuffEffectText ?? "slow", pos.x, pos.y - dims.cellHeight * 0.35);
      playSound("debuff");
      enemy.debuffEffectTimer = 1.1;
    }
  }
}

function getSlowEffect(enemy, sourceLevel = 1) {
  if (enemyHasTag(enemy, "boss")) {
    return { factor: sourceLevel >= 2 ? 0.84 : 0.9, durationMultiplier: 0.45 };
  }
  if (enemyHasTag(enemy, "mechanical")) {
    return { factor: sourceLevel >= 2 ? 0.75 : 0.82, durationMultiplier: 0.6 };
  }
  if (enemyHasTag(enemy, "fast") || enemyHasTag(enemy, "swarm")) {
    return { factor: 0.7, durationMultiplier: 0.8 };
  }
  return { factor: sourceLevel >= 2 ? 0.55 : 0.6, durationMultiplier: 1 };
}

function checkWinLose() {
  if (state.lives <= 0) {
    debugWave("checkWinLose gameover");
    state.gameStatus = "gameover";
    state.wavePhase = "complete";
    state.waveActive = false;
    state.activeWaveSpawnAllowed = false;
    state.waveIntroActive = false;
    state.projectiles = [];
    state.fishDrops = [];
    state.catCooldowns = createCatCooldowns();
    clearInteractionState();
    finalizeRun("gameover");
    return;
  }

  // The win state is awarded by completeCurrentWave(), after the last spawn and a clear field.
}

function pauseGame() {
  if (state.gameStatus !== "playing") return;
  clearInteractionState();
  state.isPaused = true;
}

function resumeGame() {
  state.isPaused = false;
  lastTimestamp = 0;
}

function startGame() {
  state.activeDifficulty = state.selectedDifficulty;
  state.bestRun = loadBestRun(state.activeDifficulty);
  resetRun("playing");
  prepareWaveIntro(0, CONFIG.firstWaveDelay);
  lastTimestamp = 0;
  render();
}

function restartGame() {
  state.selectedDifficulty = state.activeDifficulty;
  state.bestRun = loadBestRun(state.activeDifficulty);
  resetRun("playing");
  prepareWaveIntro(0, CONFIG.firstWaveDelay);
  lastTimestamp = 0;
  render();
}

function resetRun(status) {
  const difficulty = getDifficulty();
  idCounter = 0;
  state.cats = [];
  state.enemies = [];
  state.projectiles = [];
  state.fishDrops = [];
  state.effects = [];
  state.fish = difficulty.startingFish;
  state.lives = difficulty.lives;
  clearInteractionState();
  state.catCooldowns = createCatCooldowns();
  state.runStats = resetRunStats(difficulty.lives);
  state.currentScore = 0;
  state.isNewBest = false;
  state.waveIndex = 0;
  state.waveTimer = 0;
  state.wavePhase = "preview";
  state.waveActive = false;
  state.activeWaveSpawnAllowed = false;
  state.waveIntroActive = false;
  state.waveIntroTimer = 0;
  state.waveSpawnList = [];
  state.waveSpawnCursor = 0;
  state.currentWaveSpawnComplete = false;
  state.nextSpawnIn = 0;
  state.hasStartedFirstWave = false;
  state.naturalFishDropTimer = CONFIG.firstNaturalFishDropDelay;
  state.fishFlashTimer = 0;
  state.hintTimer = 0;
  state.hintMessage = "";
  state.baseFlashTimer = 0;
  state.bossWarningTimer = 0;
  state.wavePulseTimer = 0;
  state.isPaused = false;
  state.gameStatus = status;
  modal.classList.add("hidden");
  modal.classList.remove("is-victory", "is-gameover", "is-new-best");
  endStats.innerHTML = "";
}

function prepareWaveIntro(index, seconds) {
  const waves = getActiveWaves();
  if (state.gameStatus !== "playing") {
    debugWave("prepareWaveIntro blocked", { requestedWaveIndex: index, reason: "not playing" });
    return;
  }
  if (!waves[index]) {
    debugWave("prepareWaveIntro blocked", { requestedWaveIndex: index, reason: "missing wave" });
    return;
  }
  if (state.wavePhase === "active") {
    debugWave("prepareWaveIntro blocked", { requestedWaveIndex: index, reason: "active wave" });
    return;
  }
  if (state.enemies.length > 0) {
    debugWave("prepareWaveIntro blocked", { requestedWaveIndex: index, reason: "enemies still alive" });
    return;
  }
  debugWave("prepareWaveIntro", { requestedWaveIndex: index });
  clearInteractionState();
  state.waveIndex = index;
  state.wavePhase = "preview";
  state.waveActive = false;
  state.activeWaveSpawnAllowed = false;
  state.waveIntroActive = true;
  state.waveIntroTimer = seconds;
  state.waveSpawnList = [];
  state.waveSpawnCursor = 0;
  state.nextSpawnIn = 0;
  state.waveTimer = 0;
}

function startWave() {
  maybeUnlockAudio();
  if (!canStartWave()) {
    debugWave("startWave blocked");
    return;
  }
  const waves = getActiveWaves();
  const wave = waves[state.waveIndex];
  if (!wave) {
    debugWave("startWave blocked", { reason: "missing wave" });
    return;
  }
  debugWave("startWave", { waveName: wave.name });
  state.waveIntroActive = false;
  state.waveIntroTimer = 0;
  state.wavePhase = "active";
  state.waveActive = true;
  state.activeWaveSpawnAllowed = true;
  state.currentWaveSpawnComplete = false;
  state.waveSpawnList = expandWave(wave);
  state.waveSpawnCursor = 0;
  state.nextSpawnIn = CONFIG.waveStartDelay;
  state.waveTimer = 0;
  state.hasStartedFirstWave = true;
  state.wavePulseTimer = 0.65;
  playSound("waveStart");
  render();
}

function completeCurrentWave() {
  const waves = getActiveWaves();
  if (state.gameStatus !== "playing") {
    debugWave("completeCurrentWave blocked", { reason: "not playing" });
    return;
  }
  if (state.isPaused) {
    debugWave("completeCurrentWave blocked", { reason: "paused" });
    return;
  }
  if (state.wavePhase !== "active") {
    debugWave("completeCurrentWave blocked", { reason: "not active phase" });
    return;
  }
  if (!state.currentWaveSpawnComplete) {
    debugWave("completeCurrentWave blocked", { reason: "spawn not complete" });
    return;
  }
  if (state.enemies.length > 0) {
    debugWave("completeCurrentWave blocked", { reason: "enemies still alive" });
    return;
  }
  debugWave("completeCurrentWave");
  state.waveActive = false;
  state.activeWaveSpawnAllowed = false;
  state.wavePhase = "complete";
  state.waveSpawnList = [];
  state.waveSpawnCursor = 0;
  state.nextSpawnIn = 0;
  state.waveTimer = 0;
  state.projectiles = [];
  state.runStats.wavesCleared = Math.max(state.runStats.wavesCleared, state.waveIndex + 1);

  if (state.waveIndex >= waves.length - 1) {
    state.wavePhase = "complete";
    state.waveIndex = waves.length;
    state.gameStatus = "victory";
    state.waveIntroActive = false;
    state.waveActive = false;
    state.activeWaveSpawnAllowed = false;
    state.waveSpawnList = [];
    state.waveSpawnCursor = 0;
    state.nextSpawnIn = 0;
    state.waveTimer = 0;
    state.fishDrops = [];
    state.catCooldowns = createCatCooldowns();
    clearInteractionState();
    finalizeRun("victory");
    return;
  }

  prepareWaveIntro(state.waveIndex + 1, CONFIG.interWaveDelay);
}

function canStartWave() {
  const waves = getActiveWaves();
  return (
    state.gameStatus === "playing" &&
    state.wavePhase === "preview" &&
    state.waveIntroActive &&
    state.enemies.length === 0 &&
    Boolean(waves[state.waveIndex])
  );
}

function fireProjectile(cat, target, dims) {
  const stats = getCatStats(cat);
  const pos = cellCenter(cat.row, cat.col, dims);
  state.projectiles.push({
    id: nextId("projectile"),
    row: cat.row,
    x: pos.x + dims.cellWidth * 0.26,
    previousX: pos.x + dims.cellWidth * 0.26,
    y: pos.y - dims.cellHeight * 0.04,
    kind: stats.projectileType,
    attackType: stats.attackType,
    damage: stats.damage,
    speed: stats.projectileSpeed,
    hitRadius: stats.projectileType === "sniper" ? 26 : 20,
    slowDuration: stats.slowDuration ?? 0,
    slowFactor: stats.slowFactor ?? 1,
    sourceCatLevel: cat.level,
    targetId: target.id,
  });
}

function findRangedTarget(cat, dims) {
  const catX = cellCenter(cat.row, cat.col, dims).x;
  return state.enemies
    .filter((enemy) => enemy.row === cat.row && enemy.hp > 0 && enemy.x > catX + dims.cellWidth * 0.3)
    .sort((a, b) => a.x - b.x)[0];
}

function findMeleeTarget(cat, dims) {
  const catX = cellCenter(cat.row, cat.col, dims).x;
  const stats = getCatStats(cat);
  const range = dims.cellWidth * stats.meleeRangeCells;
  return state.enemies
    .filter((enemy) => enemy.row === cat.row && enemy.hp > 0 && Math.abs(enemy.x - catX) <= range)
    .sort((a, b) => Math.abs(a.x - catX) - Math.abs(b.x - catX))[0];
}

function findBlockingCat(enemy, dims) {
  const enemyType = getEnemyDefinition(enemy.type);
  const radius = dims.cellWidth * (enemyType.blockRadiusCells ?? 0.43);
  return state.cats
    .filter((cat) => {
      const catX = cellCenter(cat.row, cat.col, dims).x;
      return cat.row === enemy.row && cat.hp > 0 && Math.abs(enemy.x - catX) <= radius;
    })
    .sort((a, b) => {
      const ax = Math.abs(enemy.x - cellCenter(a.row, a.col, dims).x);
      const bx = Math.abs(enemy.x - cellCenter(b.row, b.col, dims).x);
      return ax - bx;
    })[0];
}

function findProjectileHit(projectile) {
  const from = Math.min(projectile.previousX, projectile.x) - projectile.hitRadius;
  const to = Math.max(projectile.previousX, projectile.x) + projectile.hitRadius;
  return state.enemies
    .filter((enemy) => enemy.row === projectile.row && enemy.hp > 0 && enemy.x >= from && enemy.x <= to)
    .sort((a, b) => a.x - b.x)[0];
}

function getCatAt(row, col) {
  return state.cats.find((cat) => cat.row === row && cat.col === col && cat.hp > 0);
}

function denyPlacement(row, col, typeId, message) {
  closeCellActionMenu();
  flashCell(row, col);
  shakeCard(typeId);
  playSound("error");
  showHint(message);
}

function flashCell(row, col) {
  const cell = board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  cell.classList.remove("denied");
  void cell.offsetWidth;
  cell.classList.add("denied");
}

function shakeCard(typeId) {
  const card = catCards.querySelector(`[data-type="${typeId}"]`);
  if (!card) return;
  card.classList.remove("denied");
  void card.offsetWidth;
  card.classList.add("denied");
}

function triggerFishFlash() {
  state.fishFlashTimer = CONFIG.feedbackFlashSeconds;
}

function showHint(message) {
  state.hintMessage = message;
  state.hintTimer = 1.2;
}

function getPlacementHintText() {
  if (state.hintTimer > 0 && state.hintMessage) return state.hintMessage;
  return state.selectedCatType ? UI_TEXT.hints.selected : UI_TEXT.hints.empty;
}

function addEffectAtCell(kind, text, row, col) {
  const dims = getBoardMetrics();
  const pos = cellCenter(row, col, dims);
  addEffect(kind, text, pos.x, pos.y);
}

function addEffect(kind, text, x, y) {
  state.effects.push({
    id: nextId("effect"),
    kind,
    text,
    x,
    y,
    ttl: 0.72,
  });
}

function isCatPanicked(cat, dims = getBoardMetrics()) {
  if (cat.type === "ninja" || cat.type === "tank") return false;
  const catX = cellCenter(cat.row, cat.col, dims).x;
  return getPanicCucumbers(cat, dims).some((entry) => entry.distance <= dims.cellWidth * 4);
}

function getCatMissChance(cat, dims = getBoardMetrics()) {
  if (!isCatPanicked(cat, dims)) return 0;
  switch (cat.type) {
    case "yarn":
      return 0.45;
    case "sniper":
      return 0.2;
    case "freezer":
      return 0.3;
    default:
      return 0;
  }
}

function shouldCatMiss(cat, dims = getBoardMetrics()) {
  const missChance = getCatMissChance(cat, dims);
  const missed = missChance > 0 && Math.random() < missChance;
  debugPanic(cat, dims, missChance, missed);
  return missed;
}

function showMiss(cat, dims = getBoardMetrics()) {
  const pos = cellCenter(cat.row, cat.col, dims);
  addEffect("miss combat-float", "MISS", pos.x, pos.y - dims.cellHeight * 0.38);
  playSound("panic");
}

function getPanicCucumbers(cat, dims = getBoardMetrics()) {
  const catX = cellCenter(cat.row, cat.col, dims).x;
  return state.enemies
    .filter((enemy) => (
      enemy.type === "cucumber" &&
      enemy.hp > 0 &&
      !enemy.dead &&
      enemy.row === cat.row &&
      enemy.x > catX
    ))
    .map((enemy) => ({ enemy, distance: enemy.x - catX }));
}

function debugPanic(cat, dims, missChance, missed) {
  if (!CONFIG.debugPanic) return;
  const nearest = getPanicCucumbers(cat, dims).sort((a, b) => a.distance - b.distance)[0];
  console.debug("[panic]", {
    catType: cat.type,
    cucumberDistance: nearest ? Number((nearest.distance / dims.cellWidth).toFixed(2)) : null,
    missChance,
    missed,
  });
}

function getEffectiveCooldown(cat) {
  const stats = getCatStats(cat);
  const base = stats.attackKind === "producer" ? stats.produceCooldown : stats.attackCooldown;
  const panicFactor = stats.attackKind === "producer" && isCatPanicked(cat) ? 1.5 : 1;
  return Math.max(0.1, base * (cat.debuffFactor || 1) * panicFactor);
}

function getCatStats(cat) {
  const type = catTypes[cat.type];
  const stats = {
    ...type,
    hp: type.hp,
    damage: type.damage ?? 0,
    attackCooldown: type.attackCooldown ?? 0,
    attackType: type.attackType ?? "generic",
    produceAmount: type.produceAmount ?? 0,
    produceCooldown: type.produceCooldown ?? 0,
    slowDuration: type.slowDuration ?? 0,
    slowFactor: type.slowFactor ?? 1,
  };

  if (cat.level === 2) {
    const level2 = type.level2 ?? {};
    stats.hp = Math.round(type.hp * (level2.hp ?? 1));
    stats.damage = Math.round((type.damage ?? 0) * (level2.damage ?? 1));
    stats.attackCooldown = (type.attackCooldown ?? 0) * (level2.attackCooldown ?? 1);
    stats.produceCooldown = (type.produceCooldown ?? 0) * (level2.produceCooldown ?? 1);
    stats.produceAmount = (type.produceAmount ?? 0) + (level2.produceAmountBonus ?? 0);
    stats.slowDuration = (type.slowDuration ?? 0) * (level2.slowDuration ?? 1);
  }

  return stats;
}

function getBoardMetrics() {
  const rect = board.getBoundingClientRect();
  const width = rect.width || 960;
  const height = rect.height || 400;
  return {
    width,
    height,
    cellWidth: width / CONFIG.gridCols,
    cellHeight: height / CONFIG.gridRows,
  };
}

function cellCenter(row, col, dims = getBoardMetrics()) {
  return {
    x: (col + 0.5) * dims.cellWidth,
    y: (row + 0.5) * dims.cellHeight,
  };
}

function rowCenter(row, dims = getBoardMetrics()) {
  return (row + 0.5) * dims.cellHeight;
}

function randomRow() {
  return Math.floor(Math.random() * CONFIG.gridRows);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetRunStats(lives = CONFIG.startLives) {
  return {
    enemiesDefeated: 0,
    catsPlaced: 0,
    fishCollected: 0,
    fishSpent: 0,
    fishRefunded: 0,
    fishDropsCollected: 0,
    catsUpgraded: 0,
    wavesCleared: 0,
    livesRemaining: lives,
    finalResult: "",
    runTimeSeconds: 0,
  };
}

function expandWave(wave) {
  const spawns = [];
  wave.groups.forEach((group) => {
    for (let i = 0; i < group.count; i += 1) {
      spawns.push({ type: group.type, interval: wave.interval });
    }
  });
  return spawns;
}

function getWaveStatusText() {
  const waves = getActiveWaves();
  if (state.gameStatus === "start") return "Ready";
  if (state.gameStatus === "victory") return "Victory";
  if (state.gameStatus === "gameover") return "Game Over";
  if (state.isPaused) return "Paused";
  if (state.waveIndex >= waves.length) return "Clearing field";
  if (state.waveIntroActive) return `Wave ${state.waveIndex + 1} ready`;
  if (state.currentWaveSpawnComplete) return `Clear ${state.enemies.length} left`;
  if (state.wavePhase === "active") {
    const remaining = state.waveSpawnList.length - state.waveSpawnCursor;
    return `${waves[state.waveIndex].name}: ${remaining} incoming`;
  }
  return "Preparing";
}

function finalizeRun(result) {
  const copy = { ...state.runStats };
  copy.livesRemaining = Math.max(0, state.lives);
  copy.finalResult = result === "victory" ? "Victory" : "Game Over";
  copy.runTimeSeconds = Math.round(copy.runTimeSeconds);
  state.runStats = copy;
  const bestResult = maybeUpdateBestRun(copy);
  state.currentScore = bestResult.score;
  state.bestRun = bestResult.bestRun;
  state.isNewBest = bestResult.isNewBest;
  const text = result === "victory" ? UI_TEXT.results.victory : UI_TEXT.results.gameover;
  showModal(text.title, text.message, text.kicker, result);
  playSound(result === "victory" ? "victory" : "gameover");
}

function calculateScore(stats) {
  const victoryBonus = stats.finalResult === "Victory" ? 3000 : 0;
  const score = (stats.enemiesDefeated * 100)
    + (stats.wavesCleared * 500)
    + (stats.livesRemaining * 250)
    + (stats.fishCollected * 2)
    - (stats.runTimeSeconds * 3)
    + victoryBonus;
  return Math.max(0, Math.round(score));
}

function formatScore(score) {
  return Math.max(0, Number(score) || 0).toLocaleString("en-US");
}

function parseStoredNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const normalized = Number(value.replace(/,/g, ""));
    return Number.isFinite(normalized) ? normalized : null;
  }
  return null;
}

function normalizeBestRun(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const bestScore = parseStoredNumber(candidate.bestScore);
  if (bestScore === null) return null;

  return {
    bestResult: candidate.bestResult === "Victory" ? "Victory" : "Game Over",
    bestScore,
    bestWavesCleared: parseStoredNumber(candidate.bestWavesCleared) ?? 0,
    bestEnemiesDefeated: parseStoredNumber(candidate.bestEnemiesDefeated) ?? 0,
    bestLivesRemaining: parseStoredNumber(candidate.bestLivesRemaining) ?? 0,
    bestRunTimeSeconds: parseStoredNumber(candidate.bestRunTimeSeconds) ?? 0,
    bestFishCollected: parseStoredNumber(candidate.bestFishCollected) ?? 0,
    difficulty: typeof candidate.difficulty === "string" ? candidate.difficulty : "",
    modeName: typeof candidate.modeName === "string" ? candidate.modeName : "",
    date: typeof candidate.date === "string" ? candidate.date : "",
  };
}

function loadBestRuns() {
  try {
    const raw = window.localStorage.getItem(CONFIG.bestRunStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.keys(difficultyDefinitions).map((difficultyId) => [
        difficultyId,
        normalizeBestRun(parsed[difficultyId]),
      ]),
    );
  } catch (_error) {
    return {};
  }
}

function loadBestRun(difficultyId = state.activeDifficulty) {
  return loadBestRuns()[difficultyId] ?? null;
}

function saveBestRun(score, stats, difficultyId = state.activeDifficulty) {
  const difficulty = getDifficulty(difficultyId);
  const bestRun = {
    bestResult: stats.finalResult,
    bestScore: score,
    bestWavesCleared: stats.wavesCleared,
    bestEnemiesDefeated: stats.enemiesDefeated,
    bestLivesRemaining: stats.livesRemaining,
    bestRunTimeSeconds: stats.runTimeSeconds,
    bestFishCollected: stats.fishCollected,
    difficulty: difficulty.id,
    modeName: difficulty.name,
    date: new Date().toISOString(),
  };

  try {
    const bestRuns = loadBestRuns();
    bestRuns[difficultyId] = bestRun;
    window.localStorage.setItem(CONFIG.bestRunStorageKey, JSON.stringify(bestRuns));
  } catch (_error) {
    return bestRun;
  }

  return bestRun;
}

function maybeUpdateBestRun(stats) {
  const score = calculateScore(stats);
  const previousBest = loadBestRun(state.activeDifficulty) ?? normalizeBestRun(state.bestRun);
  const previousBestScore = previousBest ? Number(previousBest.bestScore) : null;
  const didBeatBest = previousBestScore === null || score > previousBestScore;

  if (didBeatBest) {
    const bestRun = saveBestRun(score, stats, state.activeDifficulty);
    return { score, bestRun, isNewBest: true, previousBestScore, didBeatBest };
  }

  return { score, bestRun: previousBest, isNewBest: false, previousBestScore, didBeatBest };
}

function formatRunTime(seconds) {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function renderEndStats(result) {
  const stats = state.runStats;
  const difficulty = getDifficulty();
  const waves = getActiveWaves();
  const bestScore = state.bestRun ? state.bestRun.bestScore : state.currentScore;
  const scoreStats = [
    ["Mode", difficulty.name, "mode-card"],
    ["Current Score", formatScore(state.currentScore), "score-card"],
    ["Best Score", formatScore(bestScore), "score-card"],
  ];
  const commonStats = [
    ["Waves cleared", `${stats.wavesCleared}/${waves.length}`],
    ["Enemies defeated", stats.enemiesDefeated],
    ["Cats deployed", stats.catsPlaced],
    ["Cats upgraded", stats.catsUpgraded],
    ["Fish collected", stats.fishCollected],
    ["Drops collected", stats.fishDropsCollected],
    ["Fish refunded", stats.fishRefunded],
  ];
  const victoryStats = [
    ...commonStats,
    ["Fish spent", stats.fishSpent],
    ["Lives remaining", stats.livesRemaining],
    ["Time", formatRunTime(stats.runTimeSeconds)],
  ];
  const gameOverStats = [
    ...commonStats,
    ["Time survived", formatRunTime(stats.runTimeSeconds)],
  ];
  const cards = [...scoreStats, ...(result === "victory" ? victoryStats : gameOverStats)];

  const badge = state.isNewBest ? `<div class="new-best-badge">New Best!</div>` : "";
  const cardHtml = cards.map(([label, value, className = ""]) => `
    <div class="stat-card ${className}">
      <span class="stat-value">${value}</span>
      <span class="stat-label">${label}</span>
    </div>
  `).join("");

  return `${badge}${cardHtml}`;
}

function showModal(title, message, kicker, result = "") {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalKicker.textContent = kicker;
  modal.classList.toggle("is-victory", result === "victory");
  modal.classList.toggle("is-gameover", result === "gameover");
  modal.classList.toggle("is-new-best", state.isNewBest);
  endStats.innerHTML = result ? renderEndStats(result) : "";
  modal.classList.remove("hidden");
}

function resetBestRun() {
  try {
    const bestRuns = loadBestRuns();
    delete bestRuns[state.selectedDifficulty];
    window.localStorage.setItem(CONFIG.bestRunStorageKey, JSON.stringify(bestRuns));
  } catch (_error) {
    // localStorage can be unavailable in private or restricted browser contexts.
  }
  state.bestRun = null;
  state.isNewBest = false;
  state.currentScore = 0;
  render();
}

document.addEventListener("DOMContentLoaded", init);
