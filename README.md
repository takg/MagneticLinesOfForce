# Magnetic Lines of Force

An interactive 2D simulation of magnetic field lines built with TypeScript and React.

## Features

- Place North (N) and South (S) magnetic poles anywhere on the canvas
- Field lines traced in real time using 4th-order Runge-Kutta integration
- Drag poles to reposition them and watch the field update instantly
- Right-click any pole to remove it
- Slider to control the number of field lines drawn per pole (4–32)
- Arrowheads indicate field direction along each line

## Physics

Each pole is modelled as a 2D magnetic monopole. The field at any point is the superposition of contributions from all poles:

```
E = Σ q_i · (r - r_i) / |r - r_i|³
```

Field lines are integrated by following the normalized field direction using RK4. Lines originate around North poles at evenly-spaced angles and terminate when they reach a South pole, exit the canvas, or exceed the maximum step count.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```sh
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Build for production

```sh
npm run build
npm run preview
```

## Project Structure

```
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Root component and state
├── App.css                   # Styles
├── types.ts                  # Shared types (Pole, Vec2, PoleType)
├── physics/
│   └── magneticField.ts      # Field calculation and RK4 line tracer
└── components/
    └── MagneticCanvas.tsx    # Canvas renderer and mouse interaction
```

## Controls

| Action | Result |
|---|---|
| Click empty canvas | Place pole (selected type) |
| Drag a pole | Move it |
| Right-click a pole | Remove it |
| Clear All button | Remove all poles |
| Lines per pole slider | Adjust field line density |