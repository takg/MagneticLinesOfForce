export interface Pole {
  id: string;
  x: number;
  y: number;
  /** Positive = North (source), Negative = South (sink) */
  charge: number;
}

export type PoleType = 'north' | 'south';

export interface Vec2 {
  x: number;
  y: number;
}