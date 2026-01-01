
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, TowerInstance, EnemyInstance, ProjectileInstance, 
  TowerType, Point, EnemyType 
} from './types';
import { 
  TOWERS, ENEMIES, PATH, SLOTS, CANVAS_WIDTH, CANVAS_HEIGHT 
} from './constants';
import { getTacticalAdvice } from './geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: 600,
    lives: 5,
    wave: 0,
    isGameOver: false,
    isPaused: true,
  });

  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [useIconStyle, setUseIconStyle] = useState<boolean>(true);
  const [advice, setAdvice] = useState<string>("Comandante, establezca perímetros.");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [hoveredTowerId, setHoveredTowerId] = useState<string | null>(null);

  const gameStateRef = useRef(gameState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const towersRef = useRef<TowerInstance[]>([]);
  const enemiesRef = useRef<EnemyInstance[]>([]);
  const projectilesRef = useRef<ProjectileInstance[]>([]);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const waveInProgressRef = useRef(false);

  const selectedInst = towersRef.current.find(t => t.id === selectedInstanceId);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const getTowerStats = (tower: TowerInstance) => {
    const base = TOWERS[tower.type];
    const lv = tower.level;
    let damage = base.damage;
    let range = base.range;
    let fireRate = base.fireRate;
    let slowPower = 0.45;
    let aoeRadius = 0;
    let targets = 1;

    if (lv > 1) {
        const factor = Math.min(lv, 4);
        switch (tower.type) {
          case 'warrior': damage *= (1 + (factor - 1) * 0.45); range *= (1 + (factor - 1) * 0.18); break;
          case 'archer': damage *= (1 + (factor - 1) * 0.25); range *= (1 + (factor - 1) * 0.4); break;
          case 'mage': damage *= (1 + (factor - 1) * 0.9); fireRate *= Math.pow(0.94, factor - 1); break;
          case 'golem': range *= (1 + (factor - 1) * 0.3); slowPower = Math.min(0.75, 0.45 + (factor - 1) * 0.08); break;
          case 'sniper': damage *= (1 + (factor - 1) * 1.3); range *= (1 + (factor - 1) * 0.05); break;
          case 'bombardier': damage *= (1 + (factor - 1) * 0.5); aoeRadius = 60 + (factor - 1) * 20; range *= (1 + (factor - 1) * 0.1); break;
          case 'tesla': damage *= (1 + (factor - 1) * 0.3); targets = 2 + (factor - 1); break;
          case 'plasma': damage *= (1 + (factor - 1) * 0.6); range *= (1 + (factor - 1) * 0.15); break;
        }
    }
    if (lv === 5) {
        damage *= 2.5; range *= 1.6;
        if (tower.type === 'tesla') targets += 4;
        if (tower.type === 'bombardier') aoeRadius *= 2.0;
        if (tower.type === 'golem') slowPower = 0.85;
    }
    return { damage, range, fireRate, slowPower, aoeRadius, targets };
  };

  const getUpgradeDetails = (tower: TowerInstance) => {
    const isUltimate = tower.level === 4;
    if (isUltimate) return "¡ULTIMATE! (+150% DMG, +60% RNG)";
    switch (tower.type) {
      case 'warrior': return "+45% Daño, +18% Rango";
      case 'archer': return "+40% Rango, +25% Daño";
      case 'mage': return "+90% Daño, +6% Cadencia";
      case 'golem': return "+30% Rango Ralentización";
      case 'bombardier': return "+50% Daño, +Área Exp.";
      case 'tesla': return "+1 Target, +30% Daño";
      case 'sniper': return "+130% Daño Crítico";
      case 'plasma': return "+60% Quema, +15% Rango";
      default: return "Mejorar básicas";
    }
  }

  const createEnemy = (type: string, wave: number, level: number): EnemyInstance => {
    const config = ENEMIES[type];
    const levelMultiplier = 1 + (level - 1) * 0.7;
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: type as any, x: PATH[0].x, y: PATH[0].y,
      hp: config.hp * levelMultiplier + (wave * 20),
      maxHp: config.hp * levelMultiplier + (wave * 20),
      pathIndex: 0, distanceTraveled: 0, level: level
    };
  };

  const spawnWave = useCallback(async () => {
    if (waveInProgressRef.current || gameStateRef.current.isGameOver) return;
    waveInProgressRef.current = true;
    const nextWave = gameStateRef.current.wave + 1;
    setGameState(prev => ({ ...prev, wave: nextWave, isPaused: false }));
    setIsAdviceLoading(true);
    const newAdvice = await getTacticalAdvice({...gameStateRef.current, wave: nextWave}, towersRef.current);
    setAdvice(newAdvice);
    setIsAdviceLoading(false);
    const enemyLevel = Math.floor(nextWave / 10) + 1;
    if (nextWave % 10 === 0) {
      for (let i = 0; i < 2; i++) { enemiesRef.current.push(createEnemy('elite', nextWave, enemyLevel)); await new Promise(r => setTimeout(r, 400)); }
      enemiesRef.current.push(createEnemy('boss', nextWave, enemyLevel)); await new Promise(r => setTimeout(r, 400));
      for (let i = 0; i < 2; i++) { enemiesRef.current.push(createEnemy('elite', nextWave, enemyLevel)); await new Promise(r => setTimeout(r, 400)); }
    } else {
      const enemyCount = 8 + Math.floor(nextWave * 1.8);
      for (let i = 0; i < enemyCount; i++) {
        if (gameStateRef.current.isGameOver) break;
        let type = 'goblin';
        if (nextWave > 4) type = Math.random() > 0.6 ? 'orc' : 'goblin';
        if (nextWave > 12) type = Math.random() > 0.8 ? 'troll' : (Math.random() > 0.5 ? 'orc' : 'goblin');
        enemiesRef.current.push(createEnemy(type, nextWave, enemyLevel));
        await new Promise(resolve => setTimeout(resolve, 750 - Math.min(nextWave * 15, 450)));
      }
    }
    waveInProgressRef.current = false;
  }, []);

  const gameLoop = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    if (!gameStateRef.current.isPaused && !gameStateRef.current.isGameOver) update(deltaTime);
    draw();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const update = (dt: number) => {
    enemiesRef.current.forEach((enemy, index) => {
      const targetWaypoint = PATH[enemy.pathIndex + 1];
      if (!targetWaypoint) {
        setGameState(prev => {
          const newLives = prev.lives - 1;
          return { ...prev, lives: Math.max(0, newLives), isGameOver: newLives <= 0 };
        });
        enemiesRef.current.splice(index, 1);
        return;
      }
      const dx = targetWaypoint.x - enemy.x;
      const dy = targetWaypoint.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      let currentSpeed = ENEMIES[enemy.type].speed;
      const nearbyGolems = towersRef.current.filter(t => {
        if (t.type !== 'golem') return false;
        const stats = getTowerStats(t);
        const d = Math.sqrt(Math.pow(t.x - enemy.x, 2) + Math.pow(t.y - enemy.y, 2));
        return d < stats.range;
      });
      if (nearbyGolems.length > 0) {
        const bestSlow = Math.max(...nearbyGolems.map(g => getTowerStats(g).slowPower));
        currentSpeed *= (1 - bestSlow);
      }
      if (distance < 5) enemy.pathIndex++;
      else {
        const moveDist = currentSpeed * (dt / 16);
        enemy.x += (dx / distance) * moveDist;
        enemy.y += (dy / distance) * moveDist;
        enemy.distanceTraveled += moveDist;
      }
    });

    towersRef.current.forEach(tower => {
      const stats = getTowerStats(tower);
      const now = performance.now();
      if (now - tower.lastFired >= stats.fireRate) {
        const inRange = enemiesRef.current.filter(e => Math.sqrt(Math.pow(e.x - tower.x, 2) + Math.pow(e.y - tower.y, 2)) <= stats.range)
          .sort((a, b) => b.distanceTraveled - a.distanceTraveled);
        if (inRange.length > 0) {
          const shootCount = Math.min(inRange.length, stats.targets);
          for (let i = 0; i < shootCount; i++) {
            const target = inRange[i];
            projectilesRef.current.push({
              id: Math.random().toString(36).substr(2, 9), x: tower.x, y: tower.y, targetId: target.id,
              damage: stats.damage, speed: tower.type === 'bombardier' ? 6 : 12, color: TOWERS[tower.type].color,
              isAOE: tower.type === 'bombardier', aoeRadius: stats.aoeRadius
            });
          }
          tower.lastFired = now;
        }
      }
    });

    projectilesRef.current.forEach((proj, index) => {
      const target = enemiesRef.current.find(e => e.id === proj.targetId);
      if (!target) { projectilesRef.current.splice(index, 1); return; }
      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) {
        if (proj.isAOE && proj.aoeRadius) {
          enemiesRef.current.forEach(e => {
            if (Math.sqrt(Math.pow(e.x - proj.x, 2) + Math.pow(e.y - proj.y, 2)) <= proj.aoeRadius!) e.hp -= proj.damage;
          });
        } else { target.hp -= proj.damage; }
        projectilesRef.current.splice(index, 1);
        enemiesRef.current.filter(e => e.hp <= 0).forEach(dead => {
          const eIndex = enemiesRef.current.findIndex(e => e.id === dead.id);
          if (eIndex !== -1) {
            setGameState(prev => ({ ...prev, money: prev.money + Math.floor(ENEMIES[dead.type].reward * (1 + (dead.level - 1) * 0.3)) }));
            enemiesRef.current.splice(eIndex, 1);
          }
        });
      } else {
        proj.x += (dx / dist) * proj.speed * (dt / 16);
        proj.y += (dy / dist) * proj.speed * (dt / 16);
      }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 44;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    PATH.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    SLOTS.forEach(slot => {
      if (towersRef.current.some(t => t.x === slot.x && t.y === slot.y)) return;
      ctx.strokeStyle = selectedTowerType ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(slot.x - 20, slot.y - 20, 40, 40);
    });
    if (selectedInstanceId) {
      const inst = towersRef.current.find(t => t.id === selectedInstanceId);
      if (inst) {
        const stats = getTowerStats(inst);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.setLineDash([8, 4]); ctx.beginPath(); ctx.arc(inst.x, inst.y, stats.range, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.05)'; ctx.fill();
        ctx.strokeStyle = '#3b82f6'; ctx.strokeRect(inst.x - 22, inst.y - 22, 44, 44);
      }
    }
    towersRef.current.forEach(tower => {
      const config = TOWERS[tower.type];
      ctx.fillStyle = '#1e293b'; ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
      ctx.strokeStyle = config.color + '88'; ctx.strokeRect(tower.x - 20, tower.y - 20, 40, 40);
      ctx.fillStyle = config.color; ctx.font = '900 20px "Font Awesome 6 Free"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(config.iconUnicode, tower.x, tower.y);
      for (let i = 0; i < tower.level; i++) {
        ctx.fillStyle = tower.level === 5 ? '#06b6d4' : '#fbbf24';
        ctx.beginPath(); ctx.arc((tower.x - (tower.level - 1) * 3) + i * 6, tower.y - 32, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    });
    enemiesRef.current.forEach(enemy => {
      const isBoss = enemy.type === 'boss'; const barW = isBoss ? 60 : 36;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(enemy.x - barW/2, enemy.y - (isBoss ? 45 : 32), barW, isBoss ? 8 : 6);
      ctx.fillStyle = isBoss ? '#06b6d4' : (enemy.level > 1 ? '#a855f7' : '#ef4444');
      ctx.fillRect(enemy.x - barW/2, enemy.y - (isBoss ? 45 : 32), barW * (enemy.hp / enemy.maxHp), isBoss ? 8 : 6);
      ctx.fillStyle = ENEMIES[enemy.type].color; ctx.beginPath(); ctx.arc(enemy.x, enemy.y, ENEMIES[enemy.type].radius, 0, Math.PI * 2); ctx.fill();
    });
    projectilesRef.current.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); });
  };

  const getMappedCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
    return { 
      x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width), 
      y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height) 
    };
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getMappedCoords(e);
    const clickedTower = towersRef.current.find(t => x >= t.x - 20 && x <= t.x + 20 && y >= t.y - 20 && y <= t.y + 20);
    if (clickedTower) { setSelectedInstanceId(clickedTower.id); setSelectedTowerType(null); return; }
    const clickedSlot = SLOTS.find(s => x >= s.x - 20 && x <= s.x + 20 && y >= s.y - 20 && y <= s.y + 20);
    if (clickedSlot && selectedTowerType && !gameState.isGameOver) {
      const config = TOWERS[selectedTowerType];
      if (!towersRef.current.some(t => t.x === clickedSlot.x && t.y === clickedSlot.y) && gameState.money >= config.cost && gameState.wave >= config.unlockWave) {
        towersRef.current.push({ id: Math.random().toString(36).substr(2, 9), type: selectedTowerType, x: clickedSlot.x, y: clickedSlot.y, level: 1, lastFired: 0, totalInvested: config.cost });
        setGameState(prev => ({ ...prev, money: prev.money - config.cost }));
        setSelectedInstanceId(null);
      }
    } else setSelectedInstanceId(null);
  };

  const upgradeSelected = () => {
    if (!selectedInstanceId) return;
    const tower = towersRef.current.find(t => t.id === selectedInstanceId);
    if (!tower || tower.level >= 5) return;
    const cost = tower.level === 4 ? TOWERS[tower.type].cost * 3 : Math.floor(TOWERS[tower.type].cost * 1.6 * tower.level);
    if (gameState.money >= cost) {
      tower.level += 1; tower.totalInvested += cost;
      setGameState(prev => ({ ...prev, money: prev.money - cost }));
    }
  };

  const sellSelected = () => {
    const idx = towersRef.current.findIndex(t => t.id === selectedInstanceId);
    if (idx === -1) return;
    setGameState(prev => ({ ...prev, money: prev.money + Math.floor(towersRef.current[idx].totalInvested * 0.7) }));
    towersRef.current.splice(idx, 1); setSelectedInstanceId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans mobile-landscape-fix">
      
      {/* Mobile Control Strip - PLACED FIRST FOR LANDSCAPE LEFT ALIGNMENT */}
      <div className="mobile-arsenal-container lg:hidden z-20">
        <div className="flex h-full lg:flex-row flex-col bg-slate-900/95 border-r border-slate-800 p-2 gap-2">
          {/* Static Top Part (Wave Button) in landscape */}
          <button onClick={spawnWave} disabled={waveInProgressRef.current || gameState.isGameOver} 
            className="mobile-wave-btn w-full py-3 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl font-bold text-[10px] shadow-lg active:scale-95 transition-all shrink-0">
            {waveInProgressRef.current ? <i className="fa-solid fa-sync fa-spin"></i> : "OLA"}
          </button>
          
          {/* Scrollable Center Part (Towers) */}
          <div className="flex lg:flex-col gap-2 flex-1 overflow-x-auto lg:overflow-y-auto no-scrollbar scroll-smooth">
            {Object.values(TOWERS).map(tower => {
              const isLocked = gameState.wave < tower.unlockWave;
              const canAfford = gameState.money >= tower.cost;
              return (
                <button key={tower.type} onClick={() => { if (!isLocked) setSelectedTowerType(tower.type); }} disabled={isLocked || !canAfford}
                  className={`shrink-0 w-20 lg:w-full p-2 rounded-xl border flex flex-col items-center transition-all ${selectedTowerType === tower.type ? 'bg-blue-600/40 border-blue-500' : 'bg-slate-800/50 border-slate-700'} ${isLocked || !canAfford ? 'opacity-30 grayscale' : ''}`}>
                  <i className={`fa-solid ${isLocked ? 'fa-lock' : tower.icon} text-base mb-1`} style={{ color: isLocked ? '#475569' : tower.color }}></i>
                  <span className="text-[7px] font-bold font-orbitron truncate w-full text-center uppercase">{isLocked ? 'LOCK' : tower.name.split(' ')[0]}</span>
                  <span className="text-[8px] text-yellow-400 font-bold font-orbitron">₵{tower.cost}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* HUD - Flotante */}
      <div className="lg:hidden absolute top-0 left-0 w-full p-2 flex justify-between items-center z-30 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto ml-20 lg:ml-0 landscape:ml-24">
          <div className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700 shadow-xl">
            <span className="text-yellow-400 font-bold font-orbitron text-xs">₵{gameState.money}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700 shadow-xl">
            <span className="text-blue-400 font-bold font-orbitron text-xs">Ola {gameState.wave}</span>
          </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700 shadow-xl flex gap-1 pointer-events-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < gameState.lives ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-slate-800'}`}></div>
          ))}
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-96 p-6 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl z-10 overflow-y-auto">
        <h1 className="text-2xl font-orbitron font-bold text-blue-400 mb-8"><i className="fa-solid fa-microchip mr-2"></i>NEON GUARD</h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <p className="text-[10px] uppercase text-slate-500">Créditos</p>
            <p className="text-xl font-bold text-yellow-400 font-orbitron">₵ {gameState.money}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <p className="text-[10px] uppercase text-slate-500">Invasión</p>
            <p className="text-xl font-bold text-blue-400 font-orbitron">Ola {gameState.wave}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {Object.values(TOWERS).map(tower => {
            const isLocked = gameState.wave < tower.unlockWave;
            return (
              <button key={tower.type} onClick={() => { if (!isLocked) { setSelectedTowerType(tower.type); setSelectedInstanceId(null); } }} disabled={gameState.money < tower.cost || isLocked}
                className={`w-full p-2.5 rounded-xl border mb-2 flex items-center gap-3 text-left transition-all ${selectedTowerType === tower.type ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-800/30 border-slate-700'} ${isLocked || gameState.money < tower.cost ? 'opacity-40' : ''}`}>
                <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                  <i className={`fa-solid ${isLocked ? 'fa-lock' : tower.icon} text-lg`} style={{ color: isLocked ? '#475569' : tower.color }}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center"><span className="font-bold text-[11px] font-orbitron">{isLocked ? 'BLOQUEADO' : tower.name}</span> {!isLocked && <span className="text-yellow-400 font-bold text-[11px]">₵{tower.cost}</span>}</div>
                  <p className="text-[9px] text-slate-500">{isLocked ? `Ola ${tower.unlockWave}` : tower.description.split(':')[0]}</p>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={spawnWave} disabled={waveInProgressRef.current || gameState.isGameOver} className="mt-6 w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg disabled:opacity-50">
          {waveInProgressRef.current ? "DETECCION..." : "AUTORIZAR OLA"}
        </button>
      </div>

      {/* Game Viewport */}
      <div className="flex-1 relative flex flex-col items-center justify-center lg:p-8 bg-[#020617] overflow-hidden">
        <div className="relative w-full h-full lg:h-auto flex items-center justify-center lg:border-[12px] lg:border-slate-900 lg:rounded-[3rem] bg-slate-950 shadow-inner overflow-hidden">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={handleCanvasClick} onTouchStart={handleCanvasClick}
            className="w-full h-full max-h-[95vh] lg:max-h-none object-contain cursor-crosshair" 
          />
          
          {/* Advice Overlay */}
          <div className="absolute top-12 lg:top-6 right-2 lg:right-6 max-w-[120px] lg:max-w-[180px] bg-slate-900/90 border border-blue-500/20 p-2 rounded-xl backdrop-blur-xl">
            <span className="text-[7px] text-blue-400 font-bold font-orbitron block">AI COMMAND</span>
            <p className="text-[9px] italic leading-tight text-slate-300">{isAdviceLoading ? "..." : advice}</p>
          </div>

          {/* Instance Selection Overlay */}
          {selectedInst && (
            <div className="absolute bottom-1/4 lg:bottom-10 left-1/2 -translate-x-1/2 w-[85%] lg:w-80 bg-slate-900/95 border border-blue-500/40 p-4 rounded-3xl backdrop-blur-2xl z-40 shadow-2xl">
               <div className="flex justify-between mb-3">
                  <h3 className="font-bold text-blue-400 text-xs lg:text-sm font-orbitron">{TOWERS[selectedInst.type].name} (Lvl {selectedInst.level})</h3>
                  <button onClick={() => setSelectedInstanceId(null)} className="text-slate-500"><i className="fa-solid fa-xmark"></i></button>
               </div>
               <p className="text-[9px] text-blue-300 italic mb-4">{getUpgradeDetails(selectedInst)}</p>
               <div className="flex gap-2">
                  <button onClick={upgradeSelected} disabled={selectedInst.level >= 5} className="flex-1 py-3 bg-blue-600 rounded-xl text-[9px] font-bold disabled:bg-slate-800">
                    {selectedInst.level >= 5 ? "MAX" : `MEJORAR ₵${selectedInst.level === 4 ? TOWERS[selectedInst.type].cost * 3 : Math.floor(TOWERS[selectedInst.type].cost * 1.6 * selectedInst.level)}`}
                  </button>
                  <button onClick={sellSelected} className="flex-1 py-3 border border-slate-700 rounded-xl text-[9px] font-bold text-red-400">VENDER</button>
               </div>
            </div>
          )}

          {gameState.isGameOver && (
            <div className="absolute inset-0 bg-slate-950/98 flex flex-col items-center justify-center p-8 z-50">
              <h2 className="text-4xl lg:text-7xl font-orbitron font-bold text-red-600 mb-4 tracking-tighter">SISTEMA CAÍDO</h2>
              <button onClick={() => window.location.reload()} className="px-12 py-4 bg-blue-600 rounded-2xl font-bold font-orbitron">REINICIAR</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Portrait Mobile (default for small screens) */
        @media (max-width: 1024px) {
           .mobile-arsenal-container {
              width: 100%;
              border-top: 1px solid #1e293b;
           }
           .mobile-arsenal-container .flex-col {
              flex-direction: column !important;
           }
           .mobile-arsenal-container .flex-row {
              flex-direction: row !important;
           }
           /* Hide desktop sidebar on mobile */
           .lg\\:flex { display: none; }
        }

        /* Landscape Mobile Specific Fix */
        @media (max-height: 500px) and (max-width: 1024px) {
          .mobile-landscape-fix {
            flex-direction: row !important;
          }
          .mobile-arsenal-container {
            width: 80px !important;
            height: 100% !important;
            border-top: 0 !important;
            border-right: 1px solid #1e293b !important;
            order: -1 !important; /* Move to the left */
          }
          .mobile-arsenal-container > div {
            flex-direction: column !important;
            padding: 4px !important;
          }
          /* Wave button stays visible at the top or bottom */
          .mobile-wave-btn {
            order: 2 !important; /* Bottom position for wave button in landscape left strip */
            margin-top: auto;
          }
          .mobile-arsenal-container .overflow-x-auto {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            flex-direction: column !important;
            height: auto !important;
            width: 100% !important;
          }
          .mobile-arsenal-container button {
            width: 100% !important;
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
