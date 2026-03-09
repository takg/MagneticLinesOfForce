import type { Pole, Vec2 } from '../types';

const SOFTENING = 1e-4; // avoid singularity near pole center

/** Compute the total magnetic field vector at point (x, y) from all poles. */
export function fieldAt(x: number, y: number, poles: Pole[]): Vec2 {
  let fx = 0;
  let fy = 0;
  for (const pole of poles) {
    const dx = x - pole.x;
    const dy = y - pole.y;
    const r2 = dx * dx + dy * dy + SOFTENING;
    const r = Math.sqrt(r2);
    const factor = pole.charge / (r2 * r);
    fx += factor * dx;
    fy += factor * dy;
  }
  return { x: fx, y: fy };
}

/** Normalize a 2D vector. Returns zero vector if near-zero magnitude. */
function normalize(v: Vec2): Vec2 {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag < 1e-12) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/** RK4 step: follow normalized field direction. */
function rk4Step(x: number, y: number, h: number, poles: Pole[]): Vec2 {
  const f = (px: number, py: number) => normalize(fieldAt(px, py, poles));

  const k1 = f(x, y);
  const k2 = f(x + (h / 2) * k1.x, y + (h / 2) * k1.y);
  const k3 = f(x + (h / 2) * k2.x, y + (h / 2) * k2.y);
  const k4 = f(x + h * k3.x, y + h * k3.y);

  return {
    x: x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: y + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
  };
}

export interface FieldLine {
  points: Vec2[];
}

interface TraceOptions {
  stepSize: number;
  maxSteps: number;
  /** Radius around a sink pole at which we stop tracing */
  sinkRadius: number;
  /** Canvas bounds to stop tracing */
  bounds: { width: number; height: number };
  /** Start offset from the source pole */
  startRadius: number;
  /** Number of lines per source pole */
  linesPerPole: number;
}

const DEFAULT_OPTIONS: TraceOptions = {
  stepSize: 4,
  maxSteps: 2000,
  sinkRadius: 8,
  bounds: { width: 800, height: 600 },
  startRadius: 14,
  linesPerPole: 16,
};

function isOutOfBounds(p: Vec2, bounds: { width: number; height: number }): boolean {
  const margin = 20;
  return p.x < -margin || p.x > bounds.width + margin || p.y < -margin || p.y > bounds.height + margin;
}

function isNearSink(p: Vec2, poles: Pole[], sinkRadius: number): boolean {
  for (const pole of poles) {
    if (pole.charge < 0) {
      const dx = p.x - pole.x;
      const dy = p.y - pole.y;
      if (dx * dx + dy * dy < sinkRadius * sinkRadius) return true;
    }
  }
  return false;
}

/**
 * Trace all field lines originating from North (positive) poles.
 * Each line starts at `startRadius` away from the pole center,
 * at evenly spaced angles, and follows the field direction.
 */
export function traceFieldLines(poles: Pole[], opts: Partial<TraceOptions> = {}): FieldLine[] {
  const options: TraceOptions = { ...DEFAULT_OPTIONS, ...opts };
  const lines: FieldLine[] = [];
  const northPoles = poles.filter((p) => p.charge > 0);

  for (const pole of northPoles) {
    for (let i = 0; i < options.linesPerPole; i++) {
      const angle = (2 * Math.PI * i) / options.linesPerPole;
      let px = pole.x + options.startRadius * Math.cos(angle);
      let py = pole.y + options.startRadius * Math.sin(angle);

      const points: Vec2[] = [{ x: px, y: py }];

      for (let step = 0; step < options.maxSteps; step++) {
        const next = rk4Step(px, py, options.stepSize, poles);
        points.push({ x: next.x, y: next.y });
        px = next.x;
        py = next.y;

        if (isOutOfBounds({ x: px, y: py }, options.bounds)) break;
        if (isNearSink({ x: px, y: py }, poles, options.sinkRadius)) break;
      }

      lines.push({ points });
    }
  }

  return lines;
}