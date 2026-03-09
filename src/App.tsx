import { useState, useCallback } from 'react';
import MagneticCanvas from './components/MagneticCanvas';
import type { Pole, PoleType } from './types';
import './App.css';

export default function App() {
  const [poles, setPoles] = useState<Pole[]>([]);
  const [selectedTool, setSelectedTool] = useState<PoleType>('north');
  const [linesPerPole, setLinesPerPole] = useState(16);

  const handleAddPole = useCallback((pole: Pole) => {
    setPoles((prev) => [...prev, pole]);
  }, []);

  const handleMovePole = useCallback((id: string, x: number, y: number) => {
    setPoles((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  }, []);

  const handleRemovePole = useCallback((id: string) => {
    setPoles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    setPoles([]);
  }, []);

  const northCount = poles.filter((p) => p.charge > 0).length;
  const southCount = poles.filter((p) => p.charge < 0).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="title">Magnetic Lines of Force</h1>

        <section className="section">
          <h2 className="section-title">Tool</h2>
          <div className="tool-group">
            <button
              className={`tool-btn north ${selectedTool === 'north' ? 'active' : ''}`}
              onClick={() => setSelectedTool('north')}
            >
              <span className="pole-icon north-icon">N</span>
              North Pole
            </button>
            <button
              className={`tool-btn south ${selectedTool === 'south' ? 'active' : ''}`}
              onClick={() => setSelectedTool('south')}
            >
              <span className="pole-icon south-icon">S</span>
              South Pole
            </button>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Field Lines per Pole</h2>
          <div className="slider-row">
            <input
              type="range"
              min={4}
              max={32}
              step={4}
              value={linesPerPole}
              onChange={(e) => setLinesPerPole(Number(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{linesPerPole}</span>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Poles</h2>
          <div className="stats">
            <div className="stat">
              <span className="stat-dot north-dot" /> North: <strong>{northCount}</strong>
            </div>
            <div className="stat">
              <span className="stat-dot south-dot" /> South: <strong>{southCount}</strong>
            </div>
          </div>
          <button className="clear-btn" onClick={handleClear} disabled={poles.length === 0}>
            Clear All
          </button>
        </section>

        <section className="section hints">
          <h2 className="section-title">Controls</h2>
          <ul>
            <li>Click canvas to place pole</li>
            <li>Drag to move a pole</li>
            <li>Right-click to remove</li>
          </ul>
        </section>
      </aside>

      <main className="canvas-area">
        <MagneticCanvas
          poles={poles}
          selectedTool={selectedTool}
          onAddPole={handleAddPole}
          onMovePole={handleMovePole}
          onRemovePole={handleRemovePole}
          linesPerPole={linesPerPole}
        />
      </main>
    </div>
  );
}