# KineSketch

A web-based tool for drawing **kinematic diagrams** (schemas cinematiques) with ISO 3952 normalized symbols. Built for mechanical engineering students and teachers.

## Features

- **11 standard liaisons** (joints): pivot, prismatic, cylindrical, spherical, fixed, helical, spherical with finger, planar, annular linear, rectilinear linear, point contact
- **Infinite canvas** with pan (trackpad, middle-click, hand tool) and zoom (scroll, pinch)
- **Colored solids**: create bodies, assign colors, connect joints with links
- **Draggable labels** on joints and links
- **Rotation handle** with 15deg snap
- **Snap-to-grid** for precise placement
- **Undo / Redo** (Ctrl+Z / Ctrl+Shift+Z)
- **Mobility calculation** (Grubler's formula)
- **Liaison table** and **liaison graph**
- **Collapsible panels**

## Export

| Format | Description |
|--------|-------------|
| `.kinesketch` | Native JSON format, full save/load |
| PNG | High-resolution image (3x) |
| SVG | Vector, compatible with Inkscape |
| LaTeX (TikZ) | For academic papers, ISO 3952 symbols |

Auto-save to localStorage is enabled by default.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite**
- **Konva** + **react-konva** (2D canvas)
- **Zustand** + **Zundo** (state + undo/redo)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

## License

MIT
