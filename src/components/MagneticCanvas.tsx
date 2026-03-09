import { useRef, useEffect, useCallback, useState } from 'react';
import type { Pole, PoleType, Vec2 } from '../types';
import { traceFieldLines } from '../physics/magneticField';

const POLE_RADIUS = 14;
const ARROW_INTERVAL = 60; // draw an arrowhead every N pixels along a line
const NORTH_COLOR = '#ef4444';
const SOUTH_COLOR = '#3b82f6';
const LINE_COLOR = '#a3e635';
const BG_COLOR = '#0f172a';

interface Props {
  poles: Pole[];
  selectedTool: PoleType;
  onAddPole: (pole: Pole) => void;
  onMovePole: (id: string, x: number, y: number) => void;
  onRemovePole: (id: string) => void;
  linesPerPole: number;
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  tip: Vec2,
  angle: number,
  size: number
) {
  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size / 2);
  ctx.lineTo(-size, size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPole(ctx: CanvasRenderingContext2D, pole: Pole, isHovered: boolean) {
  const color = pole.charge > 0 ? NORTH_COLOR : SOUTH_COLOR;
  const label = pole.charge > 0 ? 'N' : 'S';

  // Glow effect
  ctx.save();
  if (isHovered) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
  }

  // Circle
  ctx.beginPath();
  ctx.arc(pole.x, pole.y, POLE_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${POLE_RADIUS}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, pole.x, pole.y);

  ctx.restore();
}

export default function MagneticCanvas({
  poles,
  selectedTool,
  onAddPole,
  onMovePole,
  onRemovePole,
  linesPerPole,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Draw everything
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    if (poles.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Click to place poles. Right-click to remove.', width / 2, height / 2);
      return;
    }

    // Trace field lines
    const lines = traceFieldLines(poles, {
      bounds: { width, height },
      linesPerPole,
    });

    // Draw field lines
    ctx.strokeStyle = LINE_COLOR;
    ctx.fillStyle = LINE_COLOR;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.7;

    for (const line of lines) {
      if (line.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();

      // Draw arrowheads along the line
      let distAccum = 0;
      for (let i = 1; i < line.points.length; i++) {
        const a = line.points[i - 1];
        const b = line.points[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const seg = Math.sqrt(dx * dx + dy * dy);
        distAccum += seg;

        if (distAccum >= ARROW_INTERVAL) {
          distAccum = 0;
          const angle = Math.atan2(dy, dx);
          drawArrowhead(ctx, b, angle, 6);
        }
      }
    }

    ctx.globalAlpha = 1;

    // Draw poles on top
    for (const pole of poles) {
      drawPole(ctx, pole, pole.id === hoveredId);
    }
  }, [poles, hoveredId, linesPerPole]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Vec2 => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const hitTestPole = useCallback(
    (p: Vec2): Pole | null => {
      for (let i = poles.length - 1; i >= 0; i--) {
        const pole = poles[i];
        const dx = p.x - pole.x;
        const dy = p.y - pole.y;
        if (dx * dx + dy * dy <= (POLE_RADIUS + 4) * (POLE_RADIUS + 4)) return pole;
      }
      return null;
    },
    [poles]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const p = getCanvasPoint(e);

      if (e.button === 2) {
        // Right-click: remove
        const hit = hitTestPole(p);
        if (hit) onRemovePole(hit.id);
        return;
      }

      // Left-click
      const hit = hitTestPole(p);
      if (hit) {
        // Start dragging existing pole
        dragRef.current = { id: hit.id, offsetX: p.x - hit.x, offsetY: p.y - hit.y };
      } else {
        // Place new pole
        const newPole: Pole = {
          id: crypto.randomUUID(),
          x: p.x,
          y: p.y,
          charge: selectedTool === 'north' ? 1 : -1,
        };
        onAddPole(newPole);
      }
    },
    [getCanvasPoint, hitTestPole, onAddPole, onRemovePole, selectedTool]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const p = getCanvasPoint(e);

      if (dragRef.current) {
        onMovePole(
          dragRef.current.id,
          p.x - dragRef.current.offsetX,
          p.y - dragRef.current.offsetY
        );
        return;
      }

      const hit = hitTestPole(p);
      setHoveredId(hit ? hit.id : null);
    },
    [getCanvasPoint, hitTestPole, onMovePole]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragRef.current = null;
    setHoveredId(null);
  }, []);

  // Sync canvas size to its CSS size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: dragRef.current ? 'grabbing' : hoveredId ? 'grab' : 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}