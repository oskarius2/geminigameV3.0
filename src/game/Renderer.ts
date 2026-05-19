import { GameState, Entity, EntityType, ItemType, EnemyType } from './types';
import {
  getCampaignLevel,
  catmullRom,
  waypointToWorld,
  activeWaypointIndex,
  samplePath,
  samplePathTangent,
  PathWaypoint,
  PORTAL_TRIGGER_RADIUS,
} from './content/campaignLevels';
import {
  getCombatDensityTier,
  shouldDrawEnemyTrails,
  shouldDrawPlexusLinks,
} from './balance/combatDensity';

export function render(ctx: CanvasRenderingContext2D, state: GameState, screenWidth: number, screenHeight: number, options: { isMobile?: boolean; debug?: boolean } = {}) {
  // Ensure screen dimensions are finite to avoid canvas errors
  const safeScreenWidth = Number.isFinite(screenWidth) && screenWidth > 0 ? screenWidth : 800;
  const safeScreenHeight = Number.isFinite(screenHeight) && screenHeight > 0 ? screenHeight : 600;

  const { isMobile = false, debug = false } = options;
  const { camera } = state;
  const densityTier = getCombatDensityTier(state.enemies.length);
  const cullMargin = state.qualityLevel === 'low' ? 50 : 200;
  
  // Helper to safely create radial gradients
  const createSafeRadialGradient = (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
    if (![x0, y0, r0, x1, y1, r1].every(v => Number.isFinite(v))) {
      return null;
    }
    // Radius must be non-negative
    const safeR0 = Math.max(0, r0);
    const safeR1 = Math.max(0, r1);
    try {
      return ctx.createRadialGradient(x0, y0, safeR0, x1, y1, safeR1);
    } catch (e) {
      return null;
    }
  };

  // Helper to safely create linear gradients
  const createSafeLinearGradient = (x0: number, y0: number, x1: number, y1: number) => {
    if (![x0, y0, x1, y1].every(v => Number.isFinite(v))) {
      return null;
    }
    try {
      return ctx.createLinearGradient(x0, y0, x1, y1);
    } catch (e) {
      return null;
    }
  };

  // Glitch effect for hitStop and Screenshake
  let offsetX = 0;
  let offsetY = 0;
  
  const screenshake = state.screenshake || 0;
  if (!isMobile && Number.isFinite(screenshake) && screenshake > 0.5) {
    offsetX = (Math.random() - 0.5) * screenshake * 2;
    offsetY = (Math.random() - 0.5) * screenshake * 2;
  }
  
  const ctxScreenFlash = state.screenFlash || 0;

  // Dynamic background colors per stage (boss arena overrides theme)
  let stageThemeIndex = Math.min(Math.max(state.stage - 1, 0), 4);
  if (state.bossActive && state.activeBossId) {
    const bossThemes: Record<string, number> = {
      salvage_hauler: 0,
      hive_regent: 3,
      void_cardinal: 1,
      crimson_tyrant: 2,
      colossus: 2,
      hive_queen: 3,
      wraith_lord: 1,
    };
    const override = bossThemes[state.activeBossId];
    if (override !== undefined) stageThemeIndex = override;
  }
  const themes = [
    { center: '#020617', edge: '#000000', sunRaw: '255, 241, 202', sunGlow: '251, 191, 36' }, // 1: Dark Slate
    { center: '#1a0b1c', edge: '#05000a', sunRaw: '240, 150, 255', sunGlow: '200, 50, 255' }, // 2: Purple / Void
    { center: '#1c0b0b', edge: '#050000', sunRaw: '255, 100, 100', sunGlow: '255, 0, 0' }, // 3: Crimson / Blood
    { center: '#0b1c11', edge: '#000501', sunRaw: '150, 255, 150', sunGlow: '0, 255, 50' }, // 4: Toxic Green
    { center: '#1c1c11', edge: '#050500', sunRaw: '255, 255, 150', sunGlow: '255, 255, 0' }, // 5+: Cosmic Gold
  ];
  const theme = themes[stageThemeIndex];

  // Clear && Deep Space Background (drawn BEFORE any transforms to save fill-rate)
  const bgGrad = createSafeRadialGradient(
    safeScreenWidth / 2, 
    safeScreenHeight / 2, 
    0, 
    safeScreenWidth / 2, 
    safeScreenHeight / 2, 
    Math.max(safeScreenWidth, safeScreenHeight)
  );

  if (bgGrad) {
    bgGrad.addColorStop(0, theme.center); 
    bgGrad.addColorStop(1, theme.edge); 
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = theme.center;
  }
  ctx.fillRect(0, 0, safeScreenWidth, safeScreenHeight);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  const zoom = state.campaignZoom ?? 0.5;
  const width = safeScreenWidth / zoom;
  const height = safeScreenHeight / zoom;

  ctx.scale(zoom, zoom);

  // Campaign: rotate world around screen center to align path tangent upward
  if (state.campaignCameraAngle !== null && state.campaignCameraAngle !== undefined) {
    const cx = safeScreenWidth / 2 / zoom;
    const cy = safeScreenHeight / 2 / zoom;
    ctx.translate(cx, cy);
    ctx.rotate(-(state.campaignCameraAngle));
    ctx.translate(-cx, -cy);
  }

  // Campaign: clip all world rendering to corridor polygon — dark background shows outside
  if (state.gameMode === 'CAMPAIGN' && state.campaignLevelId) {
    const clipLevel = getCampaignLevel(state.campaignLevelId);
    if (clipLevel) {
      const ww = state.world.width, wh = state.world.height;
      const hw = clipLevel.corridorHalfWidth;
      const CLIP_STEPS = 60;
      const leftPts: { x: number; y: number }[] = [];
      const rightPts: { x: number; y: number }[] = [];
      for (let s = 0; s <= CLIP_STEPS; s++) {
        const t = s / CLIP_STEPS;
        const wp = samplePath(clipLevel, t, ww, wh);
        const tang = samplePathTangent(clipLevel, t, ww, wh);
        const nx = -tang.y, ny = tang.x;
        leftPts.push({ x: wp.x - camera.x + nx * hw, y: wp.y - camera.y + ny * hw });
        rightPts.push({ x: wp.x - camera.x - nx * hw, y: wp.y - camera.y - ny * hw });
      }
      ctx.beginPath();
      leftPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      rightPts.slice().reverse().forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.clip();
    }
  }

  // --- MAP / BACKGROUND RENDERING ---
  
  // 1. Distant Orientation Marker (Large Sun/Planet)
  ctx.save();
  const sunX = (state.world.width * 0.8 - camera.x * 0.05 + state.world.width) % state.world.width;
  const sunY = (state.world.height * 0.2 - camera.y * 0.05 + state.world.height) % state.world.height;
  if (sunX > -500 && sunX < width + 500 && sunY > -500 && sunY < height + 500) {
    const g = createSafeRadialGradient(sunX, sunY, 0, sunX, sunY, 400);
    if (g) {
      g.addColorStop(0, `rgba(${theme.sunRaw}, 0.4)`);
      g.addColorStop(0.2, `rgba(${theme.sunGlow}, 0.1)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 400, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 1b. Nebula Dust (Deep Background Layers)
  {
    const nebulaSeed = 1337;
    for (let i = 0; i < (isMobile ? 8 : 12); i++) {
        const time = Date.now() / (30000 + i * 5000);
        const x = (Math.sin(i * 1234.5 + nebulaSeed) * 5000 + state.world.width) % state.world.width;
        const y = (Math.cos(i * 5678.9 + nebulaSeed) * 5000 + state.world.height) % state.world.height;
        const p = 0.02 * (i + 1);
        const dx = (x - camera.x * p + state.world.width) % state.world.width;
        const dy = (y - camera.y * p + state.world.height) % state.world.height;
        
        const g = createSafeRadialGradient(dx, dy, 0, dx, dy, 800 + i * 200);
        if (g) {
          const opacity = 0.04 - (i * 0.005);
          if (i === 0) g.addColorStop(0, `rgba(6, 182, 212, ${opacity})`);
          else if (i === 1) g.addColorStop(0, `rgba(217, 70, 239, ${opacity})`);
          else g.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.fillRect(dx - 1000, dy - 1000, 2000, 2000);
        }
    }
  }

  // 2. Parallax Starfield
  const starSeed = 999;
  const layers = [
    { count: isMobile ? 200 : 300, parallax: 0.1, size: isMobile ? 2.5 : 1,   alpha: isMobile ? 0.6 : 0.3, color: '#94a3b8' },
    { count: isMobile ? 120 : 180, parallax: 0.2, size: isMobile ? 3   : 1.5, alpha: isMobile ? 0.7 : 0.5, color: '#f1f5f9' },
    { count: isMobile ? 60 : 90, parallax: 0.4, size: 2.5, alpha: 0.8, color: '#6de4ff' },
  ];

  layers.forEach((layer, layerIdx) => {
    ctx.fillStyle = layer.color;
    for (let i = 0; i < layer.count; i++) {
        const hash = Math.sin(layerIdx * 100 + i * 123.4) * 10000;
        const x = Math.abs(hash * 423.5) % state.world.width;
        const y = Math.abs(hash * 872.1) % state.world.height;
        
        const dx = ((x - camera.x * layer.parallax) % width + width) % width;
        const dy = ((y - camera.y * layer.parallax) % height + height) % height;
        
        ctx.globalAlpha = layer.alpha * (0.8 + Math.sin(Date.now()/500 + i) * 0.2);
ctx.fillRect(dx, dy, layer.size / zoom, layer.size / zoom);

        if (!isMobile && layer.size > 2 && i % 10 === 0) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = layer.color;
            ctx.fillRect(dx, dy, layer.size / zoom, layer.size / zoom);
            ctx.shadowBlur = 0;
        }
    }
  });
  ctx.globalAlpha = 1;

  // 2b. Space Dust (Fast particles for speed perception)
  const dustCount = isMobile ? 40 : 120;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i < dustCount; i++) {
    const time = Date.now() / 1000;
    const hash = Math.sin(i * 1234.5) * 10000;
    const x = (Math.abs(hash * 423.5) + time * 100) % state.world.width;
    const y = (Math.abs(hash * 872.1) + time * 50) % state.world.height;
    const p = 0.8;
    const dx = (x - camera.x * p + state.world.width) % state.world.width;
    const dy = (y - camera.y * p + state.world.height) % state.world.height;
    if (dx > 0 && dx < width && dy > 0 && dy < height) {
      ctx.fillRect(dx, dy, 12, 1); // Long specs
    }
  }

  // 3. World Grid (Arena Floor) - Improved with subtle circuit lines
  const gridSize = 400;
  const startX = -(camera.x % gridSize);
  const startY = -(camera.y % gridSize);

  // Floor Grid
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
  ctx.lineWidth = 1;
  for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = startY - gridSize; y < height + gridSize; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Cross markers at intersections
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
  for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
    for (let y = startY - gridSize; y < height + gridSize; y += gridSize) {
      if ((Math.floor((x + camera.x)/gridSize) + Math.floor((y + camera.y)/gridSize)) % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
        ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
        ctx.stroke();
      }
    }
  }

  // Neon Circuit Decor
  ctx.lineWidth = 1.5;
  for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
    for (let y = startY - gridSize; y < height + gridSize; y += gridSize) {
      const wx = Math.floor((x + camera.x) / gridSize);
      const wy = Math.floor((y + camera.y) / gridSize);
      const seed = Math.abs(Math.sin(wx * 37.1 + wy * 19.4)) * 1000;
      const r = seed - Math.floor(seed);
      
      if (r > 0.92) {
        ctx.strokeStyle = r > 0.96 ? 'rgba(217, 70, 239, 0.2)' : 'rgba(6, 182, 212, 0.2)';
        ctx.strokeRect(x + 40, y + 40, gridSize - 80, gridSize - 80);
        ctx.beginPath();
        ctx.moveTo(x + 40, y + 40); ctx.lineTo(x + 20, y + 20);
        ctx.moveTo(x + gridSize - 40, y + 40); ctx.lineTo(x + gridSize - 20, y + 20);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // 4. World Bounds / Neural Mesh Wall
  const worldScreenX = -camera.x;
  const worldScreenY = -camera.y;
  ctx.save();
  // Multi-layered boundary
  const time = Date.now() / 1000;
  
  // Inner glow
  ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + Math.sin(time * 2) * 0.1})`;
  ctx.lineWidth = 12;
  if (!isMobile) {
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
  }
  ctx.strokeRect(worldScreenX, worldScreenY, state.world.width, state.world.height);
  
  // Scanning line effect on walls
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  const scanPos = (time * 200) % state.world.height;
  ctx.beginPath();
  ctx.moveTo(worldScreenX, worldScreenY + scanPos);
  ctx.lineTo(worldScreenX + state.world.width, worldScreenY + scanPos);
  ctx.stroke();
  
  ctx.restore();

  // Draw Vignette / Scanlines

  // Render Obstacles
  state.obstacles.forEach(obs => {
    const drawX = obs.pos.x - camera.x;
    const drawY = obs.pos.y - camera.y;

    if (
      drawX < -Math.max(obs.size.x, obs.size.y) || 
      drawX > width + Math.max(obs.size.x, obs.size.y) || 
      drawY < -Math.max(obs.size.x, obs.size.y) || 
      drawY > height + Math.max(obs.size.x, obs.size.y)
    ) return;

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(obs.rotation);
    ctx.fillStyle = obs.color;
    
    // Landmark specific glow
    if ((obs as any).isLandmark) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = obs.color;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
    }

    if (obs.type === 'RECT') {
      ctx.fillRect(-obs.size.x / 2, -obs.size.y / 2, obs.size.x, obs.size.y);
      if (!(obs as any).isLandmark) ctx.strokeRect(-obs.size.x / 2, -obs.size.y / 2, obs.size.x, obs.size.y);
      
      // Cyber pattern on rects
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.05)';
      ctx.beginPath();
      ctx.moveTo(-obs.size.x / 2, -obs.size.y / 2);
      ctx.lineTo(obs.size.x / 2, obs.size.y / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, obs.size.x, 0, Math.PI * 2);
      ctx.fill();
      if (!(obs as any).isLandmark) ctx.stroke();

      // Cyber pattern on circles
      ctx.beginPath();
      ctx.arc(0, 0, obs.size.x * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.05)';
      ctx.stroke();
    }

    ctx.restore();
  });

  // --- Campaign Path + Portal ---
  if (state.gameMode === 'CAMPAIGN' && state.campaignLevelId) {
    const level = getCampaignLevel(state.campaignLevelId);
    if (level && level.path.length >= 2) {
      const now = Date.now() / 1000;
      const ww = state.world.width;
      const wh = state.world.height;
      const pts = level.path;

      // Progress: how far player has cleared (0–1)
      const progress = Math.max(0, 1 - state.enemiesToKill / level.enemiesToKill);
      const clearedUpTo = activeWaypointIndex(level, state.enemiesToKill);
      const portalOpen = state.enemiesToKill <= 0 && !state.bossActive;

      // Helper: world→screen
      const wx = (wp: PathWaypoint) => wp.x * ww - camera.x;
      const wy = (wp: PathWaypoint) => wp.y * wh - camera.y;

      // Build full spline point list (Catmull-Rom, ~8 samples per segment)
      const SAMPLES = 8;
      const splinePoints: { x: number; y: number; t: number }[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (let s = 0; s < SAMPLES; s++) {
          const t = s / SAMPLES;
          const sp = catmullRom(p0, p1, p2, p3, t);
          const globalT = (i + t) / (pts.length - 1);
          splinePoints.push({ x: sp.x * ww - camera.x, y: sp.y * wh - camera.y, t: globalT });
        }
      }
      // Add final point
      const last = pts[pts.length - 1];
      splinePoints.push({ x: last.x * ww - camera.x, y: last.y * wh - camera.y, t: 1 });

      ctx.save();

      // 1. Uncleared path — dim dashed line
      ctx.setLineDash([24, 16]);
      ctx.lineDashOffset = -(now * 40) % 40; // slow animated march
      ctx.lineWidth = isMobile ? 5 : 3;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.beginPath();
      splinePoints.forEach((p, i) => {
        if (p.t < progress) return; // skip cleared section
        i === 0 || splinePoints[i - 1].t < progress
          ? ctx.moveTo(p.x, p.y)
          : ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // 2. Cleared path — bright solid trail behind player
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.lineWidth = isMobile ? 6 : 4;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
      ctx.shadowBlur = isMobile ? 0 : 10;
      ctx.shadowColor = 'rgba(34, 211, 238, 0.4)';
      ctx.beginPath();
      let clearedStarted = false;
      splinePoints.forEach((p) => {
        if (p.t > progress) return;
        if (!clearedStarted) { ctx.moveTo(p.x, p.y); clearedStarted = true; }
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Waypoint dots
      pts.forEach((wp, i) => {
        if (i === pts.length - 1) return; // skip portal (drawn separately)
        const sx = wx(wp);
        const sy = wy(wp);
        if (sx < -cullMargin || sx > width + cullMargin || sy < -cullMargin || sy > height + cullMargin) return;
        const cleared = i < clearedUpTo;
        ctx.beginPath();
        ctx.arc(sx, sy, isMobile ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle = cleared ? 'rgba(34, 211, 238, 0.7)' : 'rgba(148, 163, 184, 0.25)';
        ctx.fill();
      });

      // 4. Portal
      const portal = level.portalPos;
      const px = portal.x * ww - camera.x;
      const py = portal.y * wh - camera.y;
      if (px > -400 && px < width + 400 && py > -400 && py < height + 400) {
        const pulse = 0.7 + Math.sin(now * 3) * 0.3;
        const outerR = PORTAL_TRIGGER_RADIUS * 0.9;

        if (portalOpen) {
          // Open: bright cyan with strong glow
          ctx.globalCompositeOperation = 'lighter';
          const portalGrad = createSafeRadialGradient(px, py, 0, px, py, outerR);
          if (portalGrad) {
            portalGrad.addColorStop(0, `rgba(34, 211, 238, ${0.35 * pulse})`);
            portalGrad.addColorStop(0.5, `rgba(6, 182, 212, ${0.15 * pulse})`);
            portalGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = portalGrad;
            ctx.beginPath();
            ctx.arc(px, py, outerR, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
          // Outer ring
          ctx.beginPath();
          ctx.arc(px, py, outerR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${0.8 * pulse})`;
          ctx.lineWidth = isMobile ? 5 : 3;
          ctx.setLineDash([]);
          ctx.shadowBlur = isMobile ? 0 : 24;
          ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
          ctx.stroke();
          ctx.shadowBlur = 0;
          // Inner ring
          ctx.beginPath();
          ctx.arc(px, py, outerR * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pulse);
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
          ctx.lineWidth = isMobile ? 4 : 2;
          ctx.stroke();
          // Label
          ctx.font = `bold ${isMobile ? 20 : 14}px monospace`;
          ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
          ctx.textAlign = 'center';
          ctx.fillText('[ ENTER ]', px, py + outerR + (isMobile ? 28 : 20));
        } else {
          // Locked: dim, no glow
          ctx.beginPath();
          ctx.arc(px, py, outerR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = isMobile ? 4 : 2;
          ctx.setLineDash([12, 10]);
          ctx.stroke();
          ctx.setLineDash([]);
          // Enemies remaining label
          if (state.enemiesToKill > 0) {
            ctx.font = `bold ${isMobile ? 18 : 12}px monospace`;
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText(`${state.enemiesToKill} remaining`, px, py + outerR + (isMobile ? 26 : 18));
          }
        }
        ctx.textAlign = 'left';
      }

      // 5. Corridor walls — parallel lines offset ±corridorHalfWidth from path
      {
        const hw = level.corridorHalfWidth;
        const WALL_STEPS = 60;
        const leftPts: { x: number; y: number }[] = [];
        const rightPts: { x: number; y: number }[] = [];
        for (let s = 0; s <= WALL_STEPS; s++) {
          const t = s / WALL_STEPS;
          const wp = samplePath(level, t, ww, wh);
          const tang = samplePathTangent(level, t, ww, wh);
          const nx = -tang.y;
          const ny = tang.x;
          leftPts.push({ x: wp.x - camera.x + nx * hw, y: wp.y - camera.y + ny * hw });
          rightPts.push({ x: wp.x - camera.x - nx * hw, y: wp.y - camera.y - ny * hw });
        }

        const drawWall = (pts: { x: number; y: number }[]) => {
          ctx.beginPath();
          pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.stroke();
        };

        ctx.setLineDash([]);
        ctx.lineWidth = isMobile ? 4 : 2;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.shadowBlur = isMobile ? 0 : 8;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        drawWall(leftPts);
        drawWall(rightPts);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }

  // Render Hazards
  state.hazards.forEach(h => {
    const drawX = h.pos.x - camera.x;
    const drawY = h.pos.y - camera.y;

    if (
      drawX < -cullMargin || drawX > width + cullMargin || drawY < -cullMargin || drawY > height + cullMargin
    ) return;

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(h.rotation);
    
    // Style based on active/inactive
    ctx.strokeStyle = h.active ? h.color : 'rgba(255,255,255,0.1)';
    ctx.fillStyle = h.active ? h.color : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 4;
    
    if (h.type === 'LASER') {
        // Laser is a line
        ctx.beginPath();
        ctx.moveTo(-h.size.x/2, 0);
        ctx.lineTo(h.size.x/2, 0);
        ctx.stroke();
        if (h.active) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = h.color;
        }
    } else if (h.type === 'ZONE') {
        // Zone is a rectangle
        ctx.beginPath();
        ctx.rect(-h.size.x/2, -h.size.y/2, h.size.x, h.size.y);
        ctx.stroke();
        ctx.fill();
    }
    
    ctx.restore();
  });

  // Render Items (with culling)
  state.items.forEach(item => {
    const drawX = item.pos.x - camera.x;
    const drawY = item.pos.y - camera.y;

    if (drawX < -25 || drawX > width + 25 || drawY < -25 || drawY > height + 25) return;

    const time = Date.now() / 400;
    const bounce = Math.sin(time + item.id.length) * 4;
    const size = item.radius * (isMobile ? 1.5 : 1); // Make items slightly bigger on mobile

    // Rarity determination
    if (item.itemType === ItemType.XP) {
      ctx.save();
      ctx.translate(drawX, drawY + bounce);
      if (!isMobile) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#22d3ee';
      }
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const isLegendary = [ItemType.MULTISHOT, ItemType.OVERDRIVE, ItemType.SHIELD, ItemType.RAPID_FIRE, ItemType.TIME_SLOW, ItemType.PIERCING].includes(item.itemType!);
    const isRare = [ItemType.BOMB, ItemType.MAGNET, ItemType.SCORE_MULTIPLIER].includes(item.itemType!);

    ctx.save();
    ctx.translate(drawX, drawY + bounce);
    
    if (isLegendary) {
      // Pulsing Star shape
      const rot = time;
      ctx.rotate(rot);
      if (!isMobile) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = item.color;
      }
      ctx.fillStyle = item.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const x = Math.cos(ang) * size * 1.6;
        const y = Math.sin(ang) * size * 1.6;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        const ang2 = ang + (Math.PI * 2) / 10;
        ctx.lineTo(Math.cos(ang2) * size * 0.8, Math.sin(ang2) * size * 0.8);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (isRare) {
      // Rotating Diamond
      ctx.rotate(time * 1.5);
      if (!isMobile) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = item.color;
      }
      ctx.fillStyle = item.color;
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
    } else {
      // Common Hexagon
      ctx.rotate(time * 0.5);
      if (!isMobile) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = item.color;
      }
      ctx.fillStyle = item.color;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const x = Math.cos(ang) * size;
        const y = Math.sin(ang) * size;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();
    }
    
    ctx.restore();
    if (!isMobile) {
      ctx.shadowBlur = 0;
    }
    
    // Draw Emojis
    const emojiMap: Record<string, string> = {
      [ItemType.HEALTH]: '❤️',
      [ItemType.ENERGY]: '⚡',
      [ItemType.SCORE]: '⭐',
      [ItemType.MULTISHOT]: '🔷',
      [ItemType.OVERDRIVE]: '💥',
      [ItemType.SHIELD]: '🛡️',
      [ItemType.MAGNET]: '🧲',
      [ItemType.SCORE_MULTIPLIER]: '💯',
      [ItemType.BOMB]: '💣',
      [ItemType.RAPID_FIRE]: '🔥',
      [ItemType.TIME_SLOW]: '⏰',
      [ItemType.PIERCING]: '🎯',
    };
    const emoji = item.itemType ? emojiMap[item.itemType] : '🎁';
    ctx.font = `${Math.round(isMobile ? 22 : 16 / zoom)}px sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, drawX, drawY + bounce);

  });

  // Render Particles (with culling)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; 
  state.particles.forEach(p => {
    const drawX = p.pos.x - camera.x;
    const drawY = p.pos.y - camera.y;

    if (drawX < -cullMargin || drawX > width + cullMargin || drawY < -cullMargin || drawY > height + cullMargin) return;

    const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = lifeRatio;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;

    if (p.particleType === 'ring') {
      ctx.beginPath();
      ctx.lineWidth = (isMobile ? 6 : 4) * lifeRatio;
      ctx.arc(drawX, drawY, Math.max(0, (isMobile ? p.size * 1.5 : p.size) * (1 - lifeRatio + 0.2)), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.particleType === 'streak') {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.5, (isMobile ? p.size * 1.5 : p.size) * Math.min(1, lifeRatio * 1.5));
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX - p.velocity.x * 2.5 * lifeRatio, drawY - p.velocity.y * 2.5 * lifeRatio);
      ctx.stroke();
    } else if (p.particleType === 'spark') {
      ctx.beginPath();
      ctx.lineWidth = Math.max(0, (isMobile ? p.size * 1.5 : p.size) * lifeRatio);
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX - p.velocity.x * 2 * lifeRatio, drawY - p.velocity.y * 2 * lifeRatio);
      ctx.stroke();
    } else if (p.particleType === 'flash') {
      ctx.beginPath();
      if (!isMobile) {
        ctx.shadowBlur = p.size;
        ctx.shadowColor = p.color;
      }
      ctx.arc(drawX, drawY, Math.max(0, (isMobile ? p.size * 1.5 : p.size) * lifeRatio * 0.5), 0, Math.PI * 2);
      ctx.fill();
      if (!isMobile) {
        ctx.shadowBlur = 0;
      }
    } else if (p.particleType === 'cross') {
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(p.life * 2);
      ctx.beginPath();
      ctx.lineWidth = (isMobile ? 3 : 2) * lifeRatio;
      const extent = Math.max(0, (isMobile ? p.size * 1.5 : p.size) * Math.pow(lifeRatio, 0.5));
      ctx.moveTo(-extent, 0);
      ctx.lineTo(extent, 0);
      ctx.moveTo(0, -extent);
      ctx.lineTo(0, extent);
      
      // Add diagonal cross too
      ctx.moveTo(-extent * 0.5, -extent * 0.5);
      ctx.lineTo(extent * 0.5, extent * 0.5);
      ctx.moveTo(-extent * 0.5, extent * 0.5);
      ctx.lineTo(extent * 0.5, -extent * 0.5);
      
      ctx.stroke();
      ctx.restore();
    } else if (p.particleType === 'dot') {
      ctx.beginPath();
      const radius = Math.max(0, (isMobile ? p.size * 1.5 : p.size) * (1 - lifeRatio));
      const g = createSafeRadialGradient(drawX, drawY, 0, drawX, drawY, radius);
      if (g) {
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Very simple particle fallback - no shadows for performance
      ctx.beginPath();
      ctx.arc(drawX, drawY, Math.max(0, ((isMobile ? p.size * 1.5 : p.size) / 2) * lifeRatio), 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // Render Projectiles (with culling)
  state.projectiles.forEach(p => {
    const drawX = p.pos.x - camera.x;
    const drawY = p.pos.y - camera.y;

    if (drawX < -cullMargin || drawX > width + cullMargin || drawY < -cullMargin || drawY > height + cullMargin) return;

    const velLen = Math.max(p.velocity.magnitude(), 0.001);
    const isRocket = p.itemType === ItemType.BOMB;
    const trailLen = isRocket ? 35 : p.radius > 8 ? 25 : 18;
    const time = Date.now() / 100;

    // Enemy projectile danger zone (Higher visibility)
    if (p.ownerId !== 'player') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(drawX, drawY, p.radius * 5.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 20, 0, 0.25)'; // Neon Red-Orange Glow
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 60, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]); // Sharper dash
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    // Energetic trail
    const grad = createSafeLinearGradient(drawX, drawY, drawX - (p.velocity.x / velLen) * trailLen, drawY - (p.velocity.y / velLen) * trailLen);
    if (grad) {
      grad.addColorStop(0, p.color || '#fef08a');
      grad.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = grad;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = isRocket ? p.radius * 2.5 : p.radius * 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(
        drawX - (p.velocity.x / velLen) * trailLen,
        drawY - (p.velocity.y / velLen) * trailLen
      );
      ctx.stroke();
    }
    ctx.restore();

    ctx.globalAlpha = 1.0;

    // Bullet core
    ctx.save();
    ctx.fillStyle = p.color || '#ffffff';
    if (!isMobile) {
      ctx.shadowBlur = isRocket ? 30 : 20;
      ctx.shadowColor = p.color || '#fef08a';
    }
    ctx.beginPath();
    ctx.arc(drawX, drawY, p.radius * (1 + Math.sin(time) * 0.1), 0, Math.PI * 2);
    ctx.fill();
    
    // Pulsing inner core
    ctx.fillStyle = p.ownerId !== 'player' ? '#fff1f1' : '#f0ffff';
    ctx.beginPath();
    ctx.arc(drawX, drawY, p.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // --- Nano Plexus Links between enemies (Optimized and Throttled) ---
  if (!isMobile && shouldDrawPlexusLinks(state.enemies.length, densityTier)) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Performance: Draw fewer links in higher density
    const maxLinkDist = state.enemies.length > 80 ? 60 : 100;
    const maxLinksPerEntity = state.enemies.length > 80 ? 2 : 4;
    
    const plexusGrid: Record<string, number[]> = {};
    const pSize = 100;
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      const gx = Math.floor(e.pos.x / pSize);
      const gy = Math.floor(e.pos.y / pSize);
      const key = `${gx},${gy}`;
      if (!plexusGrid[key]) plexusGrid[key] = [];
      plexusGrid[key].push(i);
    }

    for (let i = 0; i < state.enemies.length; i++) {
      const e1 = state.enemies[i];
      const gx = Math.floor(e1.pos.x / pSize);
      const gy = Math.floor(e1.pos.y / pSize);
      
      let linksCount = 0;
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const key = `${gx + ox},${gy + oy}`;
          const cell = plexusGrid[key];
          if (cell) {
            for (const j of cell) {
              if (j <= i) continue;
              if (linksCount >= maxLinksPerEntity) break;

              const e2 = state.enemies[j];
              const distSq = e1.pos.distanceToSq(e2.pos);
              if (distSq < maxLinkDist * maxLinkDist) {
                const dist = Math.sqrt(distSq);
                const alpha = 1 - (dist / maxLinkDist);
                ctx.beginPath();
                ctx.moveTo(e1.pos.x - camera.x, e1.pos.y - camera.y);
                ctx.lineTo(e2.pos.x - camera.x, e2.pos.y - camera.y);
                ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * 0.25})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                linksCount++;
              }
            }
          }
        }
      }
    }
    ctx.restore();
  }

  // Render Enemies
  state.enemies.forEach(e => {
    const drawX = e.pos.x - camera.x;
    const drawY = e.pos.y - camera.y;

    if (drawX < -50 || drawX > width + 50 || drawY < -50 || drawY > height + 50) return;

    // Enemy Trail
    const eVelLen = e.velocity.magnitude();
    if (shouldDrawEnemyTrails(densityTier) && eVelLen > 0.1) {
      ctx.strokeStyle = e.color;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = e.radius;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX - (e.velocity.x / eVelLen) * 20, drawY - (e.velocity.y / eVelLen) * 20);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    
    // Danger Zones for large enemies
    if (e.enemyType === EnemyType.BOSS || e.enemyType === EnemyType.ELITE || e.enemyType === EnemyType.TANK || e.enemyType === EnemyType.NOVA || e.enemyType === EnemyType.FORTIFIED) {
      ctx.save();
      ctx.translate(drawX, drawY);
      const pulse = 1 + Math.sin(Date.now() / 200 + e.id.length) * 0.1;
      const ringRadius = e.radius * 2.5 * pulse;
      const hue = e.enemyType === EnemyType.BOSS ? 0 : 20;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (e.enemyType === EnemyType.BOSS) {
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(0, 100%, 50%, 0.6)`;
        ctx.stroke();
      }
      // Colossus telegraph: expanding warning ring during windup
      if (e.enemyType === EnemyType.BOSS && state.activeBossId === 'colossus' && e.aiState === 'windup' && (e.aiTimer ?? 0) > 0) {
        const windupProgress = 1 - Math.min(1, (e.aiTimer ?? 0) / 70);
        const warnR = e.radius * (1.5 + windupProgress * 4);
        const warnAlpha = 0.15 + windupProgress * 0.55;
        ctx.beginPath();
        ctx.arc(0, 0, warnR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 60, 0, ${warnAlpha})`;
        ctx.lineWidth = 3 + windupProgress * 5;
        ctx.stroke();
        // Inner pulse ring
        ctx.beginPath();
        ctx.arc(0, 0, warnR * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 200, 0, ${warnAlpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Broken animations (jagged, jerky movements)
    let jitterX = 0;
    let jitterY = 0;
    if (e.enemyType === EnemyType.SWARMER || e.enemyType === EnemyType.SPLINTER || e.enemyType === EnemyType.WRAITH) {
        // Pseudo-random jitter based on time and ID
        if (Math.sin(Date.now() / 50 + e.id.length) > 0.5) {
            jitterX = (Math.random() - 0.5) * 4;
            jitterY = (Math.random() - 0.5) * 4;
        }
    }

    // Body
    ctx.save();
    ctx.translate(drawX + jitterX, drawY + jitterY);
    
    // Squash and stretch / Wobble on hit (Subtle)
    const hitWobble = e.hitTimer && e.hitTimer > 0 ? Math.sin(e.hitTimer * 5) * 0.1 : 0;
    const scaleX = 1 + hitWobble;
    const scaleY = 1 - hitWobble;
    ctx.scale(scaleX, scaleY);

    // Simplified fill for better performance
    const hitIntensity = e.hitTimer && e.hitTimer > 0 ? e.hitTimer / 10 : 0;
    
    if (isMobile) {
      ctx.fillStyle = hitIntensity > 0 ? '#ffffff' : e.color;
    } else {
      const grad = createSafeRadialGradient(0, 0, 0, 0, 0, e.radius * 1.5);
      if (grad) {
        if (hitIntensity > 0) {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(1, 'transparent');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.2, e.color);
          grad.addColorStop(1, '#000000');
        }
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = e.color;
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    
    // Reduced shadow overhead for performance
    const useShadows = !isMobile && state.enemies.length < 100;
    if (useShadows) {
      ctx.shadowColor = e.color;
      ctx.shadowBlur = (e.enemyType === EnemyType.BOSS ? 30 : 15) * (e.hitTimer && e.hitTimer > 0 ? 2 : 1);
    }
    
    const time = Date.now() / 500;
    const idleWobble = Math.sin(time + e.id.length) * 2;
    const radius = Math.max(2, (e.radius * 1.5) + idleWobble); // Ensure positive radius

    switch (e.enemyType) {
      case EnemyType.PHALANX:
        // Phalanx: Heavy Shielded Block
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI * 2) / 6 + time * 0.1;
          const px = Math.cos(ang) * radius;
          const py = Math.sin(ang) * radius;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Frontal Shield Arc
        const faceAngle = Math.atan2(e.velocity.y, e.velocity.x);
        ctx.save();
        ctx.rotate(faceAngle - time * 0.2); // Counter-rotation relative to body if needed, or just follow face
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, -Math.PI / 3, Math.PI / 3);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.2;
        ctx.stroke();
        ctx.restore();
        break;

      case EnemyType.SNIPER:
        // Sniper: Sharp-edged, threatening
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI * 2) / 4 + time * 0.5;
          const px = Math.cos(ang) * radius * (i % 2 === 0 ? 1.5 : 0.8);
          const py = Math.sin(ang) * radius * (i % 2 === 0 ? 1.5 : 0.8);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        break;

      case EnemyType.WRAITH:
        // Wraith: Flickering Ghost
        const wraithAlpha = 0.3 + Math.sin(time * 8) * 0.3;
        ctx.globalAlpha = wraithAlpha;
        ctx.rotate(time * 1.5);
        ctx.beginPath();
        ctx.moveTo(radius * 1.5, 0);
        ctx.lineTo(-radius, -radius * 0.8);
        ctx.lineTo(-radius, radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        break;

      case EnemyType.NOVA:
        // Nova: Pulsating Core
        const novaPulse = 1 + Math.sin(time * 12) * 0.2;
        const grad = createSafeRadialGradient(0, 0, 0, 0, 0, radius * novaPulse);
        if (grad) {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.5, e.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, radius * novaPulse * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(0, 0, radius * novaPulse, 0, Math.PI * 2);
          ctx.fill();
        }
        // Inner core sparks
        for (let s = 0; s < 4; s++) {
          const sang = time * 4 + (s * Math.PI / 2);
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(sang) * radius, Math.sin(sang) * radius);
          ctx.stroke();
        }
        break;

      case EnemyType.SPLINTER:
        // Splinter: Jagged Crystal
        ctx.rotate(time * 0.8);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI * 2) / 4;
          const px = Math.cos(ang) * radius * 1.4;
          const py = Math.sin(ang) * radius * 1.4;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          const iang = ang + Math.PI / 4;
          ctx.lineTo(Math.cos(iang) * radius * 0.5, Math.sin(iang) * radius * 0.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case EnemyType.RANGED:
        // Diamond shape
        ctx.rotate(time * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.3);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius * 1.3);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EnemyType.TANK:
        // Beveled Square
        ctx.rotate(Math.PI / 4);
        const b = radius * 0.3;
        ctx.beginPath();
        ctx.moveTo(-radius + b, -radius);
        ctx.lineTo(radius - b, -radius);
        ctx.lineTo(radius, -radius + b);
        ctx.lineTo(radius, radius - b);
        ctx.lineTo(radius - b, radius);
        ctx.lineTo(-radius + b, radius);
        ctx.lineTo(-radius, radius - b);
        ctx.lineTo(-radius, -radius + b);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case EnemyType.BOSS:
        // Huge menacing dark star (multi-layered)
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const ang = (i * Math.PI * 2) / 16 + time * 0.5;
          const r = i % 2 === 0 ? radius * 1.5 : radius * 0.9;
          const px = Math.cos(ang) * r;
          const py = Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = hitIntensity > 0 ? '#ffffff' : '#0f172a'; 
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        // Inner core
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = hitIntensity > 0 ? '#fff' : '#111827';
        ctx.fill();
        
        // Inner pulsing eye
        ctx.beginPath();
        const pulseR = radius * 0.4 + Math.sin(time * 5) * radius * 0.1;
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Orbiting defense crystals
        for (let i = 0; i < 6; i++) {
           const plateAng = (i * Math.PI * 2 / 6) - time * 1.5;
           const px = Math.cos(plateAng) * radius * 2.2;
           const py = Math.sin(plateAng) * radius * 2.2;
           
           ctx.beginPath();
           ctx.moveTo(px + Math.cos(plateAng) * 15, py + Math.sin(plateAng) * 15);
           ctx.lineTo(px + Math.cos(plateAng + Math.PI/2) * 8, py + Math.sin(plateAng + Math.PI/2) * 8);
           ctx.lineTo(px + Math.cos(plateAng + Math.PI) * 15, py + Math.sin(plateAng + Math.PI) * 15);
           ctx.lineTo(px + Math.cos(plateAng - Math.PI/2) * 8, py + Math.sin(plateAng - Math.PI/2) * 8);
           ctx.closePath();
           ctx.fillStyle = '#ff4400';
           ctx.fill();
        }
        break;

      case EnemyType.ELITE:
        // Golden Spike Octagon
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 + time * 0.3;
          const px = Math.cos(ang) * radius;
          const py = Math.sin(ang) * radius;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();
        // Spikes
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 + time * 0.3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
          ctx.lineTo(Math.cos(ang) * radius * 1.5, Math.sin(ang) * radius * 1.5);
          ctx.stroke();
        }
        break;

      case EnemyType.FAST:
        // Sleek Arrow
        ctx.rotate(Math.atan2(e.velocity.y, e.velocity.x));
        ctx.beginPath();
        ctx.moveTo(radius * 1.5, 0);
        ctx.lineTo(-radius, -radius * 0.6);
        ctx.lineTo(-radius * 0.3, 0);
        ctx.lineTo(-radius, radius * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case EnemyType.SWARMER:
        // Tiny Pulsing Diamond
        const swarmPulse = Math.sin(time * 10 + e.id.length) * 0.2 + 0.8;
        ctx.rotate(time * 2);
        ctx.beginPath();
        ctx.moveTo(0, -radius * swarmPulse);
        ctx.lineTo(radius * swarmPulse, 0);
        ctx.lineTo(0, radius * swarmPulse);
        ctx.lineTo(-radius * swarmPulse, 0);
        ctx.closePath();
        ctx.fill();
        break;

      case EnemyType.DASHER: {
        // Arrow streaking with afterburn
        ctx.rotate(Math.atan2(e.velocity.y, e.velocity.x));
        ctx.beginPath();
        ctx.moveTo(radius * 1.8, 0);
        ctx.lineTo(-radius * 0.5, -radius * 0.55);
        ctx.lineTo(-radius * 1.2, 0);
        ctx.lineTo(-radius * 0.5, radius * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffaa44';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Afterburn trail
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.moveTo(-radius * 1.2, 0);
        ctx.lineTo(-radius * 2.5, -radius * 0.35);
        ctx.lineTo(-radius * 2.5, radius * 0.35);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case EnemyType.PHANTOM: {
        // Flickering translucent ghost triangle
        const isInvis = e.aiState === 'invisible';
        ctx.globalAlpha = isInvis ? 0.18 + Math.sin(time * 12) * 0.12 : 0.75 + Math.sin(time * 4) * 0.15;
        ctx.rotate(time * 1.2);
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.6);
        ctx.lineTo(radius * 1.2, radius * 1.0);
        ctx.lineTo(-radius * 1.2, radius * 1.0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        break;
      }

      case EnemyType.ZAPPER: {
        // Electric jagged star
        ctx.rotate(time * 3);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI * 2) / 6;
          const r = i % 2 === 0 ? radius * 1.4 : radius * 0.6;
          if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Spark arcs
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        for (let s = 0; s < 3; s++) {
          const sang = time * 6 + (s * Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.moveTo(Math.cos(sang) * radius * 0.8, Math.sin(sang) * radius * 0.8);
          ctx.lineTo(Math.cos(sang + 0.5) * radius * 1.5, Math.sin(sang + 0.5) * radius * 1.5);
          ctx.stroke();
        }
        break;
      }

      case EnemyType.STRIKER: {
        // Heavy arrow with forward spike
        ctx.rotate(Math.atan2(e.velocity.y, e.velocity.x));
        const chargeFlash = e.aiState === 'windup' ? 0.4 + Math.sin(time * 20) * 0.4 : 0;
        if (chargeFlash > 0) {
          ctx.fillStyle = `rgba(255,80,0,${chargeFlash})`;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = e.color;
        }
        ctx.beginPath();
        ctx.moveTo(radius * 2, 0);
        ctx.lineTo(-radius * 0.5, -radius * 0.9);
        ctx.lineTo(-radius * 1.2, -radius * 0.5);
        ctx.lineTo(-radius * 1.6, 0);
        ctx.lineTo(-radius * 1.2, radius * 0.5);
        ctx.lineTo(-radius * 0.5, radius * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case EnemyType.SWARM_V2: {
        // Slightly larger SWARMER with angular edges
        const sv2p = Math.sin(time * 12 + e.id.length) * 0.25 + 0.75;
        ctx.rotate(time * 2.5);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const ang = (i * Math.PI * 2) / 5;
          const r = i % 2 === 0 ? radius * sv2p * 1.2 : radius * sv2p * 0.7;
          if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffaa44';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }

      case EnemyType.TRACKER: {
        // Concentric targeting rings
        ctx.rotate(time * 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        // Outer scan rings
        for (let r = 0; r < 2; r++) {
          ctx.beginPath();
          ctx.arc(0, 0, radius * (1.5 + r * 0.5), 0, Math.PI * 1.5);
          ctx.strokeStyle = `rgba(192,38,211,${0.6 - r * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        // Cross-hair lines
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.6, 0); ctx.lineTo(radius * 0.6, 0);
        ctx.moveTo(0, -radius * 0.6); ctx.lineTo(0, radius * 0.6);
        ctx.stroke();
        break;
      }

      case EnemyType.FORTIFIED: {
        // Armored octagon with plating lines
        ctx.rotate(time * 0.05);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 + Math.PI / 8;
          if (i === 0) ctx.moveTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
          else ctx.lineTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
        }
        ctx.closePath();
        ctx.fillStyle = hitIntensity > 0 ? '#ffffff' : '#334155';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Armor plating details
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI * 2) / 4 + Math.PI / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * radius * 0.4, Math.sin(ang) * radius * 0.4);
          ctx.lineTo(Math.cos(ang) * radius * 0.85, Math.sin(ang) * radius * 0.85);
          ctx.stroke();
        }
        break;
      }

      case EnemyType.SHIELDED: {
        // Hexagon body with shield bubble
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI * 2) / 6;
          if (i === 0) ctx.moveTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
          else ctx.lineTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Shield bubble when active
        if (e.aiState !== 'recharge' && e.damageResist && e.damageResist > 0.5) {
          const shieldAlpha = 0.15 + Math.sin(time * 4) * 0.08;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 1.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6,182,212,${shieldAlpha})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(6,182,212,${0.5 + Math.sin(time * 6) * 0.25})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        break;
      }

      case EnemyType.REGENERATING: {
        // Pulsing organic circle with regen vines
        const hpFrac = e.health / e.maxHealth;
        const regenPulse = 1 + Math.sin(time * 8) * 0.15;
        ctx.rotate(time * 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, radius * regenPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Regen vines (more visible when healing)
        if (hpFrac < 0.8) {
          const vineAlpha = (1 - hpFrac) * 0.8;
          ctx.strokeStyle = `rgba(34,197,94,${vineAlpha})`;
          ctx.lineWidth = 2;
          for (let v = 0; v < 4; v++) {
            const vAng = time * 2 + (v * Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(vAng) * radius, Math.sin(vAng) * radius);
            ctx.quadraticCurveTo(
              Math.cos(vAng + 0.5) * radius * 1.8,
              Math.sin(vAng + 0.5) * radius * 1.8,
              Math.cos(vAng + 1.0) * radius * 1.3,
              Math.sin(vAng + 1.0) * radius * 1.3
            );
            ctx.stroke();
          }
        }
        break;
      }

      default: // CHASER (Triangle/Spiky)
        ctx.rotate(Math.atan2(e.velocity.y, e.velocity.x));
        ctx.beginPath();
        ctx.moveTo(radius * 1.2, 0);
        ctx.lineTo(-radius, -radius * 0.8);
        ctx.lineTo(-radius * 0.5, 0);
        ctx.lineTo(-radius, radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
    ctx.restore();

    // Glowing Weak Points (Emissive Core)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const corePulse = 1 + Math.sin(Date.now() / 150 + e.id.length) * 0.3;
    const coreRadius = Math.max(1, e.radius * 0.35 * corePulse);
    const coreGrad = createSafeRadialGradient(drawX + jitterX, drawY + jitterY, 0, drawX + jitterX, drawY + jitterY, coreRadius * 2);
    if (coreGrad) {
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, e.color);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(drawX + jitterX, drawY + jitterY, coreRadius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (e.enemyType === EnemyType.BOSS) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); 
      ctx.moveTo(drawX - 25, drawY - radius - 10); 
      ctx.lineTo(drawX, drawY - radius - 30); 
      ctx.lineTo(drawX + 25, drawY - radius - 10); 
      ctx.fill();
    }

    // Health Bar
    const healthBarW = e.radius * 2;
    const healthBarH = 4;
    const hpPercent = e.health / e.maxHealth;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(drawX - e.radius, drawY - e.radius - 12, healthBarW, healthBarH);
    ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.2 ? '#facc15' : '#ef4444';
    ctx.fillRect(drawX - e.radius, drawY - e.radius - 12, healthBarW * hpPercent, healthBarH);
  });

  // Render Player
  const p = state.player;
  const pDrawX = p.pos.x - camera.x;
  const pDrawY = p.pos.y - camera.y;

  // --- Orbitals ---
  if (state.orbitalCount > 0) {
    const orbitRadius = 100;
    const orbitSpeed = 0.05;
    const time = Date.now();
    for (let i = 0; i < state.orbitalCount; i++) {
      const angle = (time * orbitSpeed + (i * 2 * Math.PI) / state.orbitalCount);
      const orbitX = pDrawX + Math.cos(angle) * orbitRadius;
      const orbitY = pDrawY + Math.sin(angle) * orbitRadius;
      
      // Drone Body
      ctx.save();
      ctx.translate(orbitX, orbitY);
      ctx.rotate(angle + Math.PI / 2);
      
      ctx.fillStyle = '#8b5cf6';
      if (!isMobile) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8b5cf6';
      }
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      
      // Drone Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      if (!isMobile) ctx.shadowBlur = 0;
      ctx.restore();
      
      // Trail
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.arc(pDrawX, pDrawY, orbitRadius, angle - 0.5, angle);
      ctx.stroke();
    }
  }

  // Threat Aura
  const auraRadius = p.radius * 2.5 + Math.sin(Date.now() / 200) * 5;
  const hue = Math.max(0, 180 - (state.threatLevel * 1.8)); // 180 (cyan) down to 0 (red)
  ctx.save();
  ctx.beginPath();
  ctx.arc(pDrawX, pDrawY, auraRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.4)`;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
  ctx.fill();
  ctx.restore();

  // Multi-Shot Aura
  if (state.multiShot > 1) {
    const auraCount = state.multiShot - 1;
    const time = Date.now() / 1000;
    for (let i = 0; i < auraCount; i++) {
      const angle = (time * 1.5) + (i * Math.PI * 2 / auraCount);
      const orbitPulse = Math.sin(time * 3 + i) * 4;
      const orbitalX = pDrawX + Math.cos(angle) * (p.radius + 15 + orbitPulse);
      const orbitalY = pDrawY + Math.sin(angle) * (p.radius + 15 + orbitPulse);
      
      ctx.fillStyle = '#fbbf24'; 
      ctx.globalAlpha = 0.8;
      if (!isMobile) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fbbf24';
      }
      ctx.beginPath();
      ctx.arc(orbitalX, orbitalY, 4, 0, Math.PI * 2);
      ctx.fill();
      if (!isMobile) ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0;
  }

  // Ship rotation (needed for ghost trails and ship)
  let aimAngle = 0;
  if (p.aimDir && (p.aimDir.x !== 0 || p.aimDir.y !== 0)) {
     aimAngle = Math.atan2(p.aimDir.y, p.aimDir.x);
  } else {
     aimAngle = Math.atan2(p.velocity.y, p.velocity.x) || 0;
  }
  
  let angle = aimAngle;
  const velMag = p.velocity.magnitude();
  if (velMag > 0.5) {
     const velAngle = Math.atan2(p.velocity.y, p.velocity.x);
     let diff = velAngle - aimAngle;
     while (diff > Math.PI) diff -= Math.PI * 2;
     while (diff < -Math.PI) diff += Math.PI * 2;
     
     // Lean (tilt) up to 15 degrees towards movement
     const maxLean = 15 * (Math.PI / 180);
     const leanFactor = Math.min(1, velMag / 8);
     angle = aimAngle + Math.sign(diff) * Math.min(Math.abs(diff), maxLean) * leanFactor;
  }

  if (state.isDashing) {
    // Advanced Dash Ghost Trail (Ship Silhouette)
    for (let i = 1; i <= 5; i++) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.translate(pDrawX - (p.velocity.x * i * 0.8), pDrawY - (p.velocity.y * i * 0.8));
        ctx.rotate(angle);
        ctx.scale(1 - i * 0.1, 1 - i * 0.1);
        
        ctx.fillStyle = p.color; // Usually blue-ish
        ctx.globalAlpha = 0.4 / i;
        
        // Ship Silhouette
        ctx.beginPath();
        ctx.moveTo(p.radius * 1.6, 0); 
        ctx.lineTo(-p.radius * 1.1, -p.radius * 1.3); 
        ctx.lineTo(-p.radius * 0.5, 0); 
        ctx.lineTo(-p.radius * 1.1, p.radius * 1.3); 
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.2 / i;
        ctx.stroke();
        
        ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(pDrawX, pDrawY);
  ctx.rotate(angle);

  // Engine Fire
  // We want the engine fire to trail behind the movement direction, not just the ship tilt!
  // But doing it relative to angle is okay because the engine is physically attached to the ship.
  if (velMag > 0.1) {
    const fireLen = state.isDashing ? 40 : 20;
    const time = Date.now() / 50;
    const flicker = Math.sin(time) * 5;
    
    // Gradient for engine
    const grad = createSafeLinearGradient(-p.radius, 0, -p.radius - fireLen - flicker, 0);
    if (grad) {
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)');
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-p.radius + 5, -8);
      ctx.lineTo(-p.radius - fireLen - flicker, 0);
      ctx.lineTo(-p.radius + 5, 8);
      ctx.fill();
    }

    // Engine Core Glow
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-p.radius + 2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Ship Body
  const pGrad = createSafeRadialGradient(0, 0, 0, 0, 0, p.radius * 1.5);
  if (pGrad) {
    if (p.hitTimer && p.hitTimer > 0) {
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(1, '#ffffff');
    } else {
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.3, p.color);
      pGrad.addColorStop(1, '#000000');
    }
    ctx.fillStyle = pGrad;
  } else {
    ctx.fillStyle = p.color;
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = !isMobile && state.buffs.overdrive > 0 ? 30 : 0;
  ctx.shadowColor = '#f43f5e';
  
  // Main Hull (Layered Low-Poly Aesthetic)
  // Base dark hull
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(p.radius * 1.6, 0); // Nose
  ctx.lineTo(-p.radius * 1.1, -p.radius * 1.3); // Left wing
  ctx.lineTo(-p.radius * 0.5, 0); // Inner center
  ctx.lineTo(-p.radius * 1.1, p.radius * 1.3); // Right wing
  ctx.closePath();
  ctx.fill();

  // Highlight armor plates
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.moveTo(p.radius * 1.4, 0);
  ctx.lineTo(-p.radius * 0.8, -p.radius * 0.9);
  ctx.lineTo(-p.radius * 0.3, -p.radius * 0.3);
  ctx.lineTo(-p.radius * 0.6, 0);
  ctx.lineTo(-p.radius * 0.3, p.radius * 0.3);
  ctx.lineTo(-p.radius * 0.8, p.radius * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Neon Accents (Sci-fi Lines)
  ctx.beginPath();
  ctx.moveTo(0, -p.radius * 0.7);
  ctx.lineTo(p.radius * 0.6, -p.radius * 0.2);
  ctx.moveTo(0, p.radius * 0.7);
  ctx.lineTo(p.radius * 0.6, p.radius * 0.2);
  ctx.strokeStyle = '#38bdf8'; // bright cyan accent
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cockpit (Angular)
  ctx.fillStyle = '#0284c7'; 
  ctx.beginPath();
  ctx.moveTo(p.radius * 0.8, 0);
  ctx.lineTo(p.radius * 0.2, -p.radius * 0.25);
  ctx.lineTo(-p.radius * 0.2, 0);
  ctx.lineTo(p.radius * 0.2, p.radius * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  if (state.combo > 1) {
    const comboScale = 1 + Math.sin(Date.now() / 150) * 0.1;
    ctx.font = `bold ${Math.round(24 / zoom * comboScale)}px monospace`;
    ctx.fillStyle = `hsl(${Math.min(60, state.combo * 5)}, 100%, 60%)`;
    if (!isMobile) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
    }
    ctx.fillText(`×${state.combo}`, pDrawX - 15 * comboScale, pDrawY - 40 * comboScale);
    if (!isMobile) ctx.shadowBlur = 0;
  }

  // Extra life ready (subtle ring — not a per-hit absorb shield)
  if (state.extraLifeCharges > 0) {
    ctx.strokeStyle = '#34d399';
    const shieldPulse = Math.sin(Date.now() / 150) * 4;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.1 + shieldPulse), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.1 + shieldPulse), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
    ctx.fill();
  }

  if (state.buffs.overdrive > 0) {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    const overtime = Date.now() / 100;
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.4), overtime, overtime + Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.4), overtime + Math.PI, overtime + Math.PI * 1.5);
    ctx.stroke();
  }

  if (state.buffs.rapidFire > 0) {
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    const rt = Date.now() / 50;
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.8), -rt, -rt + Math.PI / 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.8), -rt + Math.PI, -rt + Math.PI * 1.25);
    ctx.stroke();
  }

  if (state.buffs.timeSlow > 0) {
    // Blue tint overlay
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.fillRect(-offsetX, -offsetY, width, height); // compensating for shake offset
    ctx.restore();
  }

  // Vignette Effect
  const vignette = createSafeRadialGradient(width/2, height/2, width/4, width/2, height/2, width);
  if (vignette) {
      vignette.addColorStop(0, 'transparent');
      const hpPercent = p.health / Math.max(1, p.maxHealth);
      if (hpPercent < 0.3) {
          vignette.addColorStop(1, `rgba(220, 38, 38, ${0.5 + Math.sin(Date.now()/150)*0.3})`);
      } else if (state.threatLevel > 60) {
          vignette.addColorStop(1, `rgba(20, 0, 0, ${0.6 + Math.sin(Date.now()/200)*0.2})`);
      } else {
          vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
      }
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
  }

  // Render Damage Texts
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(16 / zoom)}px Inter, sans-serif`;
  state.damageTexts.forEach(dtxt => {
    ctx.globalAlpha = dtxt.life;
    ctx.fillStyle = dtxt.color;
    ctx.fillText(dtxt.text, dtxt.pos.x - camera.x, dtxt.pos.y - camera.y);
  });
  ctx.globalAlpha = 1.0;

  // Screen Flash and Chromatic Aberration (Hit effect)
  if (ctxScreenFlash > 0) {
    ctx.save();
    
    // Intense Hit Glitch (Chromatic Aberration)
    if (state.player.hitTimer && state.player.hitTimer > 0) {
       const intensity = ctxScreenFlash / 10;
       const shiftStr = intensity * 15;
       
       // Red Shift
       ctx.globalCompositeOperation = 'screen';
       ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.6})`;
       ctx.fillRect(-shiftStr, 0, width, height);

       // Cyan Shift
       ctx.fillStyle = `rgba(0, 255, 255, ${intensity * 0.6})`;
       ctx.fillRect(shiftStr, 0, width, height);

       // TV scanline glitch slices
       if (intensity > 0.3) {
         ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
         for(let i=0; i<5; i++) {
            const h = Math.random() * 20;
            const y = Math.random() * height;
            ctx.fillRect(0, y, width, h);
         }
       }
    } else {
       // Standard generic flash (white/translucent) for leveling up/transitions
       const alpha = Math.min(0.6, ctxScreenFlash / 12);
       ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
       ctx.fillRect(0, 0, width, height);
    }
    
    ctx.restore();
  }

  if (state.bossArenaTransition > 0) {
    const total = 3.5;
    const t = 1 - state.bossArenaTransition / total;
    const tunnel = Math.sin(t * Math.PI);
    ctx.save();
    ctx.fillStyle = `rgba(2, 6, 23, ${0.35 + tunnel * 0.55})`;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = `rgba(34, 211, 238, ${tunnel * 0.35})`;
    ctx.lineWidth = 2;
    const streaks = 18;
    for (let i = 0; i < streaks; i++) {
      const angle = (i / streaks) * Math.PI * 2 + t * 6;
      const len = width * 0.15 + tunnel * width * 0.35;
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.lineTo(width / 2 + Math.cos(angle) * len, height / 2 + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();

  // --- Mini-Map ---
  const mapSize = 120;
  const mapPadding = 20;
  const mapX = width - mapSize - mapPadding;
  const mapY = mapPadding + 60;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
  ctx.lineWidth = 2;
  ctx.fillRect(mapX, mapY, mapSize, mapSize);
  ctx.strokeRect(mapX, mapY, mapSize, mapSize);

  // Map scale
  const scaleX = mapSize / state.world.width;
  const scaleY = mapSize / state.world.height;

  // Obstacles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  state.obstacles.forEach(obs => {
    if (obs.type === 'RECT') {
      ctx.fillRect(mapX + (obs.pos.x - obs.size.x/2) * scaleX, mapY + (obs.pos.y - obs.size.y/2) * scaleY, obs.size.x * scaleX, obs.size.y * scaleY);
    } else {
      ctx.beginPath();
      ctx.arc(mapX + obs.pos.x * scaleX, mapY + obs.pos.y * scaleY, obs.size.x * scaleX, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Items
  const mapPulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
  state.items.forEach(i => {
    ctx.fillStyle = `rgba(251, 191, 36, ${0.5 + mapPulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(mapX + i.pos.x * scaleX, mapY + i.pos.y * scaleY, 2 + mapPulse, 0, Math.PI * 2);
    ctx.fill();
  });

  // Enemies
  state.enemies.forEach(e => {
    if (e.enemyType === EnemyType.BOSS) {
      ctx.fillStyle = `rgba(153, 27, 27, ${0.5 + mapPulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(mapX + e.pos.x * scaleX, mapY + e.pos.y * scaleY, 4 + mapPulse * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(mapX + e.pos.x * scaleX, mapY + e.pos.y * scaleY, 2, 2);
    }
  });

  // Viewport rect
  const viewX = mapX + camera.x * scaleX;
  const viewY = mapY + camera.y * scaleY;
  const viewW = width * scaleX;
  const viewH = height * scaleY;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(viewX, viewY, viewW, viewH);

  // Player
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(mapX + state.player.pos.x * scaleX, mapY + state.player.pos.y * scaleY, 3, 0, Math.PI * 2);
  ctx.fill();
}
