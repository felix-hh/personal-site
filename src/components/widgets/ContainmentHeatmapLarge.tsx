/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { FILES115, C115 } from './data/containment115';

// Static 115-file containment heatmap (7 Aetna ASA + 108 Fully Insured <100).
// No threshold slider — it's an overview. Cells are colored by containment
// (row ⊆ col); hover anywhere for the pair detail. Data is generated verbatim
// from the pipeline's Plotly export (see data/containment115.ts).

const FILES = FILES115;
const C = C115;
const n = FILES.length;
const ASA = FILES.filter((f) => f.ds === 'ASA').length; // group boundary

// Monochrome ink ramp, identical to the 7-file heatmap: bg-subtle (0) → ink (1).
// Exact 100% containment gets a distinctive dark green.
const FULL = 'rgb(22,101,52)';
function color(v: number): string {
  if (v >= 0.9999) return FULL;
  const a = [243, 240, 232],
    b = [28, 25, 22];
  const c = a.map((ch, j) => Math.round(ch + (b[j] - ch) * v));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const M = 5; // cell size in user units (no gap — dense heatmap)
const mL = 70,
  mT = 70,
  mR = 16,
  mB = 16;
const gridPx = n * M;
const ox = mL,
  oy = mT;
const vbW = mL + gridPx + mR,
  vbH = mT + gridPx + mB;

function commas(x: number): string {
  return Math.round(x).toLocaleString('en-US');
}

interface TipState {
  x: number;
  y: number;
  i: number;
  j: number;
}

export default function ContainmentHeatmapLarge() {
  const [tip, setTip] = useState<TipState | null>(null);

  // Build the 13k cells once — they never change, so tooltip updates don't
  // re-render the grid.
  const cells = useMemo(() => {
    const out: JSX.Element[] = [];
    for (let i = 0; i < n; i++) {
      const ry = oy + i * M;
      for (let j = 0; j < n; j++) {
        out.push(
          <rect x={ox + j * M} y={ry} width={M} height={M} fill={color(C[i][j])} />
        );
      }
    }
    return out;
  }, []);

  function onMove(e: JSX.TargetedMouseEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const ux = (e.clientX - r.left) * (vbW / r.width);
    const uy = (e.clientY - r.top) * (vbH / r.height);
    const j = Math.floor((ux - ox) / M);
    const i = Math.floor((uy - oy) / M);
    if (i < 0 || i >= n || j < 0 || j >= n) {
      setTip(null);
      return;
    }
    setTip({ x: Math.min(e.clientX + 14, window.innerWidth - 280), y: e.clientY + 14, i, j });
  }

  function tipContent(i: number, j: number) {
    const a = FILES[i],
      b = FILES[j],
      v = C[i][j];
    const inter = a.card * v;
    const dsName = (d: string) => (d === 'ASA' ? 'ASA' : 'Fully Insured');
    if (i === j)
      return (
        <>
          <code>{a.id}</code> ({dsName(a.ds)}) — {commas(a.card)} distinct rates.
        </>
      );
    return (
      <>
        <b>{(v * 100).toFixed(1)}%</b> of <code>{a.id}</code> lives inside{' '}
        <code>{b.id}</code>.
        <br />
        <span class="fh-tip-ctx">
          row {a.id} ({dsName(a.ds)}, {commas(a.card)}) ⊆ col {b.id} ({dsName(b.ds)},{' '}
          {commas(b.card)}) · ∩ ≈ {commas(inter)}
        </span>
      </>
    );
  }

  const asaMid = ox + (ASA / 2) * M;
  const fiMid = ox + (ASA + (n - ASA) / 2) * M;
  const asaMidY = oy + (ASA / 2) * M;
  const fiMidY = oy + (ASA + (n - ASA) / 2) * M;
  const divX = ox + ASA * M;

  return (
    <figure class="fh-figure">
      <figcaption class="fh-figure-label">
        Figure 3 · Containment heatmap · 115 Aetna MRFs (7 ASA + 108 Fully Insured)
      </figcaption>
      <div class="fh-widget">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          role="img"
          aria-label="Containment heatmap of 115 files"
          style={{ maxWidth: `${vbW}px`, margin: '0 auto' }}
        >
          {/* column group labels + caption */}
          <text
            class="fh-hm-axis"
            x={ox + gridPx / 2}
            y={20}
            text-anchor="middle"
            style={{ fontSize: '17px' }}
          >
            container file (column) →
          </text>
          <text class="fh-hm-clabel fh-kept" x={asaMid} y={oy - 10} text-anchor="middle">
            ASA · 7
          </text>
          <text class="fh-hm-clabel fh-kept" x={fiMid} y={oy - 10} text-anchor="middle">
            Fully Insured · 108
          </text>

          {/* row caption + group labels */}
          <text
            class="fh-hm-axis"
            x={20}
            y={oy + gridPx / 2}
            text-anchor="middle"
            transform={`rotate(-90 20 ${oy + gridPx / 2})`}
            style={{ fontSize: '17px' }}
          >
            contained file (row)
          </text>
          <text
            class="fh-hm-clabel fh-kept"
            x={ox - 12}
            y={asaMidY}
            text-anchor="middle"
            transform={`rotate(-90 ${ox - 12} ${asaMidY})`}
          >
            ASA · 7
          </text>
          <text
            class="fh-hm-clabel fh-kept"
            x={ox - 12}
            y={fiMidY}
            text-anchor="middle"
            transform={`rotate(-90 ${ox - 12} ${fiMidY})`}
          >
            Fully Insured · 108
          </text>

          {cells}

          {/* dataset dividers between ASA (7) and Fully Insured (108) */}
          <line x1={divX} y1={oy} x2={divX} y2={oy + gridPx} stroke="var(--bg)" stroke-width="1" />
          <line x1={ox} y1={divX} x2={ox + gridPx} y2={divX} stroke="var(--bg)" stroke-width="1" />

          {/* transparent overlay catches all hover, computes the cell */}
          <rect
            x={ox}
            y={oy}
            width={gridPx}
            height={gridPx}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setTip(null)}
          />
        </svg>

        <div class="fh-legend">
          <span>disjoint</span>
          <span class="fh-legend-scale"></span>
          <span>fully covered</span>
        </div>

        <p class="fh-hm-summary">
          71.6 billion rates across 115 files; only 4.14 billion distinct (94.2% redundant).
          21 representatives cover 98.3% of the distinct rates.
        </p>
      </div>

      {tip && (
        <div class="fh-tip" style={{ opacity: 1, left: `${tip.x}px`, top: `${tip.y}px` }}>
          {tipContent(tip.i, tip.j)}
        </div>
      )}
    </figure>
  );
}
