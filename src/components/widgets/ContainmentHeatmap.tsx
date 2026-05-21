/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact';

// Containment heatmap — ported from source_widgets/containment-heatmap.html,
// re-skinned monochrome with the original floating tooltip restored. Data
// (HM_FILES + HM_C) is copied verbatim — real numbers from the pipeline.

// Display order: descending by sketch cardinality (matches the published figure).
const FILES = ['pl-22z', 'pl-3i4', 'pl-3dn', 'pl-4ux', 'pl-4xy', 'pl-5to', 'pl-299'];

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
  padTop = 86,
  left = 86,
  gap = 2;

interface TipState {
  x: number;
  y: number;
  i: number;
  j: number;
}

export default function ContainmentHeatmap() {
  const [thr, setThr] = useState(1.0);
  const [tip, setTip] = useState<TipState | null>(null);

  // greedy keep in cardinality (display) order
  const { status, kept } = useMemo(() => {
    const kept: string[] = [];
    const status: Record<string, 'kept' | 'subsumed'> = {};
    FILES.forEach((f) => {
      const covered = kept.some((k) => C[f][k] >= thr);
      if (covered) status[f] = 'subsumed';
      else {
        status[f] = 'kept';
        kept.push(f);
      }
    });
    return { status, kept };
  }, [thr]);

  const lossless = thr >= 0.9999;

  function onCellMove(e: JSX.TargetedMouseEvent<SVGGElement>, i: number, j: number) {
    setTip({
      x: Math.min(e.clientX + 14, window.innerWidth - 270),
      y: e.clientY + 14,
      i,
      j,
    });
  }

  function tipContent(i: number, j: number) {
    const a = FILES[i],
      b = FILES[j],
      v = C[a][b];
    if (i === j)
      return (
        <>
          <code>{a}</code> vs itself.
        </>
      );
    return (
      <>
        <b>{(v * 100).toFixed(1)}%</b> of <code>{a}</code> already lives inside <code>{b}</code>.
        <br />
        <span class="fh-tip-ctx">
          {v > 0.97
            ? `Keep ${b} and you can drop ${a}.`
            : v < 0.05
              ? `Different rate universe — ${b} barely covers ${a}.`
              : `${b} misses ${((1 - v) * 100).toFixed(1)}% of ${a}'s rates.`}
        </span>
      </>
    );
  }

  return (
    <figure class="fh-figure">
      <figcaption class="fh-figure-label">
        Figure 2 · Containment heatmap · Aetna ASA MRFs (7 files)
      </figcaption>
      <div class="fh-widget">
        <svg viewBox="0 0 560 560" role="img" aria-label="Containment heatmap">
          {/* column labels (container) */}
          {FILES.map((f, j) => {
            const cx = left + j * (M + gap) + M / 2;
            return (
              <text
                class={`fh-hm-clabel fh-${status[f]}`}
                x={cx}
                y={padTop - 12}
                text-anchor="middle"
                transform={`rotate(-35 ${cx} ${padTop - 12})`}
              >
                {f}
              </text>
            );
          })}
          <text
            class="fh-hm-axis"
            x={left + (n * (M + gap)) / 2}
            y={22}
            text-anchor="middle"
          >
            container file (column) →
          </text>

          {/* row labels + cells */}
          {FILES.map((a, i) => {
            const cy = padTop + i * (M + gap) + M / 2;
            const rowDim = status[a] === 'subsumed';
            return (
              <>
                <text
                  class={`fh-hm-clabel fh-${status[a]}`}
                  x={left - 10}
                  y={cy + 4}
                  text-anchor="end"
                >
                  {a}
                </text>
                {FILES.map((b, j) => {
                  const v = C[a][b];
                  const rx = left + j * (M + gap),
                    ry = padTop + i * (M + gap);
                  return (
                    <g
                      class={`fh-hm-cell${rowDim ? ' fh-dim' : ''}`}
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
            x={14}
            y={padTop + (n * (M + gap)) / 2}
            text-anchor="middle"
            transform={`rotate(-90 14 ${padTop + (n * (M + gap)) / 2})`}
          >
            contained file (row)
          </text>
        </svg>

        <div class="fh-legend">
          <span>disjoint</span>
          <span class="fh-legend-scale"></span>
          <span>fully covered</span>
        </div>

        <div class="fh-controls">
          <div class="fh-control-row">
            <label for="hm-thr">Collapse files contained at ≥</label>
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
              ? 'At 100% this is lossless — the dropped files add zero rates.'
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
