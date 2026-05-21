/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';

// Bottom-K MinHash playground — ported verbatim (math + constants) from
// source_widgets/minhash-playground.html, re-skinned to the site's monochrome
// palette. The estimator, buildSets/merge, and σ logic are unchanged.

const N = 2_000_000; // |A| = |B|, items per set
const K_STOPS = [
  1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000,
];

// fast 32-bit integer hash (mulberry-style finalizer), salted per resample
function h32(x: number, salt: number): number {
  x = (x ^ salt) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}

interface BuiltSets {
  prefixBoth: Uint32Array;
  uLen: number;
  builtJ: number;
  unionCard: number;
}

// Rebuilt only when the set changes (true-J or resample). The K slider then
// just reads prefixBoth[K]/K — O(1) — so it stays instant.
function buildSets(J: number, salt: number): BuiltSets {
  const s = Math.round((2 * N * J) / (1 + J)); // shared items; J = s/(2N - s)
  const aOnly = N - s,
    bOnly = N - s;
  const builtJ = s / (2 * N - s);

  const HA = new Uint32Array(N),
    HB = new Uint32Array(N);
  for (let i = 0; i < s; i++) {
    const h = h32(i, salt);
    HA[i] = h;
    HB[i] = h;
  }
  for (let i = 0; i < aOnly; i++) HA[s + i] = h32(1_000_000_000 + i, salt);
  for (let i = 0; i < bOnly; i++) HB[s + i] = h32(2_000_000_000 + i, salt);
  HA.sort();
  HB.sort();

  // merge to distinct union, flag values present in both (equal-merge)
  const U = new Uint32Array(2 * N);
  const prefixBoth = new Uint32Array(2 * N + 1);
  let i = 0,
    j = 0,
    n = 0,
    both = 0,
    prev = -1;
  while (i < N || j < N) {
    let v: number,
      inBoth = false;
    if (j >= N || (i < N && HA[i] < HB[j])) v = HA[i++];
    else if (i >= N || HB[j] < HA[i]) v = HB[j++];
    else {
      v = HA[i++];
      j++;
      inBoth = true;
    } // equal → in both A and B
    if (n === 0 || v !== prev) {
      if (inBoth) both++;
      U[n] = v;
      prefixBoth[++n] = both;
      prev = v;
    } else if (inBoth) {
      both++;
      prefixBoth[n] = both;
    } // collapse dup, keep both-count
  }
  return { prefixBoth, uLen: n, builtJ, unionCard: n };
}

const W = 680,
  padX = 24,
  axisY = 52;

function NumberLine({ J, est }: { J: number; est: number }) {
  const x = (v: number) => padX + (W - 2 * padX) * v;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox="0 0 680 96" role="img" aria-label="Estimate vs true on a number line">
      <line x1={padX} y1={axisY} x2={W - padX} y2={axisY} stroke="var(--rule)" />
      {ticks.map((t) => (
        <g>
          <line x1={x(t)} y1={axisY - 5} x2={x(t)} y2={axisY + 5} stroke="var(--rule)" />
          <text x={x(t)} y={axisY + 22} text-anchor="middle" font-size="11" fill="var(--ink-mute)">
            {t.toFixed(2)}
          </text>
        </g>
      ))}
      <line x1={x(J)} y1={axisY - 22} x2={x(J)} y2={axisY + 8} stroke="var(--ink)" stroke-width="2" />
      <text x={x(J)} y={axisY - 26} text-anchor="middle" font-size="11" fill="var(--ink)">
        true
      </text>
      <circle cx={x(est)} cy={axisY} r="7" fill="var(--ink)" opacity="0.9" />
      <text x={x(est)} y={axisY + 40} text-anchor="middle" font-size="11" fill="var(--ink-mute)">
        estimate
      </text>
    </svg>
  );
}

export default function MinHashPlayground() {
  const [jtRaw, setJtRaw] = useState(0.5);
  const [kIndex, setKIndex] = useState(9);
  const [salt, setSalt] = useState(1);

  const built = useMemo(() => buildSets(jtRaw, salt), [jtRaw, salt]);
  const { prefixBoth, uLen, builtJ, unionCard } = built;

  const K = K_STOPS[kIndex];
  const kk = Math.min(K, uLen);
  const est = prefixBoth[kk] / kk;
  const J = builtJ; // honest: use the set we actually built
  const err = Math.abs(est - J);
  const sigma = Math.sqrt((J * (1 - J)) / K); // theoretical SD of the estimator
  const bad = err > 2 * sigma + 1e-9;

  const pct = (K / unionCard) * 100;
  const pctStr = pct.toFixed(K / unionCard < 0.01 ? 2 : 1);

  return (
    <figure class="fh-figure">
      <figcaption class="fh-figure-label">
        Figure 1 · Bottom-K MinHash, computed live in your browser
      </figcaption>
      <div class="fh-widget">
        <div class="fh-ro-row">
          <div class="fh-ro">
            <div class="fh-ro-v">{J.toFixed(2)}</div>
            <div class="fh-ro-l">true Jaccard</div>
          </div>
          <div class="fh-ro">
            <div class="fh-ro-v">{est.toFixed(4)}</div>
            <div class="fh-ro-l">estimate from K hashes</div>
          </div>
          <div class={`fh-ro fh-err${bad ? ' fh-bad' : ''}`}>
            <div class="fh-ro-v">{err.toFixed(4)}</div>
            <div class="fh-ro-l">abs error</div>
          </div>
        </div>

        <NumberLine J={J} est={est} />

        <div class="fh-controls">
          <div class="fh-control-row">
            <label for="mh-jt">true Jaccard</label>
            <input
              id="mh-jt"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={jtRaw}
              onInput={(e) => setJtRaw(+(e.currentTarget as HTMLInputElement).value)}
            />
            <span class="fh-cv">{J.toFixed(2)}</span>
          </div>
          <div class="fh-control-row">
            <label for="mh-kk">signature size K</label>
            <input
              id="mh-kk"
              type="range"
              min="0"
              max="9"
              step="1"
              value={kIndex}
              onInput={(e) => setKIndex(+(e.currentTarget as HTMLInputElement).value)}
            />
            <span class="fh-cv">{K.toLocaleString()}</span>
          </div>
          <p class="fh-scale-note">
            signature = {K.toLocaleString()} of {unionCard.toLocaleString()} distinct items (
            {pctStr}% of the data)
          </p>
          <button
            class="fh-download fh-no-arrow"
            onClick={() => setSalt((s) => (s * 1664525 + 1013904223) >>> 0)}
          >
            Resample hashes
          </button>
        </div>

        <p class="fh-widget-note">
          At K = {K.toLocaleString()} the estimator's theoretical std-dev is{' '}
          <b>σ ≈ {sigma.toFixed(4)}</b> (∝ 1/√K). Shrink K and watch the estimate get noisy;
          at the default K = 1,000,000 it's dead-on. Production runs this same K = 1,000,000
          over ~700,000,000 distinct rates per file — a 0.0001% sketch — which is why the
          report's numbers land within 0.02% of exact ground truth.
        </p>
      </div>
    </figure>
  );
}
