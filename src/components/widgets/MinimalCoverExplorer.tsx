/** @jsxImportSource preact */
import { useState } from 'preact/hooks';

// Minimal-cover explorer — ported from source_widgets/minimal-cover-explorer.html,
// re-skinned monochrome. RESERVED: not embedded in any current post; ready for a
// future post about minimal set covers across plan files. Data verbatim.

// Exact values from report.md §5 (greedy build order) + §1 totals.
const FILES = [
  { id: 'pl-22z', add: 713_717_840 },
  { id: 'pl-299', add: 92_548_397 },
  { id: 'pl-3i4', add: 10_332_920 },
  { id: 'pl-3dn', add: 0 },
  { id: 'pl-4ux', add: 0 },
  { id: 'pl-4xy', add: 0 },
  { id: 'pl-5to', add: 0 },
];
const TOTAL = 816_599_156; // distinct rate identities across all 7

const cum: number[] = [];
{
  let run = 0;
  for (const f of FILES) {
    run += f.add;
    cum.push(run);
  }
}

const fmtM = (n: number) =>
  n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : (n / 1e6).toFixed(0) + 'M';

// chart geometry
const W = 680,
  H = 280,
  padL = 52,
  padR = 16,
  padT = 18,
  padB = 36;
const x = (i: number) => padL + (W - padL - padR) * (i / 7);
const y = (v: number) => H - padB - (H - padT - padB) * (v / TOTAL);

export default function MinimalCoverExplorer() {
  const [k, setK] = useState(0);

  const covered = k === 0 ? 0 : cum[k - 1];
  const pct = (covered / TOTAL) * 100;
  const pctStr = pct.toFixed(pct >= 99.95 || pct === 0 ? 0 : 1) + '%';

  // step path up to k
  let d = `M ${x(0)} ${y(0)}`;
  for (let i = 0; i < k; i++) {
    d += ` L ${x(i)} ${y(cum[i])} L ${x(i + 1)} ${y(cum[i])}`;
  }

  const note =
    k === 0
      ? 'Drag the slider, or hit the button, to greedily add the file that covers the most new rates.'
      : k < 3
        ? `${3 - k} more file${k < 2 ? 's' : ''} to reach 100%.`
        : `3 files = everything. Files 4–7 (${FILES.slice(3)
            .map((f) => f.id)
            .join(', ')}) add zero new rates — subsumed.`;

  return (
    <figure class="fh-figure">
      <figcaption class="fh-figure-label">
        Figure · Minimal-cover explorer · Aetna ASA MRFs (7 files)
      </figcaption>
      <div class="fh-widget">
        <div class="fh-mc-headline">
          <span class="fh-mc-pct">{pctStr}</span>
          <span class="fh-mc-pct-label">of all distinct rates covered</span>
        </div>
        <div class="fh-mc-bar-track">
          <div class="fh-mc-bar-fill" style={{ width: pct + '%' }}></div>
        </div>
        <p class="fh-mc-sub">
          Keeping <b>{k}</b> of 7 files — <b>{fmtM(covered)}</b> distinct rate identities of{' '}
          <b>816.6M</b> total. Storing all 7 files in full means <b>4.27B</b> publications.
        </p>

        <svg viewBox="0 0 680 280" role="img" aria-label="Cumulative distinct rates as files are added">
          {[0, 0.2, 0.4, 0.6, 0.8].map((g) => {
            const yy = y(g * TOTAL);
            return (
              <>
                <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="var(--rule)" />
                <text x={padL - 8} y={yy + 4} text-anchor="end" font-size="11" fill="var(--ink-faint)">
                  {g.toFixed(1)}B
                </text>
              </>
            );
          })}
          <line
            x1={padL}
            y1={y(TOTAL)}
            x2={W - padR}
            y2={y(TOTAL)}
            stroke="var(--ink-faint)"
            stroke-dasharray="3 3"
          />
          {FILES.map((f, i) => (
            <text
              x={x(i + 1)}
              y={H - 12}
              text-anchor="middle"
              font-size="10.5"
              fill={i < k ? 'var(--ink)' : 'var(--ink-faint)'}
              font-family="var(--font-mono)"
            >
              {f.id}
            </text>
          ))}
          <path d={d} fill="none" stroke="var(--ink)" stroke-width="2.5" />
          {FILES.map((_f, i) => {
            const on = i < k;
            return <circle cx={x(i + 1)} cy={on ? y(cum[i]) : y(0)} r={on ? 5 : 0} fill="var(--ink)" />;
          })}
        </svg>

        <div class="fh-controls">
          <div class="fh-control-row">
            <label for="mc-budget">Files you can ingest</label>
            <input
              id="mc-budget"
              type="range"
              min="0"
              max="7"
              step="1"
              value={k}
              onInput={(e) => setK(+(e.currentTarget as HTMLInputElement).value)}
            />
            <span class="fh-cv" style={{ minWidth: '1.4em' }}>
              {k}
            </span>
          </div>
          <div class="fh-mc-chips">
            {FILES.map((f, i) => {
              const kept = i < k;
              const subsumed = !kept && f.add === 0;
              const cls = kept ? 'fh-mc-chip fh-kept' : subsumed ? 'fh-mc-chip fh-subsumed' : 'fh-mc-chip';
              return (
                <span class={cls}>
                  {f.id}{' '}
                  {kept ? (
                    <span class="fh-mc-add">+{fmtM(f.add)}</span>
                  ) : subsumed ? (
                    <span class="fh-mc-add">+0</span>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
        <p class="fh-widget-note">{note}</p>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button class="fh-download fh-no-arrow" onClick={() => setK((v) => Math.min(7, v + 1))}>
            Add best file
          </button>
          <button class="fh-download fh-no-arrow" onClick={() => setK(0)}>
            Reset
          </button>
        </div>
      </div>
    </figure>
  );
}
