
export interface Point {
  x: number;
  y: number;
}

export type TowerType = 'warrior' | 'archer' | 'mage' | 'golem' | 'sniper' | 'bombardier' | 'tesla' | 'plasma';

export interface TowerConfig {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number; // ms between shots
  color: string;
  icon: string;
  description: string;
  unlockWave: number; // New property to control progression
}

export type EnemyType = 'goblin' | 'orc' | 'troll' | 'boss' | 'elite';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  color: string;
  radius: number;
}

export interface TowerInstance {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  level: number;
  totalInvested: number;
  lastFired: number;
  targetId?: string;
}

export interface EnemyInstance {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  pathIndex: number;
  distanceTraveled: number;
  level: number;
}

export interface ProjectileInstance {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  isAOE?: boolean;
  aoeRadius?: number;
}

export interface GameState {
  money: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  isPaused: boolean;
}
