/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact';

// Containment heatmap — ported from source_widgets/containment-heatmap.html,
// re-skinned monochrome with the original floating tooltip restored. Data
// (HM_FILES + HM_C) is copied verbatim — real numbers from the pipeline.

// Display order: the standalone file (pl-299 — its own rate universe, contains
// only itself) leads, then the cluster descending by sketch cardinality. The
// matrix only ever shows files that are *kept* at the current threshold, so the
// leading rows are the survivors and subsumed files drop out entirely.
const FILES = ['pl-299', 'pl-22z', 'pl-3i4', 'pl-3dn', 'pl-4ux', 'pl-4xy', 'pl-5to'];

// containment C(A ⊆ B), A=row, B=col, full 7×7 from report.md §2.
const C: Record<string, Record<string, number>> = {
  'pl-22z': { 'pl-22z': 1.0, 'pl-3i4': 0.9633, 'pl-3dn': 0.9744, 'pl-4ux': 0.9738, 'pl-4xy': 0.9553, 'pl-5to': 0.9547, 'pl-299': 0.0006 },
  'pl-3i4': { 'pl-22z': 0.985, 'pl-3i4': 1.0, 'pl-3dn': 0.9851, 'pl-4ux': 0.9845, 'pl-4xy': 0.9655, 'pl-5to': 0.965, 'pl-299': 0.0005 },
  'pl-3dn': { 'pl-22z': 1.0, 'pl-3i4': 0.9888, 'pl-3dn': 1.0, 'pl-4ux': 0.9994, 'pl-4xy': 0.9804, 'pl-5to': 0.9799, 'pl-299': 0.0004 },
  'pl-4ux': { 'pl-22z': 1.0, 'pl-3i4': 0.9888, 'pl-3dn': 1.0, 'pl-4ux': 1.0, 'pl-4xy': 0.9804, 'pl-5to': 0.9798, 'pl-299': 0.0005 },
  'pl-4xy': { 'pl-22z': 1.0, 'pl-3i4': 0.9886, 'pl-3dn': 1.0, 'pl-4ux': 0.9994, 'pl-4xy': 1.0, 'pl-5to': 0.9794, 'pl-299': 0.0005 },
  'pl-5to': { 'pl-22z': 1.0, 'pl-3i4': 0.9886, 'pl-3dn': 1.0, 'pl-4ux': 0.9994, 'pl-4xy': 0.98, 'pl-5to': 1.0, 'pl-299': 0.0005 },
  'pl-299': { 'pl-22z': 0.0047, 'pl-3i4': 0.0037, 'pl-3dn': 0.0033, 'pl-4ux': 0.0034, 'pl-4xy': 0.0034, 'pl-5to': 0.0039, 'pl-299': 1.0 },
};

// Monochrome ink ramp: bg-subtle (0) → ink (1), linear in RGB.
function color(v: number): string {
  const a = [243, 240, 232],
    b = [28, 25, 22];
  const c = a.map((ch, j) => Math.round(ch + (b[j] - ch) * v));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const n = FILES.length;
const M = 44,
  gap = 2,
  pitch = M + gap;
// Fixed label margins; the grid is anchored at (mL, mT) so survivors keep their
// place while subsumed files peel off the bottom-right. The viewBox is sized to
// the grid, and `CELL_SCALE` caps the on-screen size so cells stay a constant
// ~64px and the whole figure visibly shrinks as files merge.
const mL = 94,
  mT = 96,
  mR = 18,
  mB = 18,
  CELL_SCALE = 1.45;

interface TipState {
  x: number;
  y: number;
  i: number;
  j: number;
}

export default function ContainmentHeatmap() {
  const [thr, setThr] = useState(1.0);
  const [tip, setTip] = useState<TipState | null>(null);

  // Greedy keep in display order. A file is subsumed if some already-kept file
  // covers at least `thr` of it; otherwise it survives as its own file.
  // `assignedTo` maps every file to the kept container it folds into (itself if
  // kept). Rows = kept containers (they drop out as they're absorbed); columns =
  // all files. A container's highlighted cells across the row ARE its cluster.
  const { kept, status, assignedTo } = useMemo(() => {
    const kept: string[] = [];
    const status: Record<string, 'kept' | 'subsumed'> = {};
    const assignedTo: Record<string, string> = {};
    FILES.forEach((f) => {
      const container = kept.find((c) => C[f][c] >= thr);
      if (container) {
        status[f] = 'subsumed';
        assignedTo[f] = container;
      } else {
        status[f] = 'kept';
        assignedTo[f] = f;
        kept.push(f);
      }
    });
    return { kept, status, assignedTo };
  }, [thr]);

  const k = kept.length;
  const lossless = thr >= 0.9999;

  // Anchor the grid at fixed top-left margins. Columns are fixed (all n files),
  // rows shrink as files are kept-or-absorbed, so the figure gets shorter — not
  // narrower — as the bar tightens.
  const gridW = n * pitch - gap;
  const gridH = k * pitch - gap;
  const ox = mL,
    oy = mT;
  const vbW = mL + gridW + mR,
    vbH = mT + gridH + mB;

  function onCellMove(e: JSX.TargetedMouseEvent<SVGGElement>, i: number, j: number) {
    setTip({
      x: Math.min(e.clientX + 14, window.innerWidth - 270),
      y: e.clientY + 14,
      i,
      j,
    });
  }

  function tipContent(i: number, j: number) {
    const container = kept[i],
      f = FILES[j],
      v = C[f][container];
    if (f === container)
      return (
        <>
          <code>{container}</code> — kept as its own file. It covers itself fully
          and nothing else subsumes it at this threshold.
        </>
      );
    const ctx =
      assignedTo[f] === container
        ? `${f} folds into ${container}'s cluster.`
        : v < 0.05
          ? `Different rate universe — ${container} barely covers ${f}.`
          : v >= thr
            ? `${container} also covers ${f}, but ${f} folds into ${assignedTo[f]} (its leftmost container).`
            : `${container} covers ${(v * 100).toFixed(1)}% of ${f} — below the ${(thr * 100).toFixed(1)}% bar.`;
    return (
      <>
        <b>{(v * 100).toFixed(1)}%</b> of <code>{f}</code> lives inside{' '}
        <code>{container}</code>.
        <br />
        <span class="fh-tip-ctx">{ctx}</span>
      </>
    );
  }

  return (
    <figure class="fh-figure">
      <figcaption class="fh-figure-label">
        Figure 2 · Containment heatmap · Aetna ASA MRFs ({n} files)
      </figcaption>
      <div class="fh-widget">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          role="img"
          aria-label="Containment heatmap"
          style={{ maxWidth: `${Math.round(vbW * CELL_SCALE)}px`, margin: '0 auto' }}
        >
          {/* column labels (all files) — kept in ink, subsumed faint */}
          {FILES.map((f, j) => {
            const cx = ox + j * pitch + M / 2;
            return (
              <text
                class={`fh-hm-clabel fh-${status[f]}`}
                x={cx}
                y={oy - 12}
                text-anchor="middle"
                transform={`rotate(-35 ${cx} ${oy - 12})`}
              >
                {f}
              </text>
            );
          })}
          <text class="fh-hm-axis" x={ox + gridW / 2} y={oy - 52} text-anchor="middle">
            contained file (column) →
          </text>

          {/* one row per kept container; its lit cells span its cluster */}
          {kept.map((container, i) => {
            const cy = oy + i * pitch + M / 2;
            return (
              <>
                <text
                  class="fh-hm-clabel fh-kept"
                  x={ox - 12}
                  y={cy + 4}
                  text-anchor="end"
                >
                  {container}
                </text>
                {FILES.map((f, j) => {
                  const v = C[f][container];
                  const active = assignedTo[f] === container;
                  const rx = ox + j * pitch,
                    ry = oy + i * pitch;
                  return (
                    <g
                      class={`fh-hm-cell${active ? '' : ' fh-dim'}`}
                      onMouseMove={(e) => onCellMove(e, i, j)}
                      onMouseLeave={() => setTip(null)}
                    >
                      <rect x={rx} y={ry} width={M} height={M} rx="3" fill={color(v)} />
                      <text
                        x={rx + M / 2}
                        y={ry + M / 2 + 4}
                        text-anchor="middle"
                        font-size="11"
                        font-weight="700"
                        fill={v > 0.55 ? '#faf8f3' : '#1c1916'}
                      >
                        {v.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })}
          <text
            class="fh-hm-axis"
            x={ox - 66}
            y={oy + gridH / 2}
            text-anchor="middle"
            transform={`rotate(-90 ${ox - 66} ${oy + gridH / 2})`}
          >
            kept file (row)
          </text>
        </svg>

        <div class="fh-legend">
          <span>disjoint</span>
          <span class="fh-legend-scale"></span>
          <span>fully covered</span>
        </div>

        <div class="fh-controls">
          <div class="fh-control-row">
            <label for="hm-thr">Coverage required (to subsume a contained file)</label>
            <input
              id="hm-thr"
              type="range"
              min="0.90"
              max="1.00"
              step="0.001"
              value={thr}
              onInput={(e) => setThr(+(e.currentTarget as HTMLInputElement).value)}
            />
            <span class="fh-hm-tval">{(thr * 100).toFixed(1)}%</span>
          </div>
          <p class="fh-hm-summary">
            Keep <b>{kept.length} file{kept.length > 1 ? 's' : ''}</b> ({kept.join(', ')});{' '}
            {n - kept.length} subsumed.{' '}
            {lossless
              ? 'At 100% the sketch found no rates in the dropped files that the kept ones miss — loss is minimal, bounded by what a sampled estimate can overlook.'
              : "Below 100% you're trading a sliver of rates for fewer files (lossy)."}
          </p>
        </div>
      </div>

      {tip && (
        <div
          class="fh-tip"
          style={{ opacity: 1, left: `${tip.x}px`, top: `${tip.y}px` }}
        >
          {tipContent(tip.i, tip.j)}
        </div>
      )}
    </figure>
  );
}
