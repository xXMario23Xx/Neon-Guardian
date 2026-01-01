
import { TowerConfig, EnemyConfig, Point } from './types';

export const GRID_SIZE = 40;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const TOWERS: Record<string, TowerConfig & { iconUnicode: string }> = {
  warrior: {
    type: 'warrior',
    name: 'Guerrero Neón',
    cost: 50,
    damage: 18,
    range: 130,
    fireRate: 850,
    color: '#3b82f6',
    icon: 'fa-shield-halved',
    iconUnicode: '\uf3ed',
    description: 'Equilibrado: Mejora uniforme de estadísticas.',
    unlockWave: 0
  },
  archer: {
    type: 'archer',
    name: 'Arquera Veloz',
    cost: 80,
    damage: 12,
    range: 200,
    fireRate: 550,
    color: '#10b981',
    icon: 'fa-location-crosshairs',
    iconUnicode: '\uf05b',
    description: 'Largo Alcance: El rango aumenta masivamente con estrellas.',
    unlockWave: 0
  },
  mage: {
    type: 'mage',
    name: 'Mago Arcano',
    cost: 140,
    damage: 45,
    range: 150,
    fireRate: 1600,
    color: '#a855f7',
    icon: 'fa-wand-sparkles',
    iconUnicode: '\uf72e',
    description: 'Daño Concentrado: Gran escalado de daño puro.',
    unlockWave: 0
  },
  golem: {
    type: 'golem',
    name: 'Golem de Hielo',
    cost: 162,
    damage: 8,
    range: 110,
    fireRate: 1100,
    color: '#06b6d4',
    icon: 'fa-snowflake',
    iconUnicode: '\uf2dc',
    description: 'Control: Ralentiza enemigos cercanos. Mejora su aura.',
    unlockWave: 5
  },
  bombardier: {
    type: 'bombardier',
    name: 'Bombardero',
    cost: 180,
    damage: 30,
    range: 160,
    fireRate: 2200,
    color: '#ef4444',
    icon: 'fa-bomb',
    iconUnicode: '\uf1e2',
    description: 'Daño de Área: Explosiones que dañan a grupos. Mejora el radio.',
    unlockWave: 10
  },
  tesla: {
    type: 'tesla',
    name: 'Torre Tesla',
    cost: 198,
    damage: 15,
    range: 140,
    fireRate: 900,
    color: '#c084fc',
    icon: 'fa-bolt-lightning',
    iconUnicode: '\uf0e7',
    description: 'Multiobjetivo: Ataca a varios enemigos a la vez.',
    unlockWave: 15
  },
  sniper: {
    type: 'sniper',
    name: 'Francotirador',
    cost: 225,
    damage: 150,
    range: 380,
    fireRate: 3800,
    color: '#f59e0b',
    icon: 'fa-bullseye',
    iconUnicode: '\uf140',
    description: 'Anti-Jefes: Daño crítico extremo a larga distancia.',
    unlockWave: 20
  },
  plasma: {
    type: 'plasma',
    name: 'Rayo Plasma',
    cost: 270,
    damage: 5,
    range: 120,
    fireRate: 100,
    color: '#ec4899',
    icon: 'fa-fire-burner',
    iconUnicode: '\ue4f1',
    description: 'Daño Continuo: Quema a los enemigos rápidamente.',
    unlockWave: 25
  }
};

export const ENEMIES: Record<string, EnemyConfig> = {
  goblin: {
    type: 'goblin',
    name: 'Duende',
    hp: 40,
    speed: 1.8,
    reward: 15,
    color: '#84cc16',
    radius: 10
  },
  orc: {
    type: 'orc',
    name: 'Orco',
    hp: 150,
    speed: 1.0,
    reward: 35,
    color: '#ef4444',
    radius: 14
  },
  troll: {
    type: 'troll',
    name: 'Troll',
    hp: 450,
    speed: 0.6,
    reward: 80,
    color: '#71717a',
    radius: 18
  },
  boss: {
    type: 'boss',
    name: 'ANIQUILADOR',
    hp: 1500,
    speed: 0.4,
    reward: 500,
    color: '#06b6d4',
    radius: 26
  },
  elite: {
    type: 'elite',
    name: 'Escolta Real',
    hp: 300,
    speed: 0.4,
    reward: 100,
    color: '#d946ef',
    radius: 12
  }
};

export const PATH: Point[] = [
  { x: 0, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 100 },
  { x: 500, y: 100 },
  { x: 500, y: 500 },
  { x: 700, y: 500 },
  { x: 700, y: 300 },
  { x: 800, y: 300 }
];

// Reverting to the version with more slots (37 positions)
export const SLOTS: Point[] = [
  // Segmento inicial (y=300)
  { x: 50, y: 250 }, { x: 100, y: 250 }, { x: 150, y: 250 },
  { x: 50, y: 350 }, { x: 100, y: 350 }, { x: 150, y: 350 },
  // Codo 1 (x=200)
  { x: 150, y: 150 }, { x: 250, y: 150 }, { x: 250, y: 200 }, { x: 250, y: 250 },
  // Segmento superior (y=100)
  { x: 300, y: 50 }, { x: 350, y: 50 }, { x: 400, y: 50 }, { x: 450, y: 50 },
  { x: 300, y: 150 }, { x: 350, y: 150 }, { x: 400, y: 150 }, { x: 450, y: 150 },
  // Bajada (x=500)
  { x: 450, y: 300 }, { x: 450, y: 400 }, { x: 450, y: 450 },
  { x: 550, y: 150 }, { x: 550, y: 200 }, { x: 550, y: 250 }, { x: 550, y: 300 }, { x: 550, y: 350 }, { x: 550, y: 400 }, { x: 550, y: 450 },
  // Segmento inferior (y=500)
  { x: 600, y: 450 }, { x: 650, y: 450 },
  { x: 600, y: 550 }, { x: 650, y: 550 },
  // Penúltimo codo (x=700)
  { x: 650, y: 350 }, { x: 750, y: 350 }, { x: 750, y: 400 }, { x: 750, y: 450 },
  // Final
  { x: 750, y: 250 }
];
