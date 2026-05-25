import type { BossVisualId } from '../content/bosses';

// ---------------------------------------------------------------------------
// Visual spec — colours used by each geometry renderer
// ---------------------------------------------------------------------------

export interface BossVisualSpec {
  bodyColor: string;
  coreColor: string;
  accentColor: string;
  strokeColor: string;
  geometry: 'hexagon' | 'organic' | 'star' | 'angular' | 'octagon' | 'phantom';
}

export const BOSS_VISUAL_SPECS: Record<BossVisualId, BossVisualSpec> = {
  salvage: {
    bodyColor: '#1f2937',
    coreColor: '#fbbf24',
    accentColor: '#f59e0b',
    strokeColor: '#9ca3af',
    geometry: 'hexagon',
  },
  hive: {
    bodyColor: '#14532d',
    coreColor: '#86efac',
    accentColor: '#22c55e',
    strokeColor: '#4ade80',
    geometry: 'organic',
  },
  void: {
    bodyColor: '#3b0764',
    coreColor: '#d8b4fe',
    accentColor: '#a78bfa',
    strokeColor: '#6d28d9',
    geometry: 'star',
  },
  crimson: {
    bodyColor: '#7f1d1d',
    coreColor: '#fca5a5',
    accentColor: '#dc2626',
    strokeColor: '#ef4444',
    geometry: 'angular',
  },
  colossus: {
    bodyColor: '#374151',
    coreColor: '#e5e7eb',
    accentColor: '#9ca3af',
    strokeColor: '#6b7280',
    geometry: 'octagon',
  },
  wraith: {
    bodyColor: '#1e1b4b',
    coreColor: '#a5b4fc',
    accentColor: '#818cf8',
    strokeColor: '#4f46e5',
    geometry: 'phantom',
  },
};

// ---------------------------------------------------------------------------
// Master dispatcher — call from Renderer.ts switch(e.enemyType) BOSS case
// ctx is already translated to the enemy's world-centre position.
// ---------------------------------------------------------------------------

export function drawBossGeometry(
  ctx: CanvasRenderingContext2D,
  bossVisualId: BossVisualId | undefined,
  radius: number,
  time: number,
  hit: boolean,
): void {
  const spec = bossVisualId ? BOSS_VISUAL_SPECS[bossVisualId] : BOSS_VISUAL_SPECS.crimson;

  switch (spec.geometry) {
    case 'hexagon': drawHexagon(ctx, spec, radius, time, hit); break;
    case 'organic':  drawOrganic(ctx, spec, radius, time, hit); break;
    case 'star':     drawStar(ctx, spec, radius, time, hit);    break;
    case 'angular':  drawAngular(ctx, spec, radius, time, hit); break;
    case 'octagon':  drawOctagon(ctx, spec, radius, time, hit); break;
    case 'phantom':  drawPhantom(ctx, spec, radius, time, hit); break;
  }
}

// ---------------------------------------------------------------------------
// Helper: draw a regular polygon path (n sides)
// ---------------------------------------------------------------------------
function polyPath(ctx: CanvasRenderingContext2D, n: number, r: number, offset = 0): void {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + offset;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// SALVAGE HAULER — industrial 6-sided hexagon + rotating cargo arms
// ---------------------------------------------------------------------------
function drawHexagon(
  ctx: CanvasRenderingContext2D,
  spec: BossVisualSpec,
  radius: number,
  time: number,
  hit: boolean,
): void {
  // Body: thick-bordered hexagon
  const rot = time * 0.18;
  polyPath(ctx, 6, radius * 1.4, rot);
  ctx.fillStyle = hit ? '#ffffff' : spec.bodyColor;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
  ctx.stroke();

  // Inner hex ring
  polyPath(ctx, 6, radius * 0.95, rot + Math.PI / 6);
  ctx.fillStyle = 'transparent';
  ctx.strokeStyle = hit ? '#fff' : spec.accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3 rotating "cargo arm" rectangles
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - time * 0.9;
    const ax = Math.cos(a) * radius * 2.0;
    const ay = Math.sin(a) * radius * 2.0;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = hit ? '#fff' : spec.accentColor;
    ctx.fillRect(-10, -18, 20, 36);
    ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -18, 20, 36);
    // Rivet dots
    ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
    for (const [rx, ry] of [[-5, -12], [5, -12], [-5, 12], [5, 12]] as [number, number][]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Core glow circle
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
  ctx.fill();

  // Amber eye pulse
  const pulse = radius * 0.28 + Math.sin(time * 4.5) * radius * 0.07;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.coreColor;
  ctx.fill();

  // Cross hair inside eye
  if (!hit) {
    ctx.strokeStyle = spec.bodyColor;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-pulse * 0.7, 0); ctx.lineTo(pulse * 0.7, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -pulse * 0.7); ctx.lineTo(0, pulse * 0.7); ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// HIVE REGENT / HIVE QUEEN — organic blob with pulsing tentacles
// ---------------------------------------------------------------------------
function drawOrganic(
  ctx: CanvasRenderingContext2D,
  spec: BossVisualSpec,
  radius: number,
  time: number,
  hit: boolean,
): void {
  // Organic body using blob (sine-deformed circle)
  ctx.beginPath();
  const pts = 24;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const bulge =
      1 +
      0.18 * Math.sin(a * 3 + time * 1.2) +
      0.1 * Math.sin(a * 5 - time * 2.1) +
      0.06 * Math.sin(a * 7 + time * 3.3);
    const r = radius * 1.35 * bulge;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = hit ? '#ffffff' : spec.bodyColor;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
  ctx.stroke();

  // 4 animated tentacles
  for (let i = 0; i < 4; i++) {
    const baseAng = (i / 4) * Math.PI * 2 + time * 0.4;
    const cx = Math.cos(baseAng) * radius * 0.8;
    const cy = Math.sin(baseAng) * radius * 0.8;
    const tipAng = baseAng + Math.sin(time * 2 + i) * 0.5;
    const tipLen = radius * (1.8 + 0.3 * Math.sin(time * 3 + i * 1.3));
    const tipX = cx + Math.cos(tipAng) * tipLen;
    const tipY = cy + Math.sin(tipAng) * tipLen;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + Math.cos(tipAng + 0.8) * tipLen * 0.5,
      cy + Math.sin(tipAng + 0.8) * tipLen * 0.5,
      tipX, tipY,
    );
    ctx.strokeStyle = hit ? '#fff' : spec.accentColor;
    ctx.lineWidth = 5 - i * 0.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    // Tip node
    ctx.beginPath();
    ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
    ctx.fillStyle = hit ? '#fff' : spec.strokeColor;
    ctx.fill();
  }

  // Orbiting spore sacs (4 small hexagons)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + time * 1.1;
    const ox = Math.cos(a) * radius * 2.1;
    const oy = Math.sin(a) * radius * 2.1;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(a + time * 2);
    polyPath(ctx, 6, 11, 0);
    ctx.fillStyle = hit ? '#fff' : spec.accentColor;
    ctx.fill();
    ctx.restore();
  }

  // Core pulsing nucleus
  const pulse = radius * 0.42 + Math.sin(time * 5) * radius * 0.08;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.coreColor;
  ctx.fill();

  // Inner pupil
  ctx.beginPath();
  ctx.arc(0, 0, pulse * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
  ctx.fill();
}

// ---------------------------------------------------------------------------
// VOID CARDINAL — cosmic 8-point star with orbiting orbs
// ---------------------------------------------------------------------------
function drawStar(
  ctx: CanvasRenderingContext2D,
  spec: BossVisualSpec,
  radius: number,
  time: number,
  hit: boolean,
): void {
  // 8-point star body (4 long + 4 short alternating)
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + time * 0.3;
    const r = i % 2 === 0 ? radius * 1.55 : radius * 0.65;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = hit ? '#ffffff' : spec.bodyColor;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
  ctx.stroke();

  // Inner counter-rotating star
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - time * 0.5;
    const r = i % 2 === 0 ? radius * 0.85 : radius * 0.38;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = hit ? '#fff' : spec.accentColor;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;

  // 3 orbiting void-orbs with trailing arc
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + time * 1.4;
    const ox = Math.cos(a) * radius * 2.15;
    const oy = Math.sin(a) * radius * 2.15;
    // trail arc
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.15, a - 0.6, a, false);
    ctx.strokeStyle = hit ? '#fff' : spec.accentColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // orb
    ctx.beginPath();
    ctx.arc(ox, oy, 9, 0, Math.PI * 2);
    ctx.fillStyle = hit ? '#fff' : spec.coreColor;
    ctx.fill();
  }

  // Halo ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
  ctx.fill();
  ctx.strokeStyle = hit ? '#fff' : spec.accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lavender pulsing eye
  const pulse = radius * 0.38 + Math.sin(time * 4) * radius * 0.1;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.coreColor;
  ctx.fill();

  // Slit pupil
  ctx.save();
  ctx.rotate(time * 0.8);
  ctx.beginPath();
  ctx.ellipse(0, 0, pulse * 0.2, pulse * 0.65, 0, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// CRIMSON TYRANT — jagged 5-spike angular horror + orbiting blades
// ---------------------------------------------------------------------------
function drawAngular(
  ctx: CanvasRenderingContext2D,
  spec: BossVisualSpec,
  radius: number,
  time: number,
  hit: boolean,
): void {
  // Irregular 5-spike body
  const spikeLens = [1.65, 1.2, 1.5, 1.1, 1.4];
  const innerRs = [0.55, 0.7, 0.5, 0.75, 0.6];
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + time * 0.22;
    const idx = Math.floor(i / 2);
    const r = i % 2 === 0 ? radius * spikeLens[idx] : radius * innerRs[idx];
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = hit ? '#ffffff' : spec.bodyColor;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
  ctx.stroke();

  // Jagged inner plates (3 concentric triangles, slightly rotated)
  for (let j = 0; j < 3; j++) {
    polyPath(ctx, 3, radius * (0.85 - j * 0.18), time * 0.35 + j * (Math.PI / 3));
    ctx.strokeStyle = hit ? '#fff' : spec.accentColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 - j * 0.12;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 4 orbiting sharp blades
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - time * 2.0;
    const ox = Math.cos(a) * radius * 2.1;
    const oy = Math.sin(a) * radius * 2.1;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(a + time * 3);
    // diamond blade
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fillStyle = hit ? '#fff' : spec.accentColor;
    ctx.fill();
    ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Core
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
  ctx.fill();

  // Pulsing blood-red eye
  const pulse = radius * 0.32 + Math.sin(time * 6) * radius * 0.09;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.coreColor;
  ctx.fill();

  // Flickering inner iris
  if (Math.sin(time * 11) > 0.3) {
    ctx.beginPath();
    ctx.arc(0, 0, pulse * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = hit ? '#fff' : spec.accentColor;
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// COLOSSUS — massive 8-sided industrial titan + 4 heavy rotating arms
// ---------------------------------------------------------------------------
function drawOctagon(
  ctx: CanvasRenderingContext2D,
  spec: BossVisualSpec,
  radius: number,
  time: number,
  hit: boolean,
): void {
  // Outer octagon body
  const rot = time * 0.1;
  polyPath(ctx, 8, radius * 1.45, rot);
  ctx.fillStyle = hit ? '#ffffff' : spec.bodyColor;
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
  ctx.stroke();

  // Inner concentric octagon
  polyPath(ctx, 8, radius * 0.98, rot + Math.PI / 8);
  ctx.strokeStyle = hit ? '#fff' : spec.accentColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 4 heavy rotating arm blocks
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + time * 0.55;
    const ax = Math.cos(a) * radius * 1.95;
    const ay = Math.sin(a) * radius * 1.95;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a + Math.PI / 2);
    // Heavy rectangular block
    ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
    ctx.fillRect(-14, -22, 28, 44);
    ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(-14, -22, 28, 44);
    // Accent stripe
    ctx.fillStyle = hit ? '#fff' : spec.accentColor;
    ctx.fillRect(-14, -4, 28, 8);
    ctx.restore();
  }

  // Tech cross lines radiating from center
  if (!hit) {
    ctx.strokeStyle = spec.accentColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rot;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * radius * 0.95, Math.sin(a) * radius * 0.95);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Core
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
  ctx.fill();
  ctx.strokeStyle = hit ? '#fff' : spec.strokeColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Industrial pulsing eye
  const pulse = radius * 0.3 + Math.sin(time * 3) * radius * 0.06;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.coreColor;
  ctx.fill();

  // Ring inside eye
  ctx.beginPath();
  ctx.arc(0, 0, pulse * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = hit ? '#fff' : spec.accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// WRAITH LORD — ethereal phantom: layered dissolving rings + wispy trails
// ---------------------------------------------------------------------------
function drawPhantom(
  ctx: CanvasRenderingContext2D,
  spec: BossVisualSpec,
  radius: number,
  time: number,
  hit: boolean,
): void {
  if (hit) {
    // On hit: solid flash
    polyPath(ctx, 8, radius * 1.4, time * 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else {
    // Multi-layered dissolving body rings
    const layers = [
      { r: 1.4, alpha: 0.25, rot: time * 0.35 },
      { r: 1.18, alpha: 0.45, rot: -time * 0.55 },
      { r: 0.95, alpha: 0.65, rot: time * 0.7 },
      { r: 0.72, alpha: 0.85, rot: -time * 0.9 },
    ];
    for (const { r, alpha, rot } of layers) {
      // Irregular polygon per layer
      ctx.beginPath();
      const pts = 7;
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2 + rot;
        const jitter = 1 + 0.12 * Math.sin(a * 4 + time * 2.5 + r * 10);
        const pr = radius * r * jitter;
        if (i === 0) ctx.moveTo(Math.cos(a) * pr, Math.sin(a) * pr);
        else ctx.lineTo(Math.cos(a) * pr, Math.sin(a) * pr);
      }
      ctx.closePath();
      ctx.fillStyle = spec.bodyColor;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.strokeStyle = spec.strokeColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 8 wispy trailing particles arcing around body
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + time * 1.6;
      const flicker = 0.5 + 0.5 * Math.sin(time * 7 + i * 2.1);
      const dist = radius * (1.6 + 0.3 * Math.sin(time * 3 + i));
      const px = Math.cos(a) * dist;
      const py = Math.sin(a) * dist;
      ctx.beginPath();
      ctx.arc(px, py, 4 + flicker * 4, 0, Math.PI * 2);
      ctx.fillStyle = spec.accentColor;
      ctx.globalAlpha = 0.3 + flicker * 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Core — always solid
  const coreR = radius * 0.48;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.bodyColor;
  ctx.globalAlpha = hit ? 1 : 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Periwinkle pulsing eye
  const pulse = radius * 0.28 + Math.sin(time * 5.5) * radius * 0.1;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.fillStyle = hit ? '#fff' : spec.coreColor;
  ctx.globalAlpha = hit ? 1 : 0.9 + 0.1 * Math.sin(time * 8);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Slit pupil — wraith-style vertical iris
  if (!hit) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, pulse * 0.18, pulse * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = spec.bodyColor;
    ctx.fill();
    ctx.restore();

    // Iris glow ring
    ctx.beginPath();
    ctx.arc(0, 0, pulse * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = spec.accentColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 9);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
