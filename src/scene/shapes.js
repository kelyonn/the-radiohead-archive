// Procedural point-cloud sculptures — one per album.
// Each generator returns { pos: Float32Array(n*3), tone: Float32Array(n) }.
// `tone` (0..1) picks a colour from the album palette in the vertex shader.

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (r) => {
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const sphereDir = (r, out = [0, 0, 0]) => {
  const z = r() * 2 - 1;
  const t = r() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  out[0] = s * Math.cos(t); out[1] = s * Math.sin(t); out[2] = z;
  return out;
};

// --- lattice value noise (deterministic, no deps) ---
function makeNoise2(seed) {
  const r = mulberry32(seed);
  const T = new Float32Array(256 * 256);
  for (let i = 0; i < T.length; i++) T[i] = r();
  const at = (x, y) => T[((y & 255) << 8) | (x & 255)];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = sm(x - xi), fy = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

function alloc(n) {
  return { pos: new Float32Array(n * 3), tone: new Float32Array(n) };
}

// 01 — Pablo Honey: a noisy, spiked, overdriven sphere
function noisySphere(n) {
  const r = mulberry32(11);
  const noise = makeNoise2(3);
  const o = alloc(n);
  const d = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    sphereDir(r, d);
    const k = r();
    let rad;
    if (k < 0.78) {
      // distorted shell: high-frequency noise = "overdrive"
      const wob = noise(d[0] * 5 + 10, d[1] * 5 + d[2] * 3) * 2 - 1;
      const wob2 = noise(d[1] * 14, d[2] * 14 + d[0] * 9) * 2 - 1;
      rad = 17 + wob * 5 + wob2 * 1.6 + gauss(r) * 0.45;
      o.tone[i] = 0.25 + 0.35 * (wob * 0.5 + 0.5) + r() * 0.1;
    } else if (k < 0.92) {
      // spikes / feedback rays
      const ray = Math.floor(noise(d[0] * 3, d[2] * 3 + 20) * 7) / 7;
      rad = 18 + Math.pow(r(), 2.2) * 17 * (0.4 + ray);
      o.tone[i] = 0.75 + r() * 0.25;
    } else {
      rad = 22 + Math.abs(gauss(r)) * 8;
      o.tone[i] = 1;
    }
    o.pos[i * 3] = d[0] * rad;
    o.pos[i * 3 + 1] = d[1] * rad;
    o.pos[i * 3 + 2] = d[2] * rad;
  }
  return o;
}

// 02 — The Bends: double helix with rungs
function helix(n) {
  const r = mulberry32(22);
  const o = alloc(n);
  const H = 28, turns = 3.2, R = 9;
  for (let i = 0; i < n; i++) {
    const k = r();
    const y = (r() * 2 - 1) * H;
    const ang = (y / H) * Math.PI * turns;
    const rad = R * (1 + 0.18 * Math.sin(y * 0.2));
    let x, z, tone;
    if (k < 0.7) {
      const strand = r() < 0.5 ? 0 : Math.PI;
      const a = ang + strand;
      x = Math.cos(a) * rad + gauss(r) * 0.7;
      z = Math.sin(a) * rad + gauss(r) * 0.7;
      tone = strand === 0 ? 0.05 + r() * 0.15 : 0.8 + r() * 0.2;
    } else if (k < 0.92) {
      // rungs: interpolate between the two strands at quantised heights
      const yy = Math.round(y / 2.4) * 2.4;
      const a = (yy / H) * Math.PI * turns;
      const t = r();
      x = Math.cos(a) * rad * (1 - 2 * t) + gauss(r) * 0.25;
      z = Math.sin(a) * rad * (1 - 2 * t) + gauss(r) * 0.25;
      o.pos[i * 3 + 1] = yy + gauss(r) * 0.2;
      o.pos[i * 3] = x; o.pos[i * 3 + 2] = z;
      o.tone[i] = 0.5 + (t - 0.5) * 0.3;
      continue;
    } else {
      // heartbeat halo
      const a = r() * Math.PI * 2, rr = 14 + Math.abs(gauss(r)) * 10;
      x = Math.cos(a) * rr; z = Math.sin(a) * rr; tone = 0.5;
    }
    o.pos[i * 3] = x; o.pos[i * 3 + 1] = y + gauss(r) * 0.3; o.pos[i * 3 + 2] = z;
    o.tone[i] = tone;
  }
  return o;
}

// 03 — OK Computer: wireframe motorway to a vanishing point
function highway(n) {
  const r = mulberry32(33);
  const o = alloc(n);
  const floorY = -11;
  const zNear = 34, zFar = -70;
  for (let i = 0; i < n; i++) {
    const k = r();
    let x, y, z, tone;
    z = zFar + r() * (zNear - zFar);
    if (k < 0.34) {
      // lane lines (solid edges, dashed centre)
      const lane = Math.floor(r() * 5) - 2;
      x = lane * 6 + gauss(r) * 0.12;
      const dashed = lane === 0 || Math.abs(lane) === 1;
      if (dashed && Math.floor((z + 200) / 4) % 2 === 0) z += 2;
      y = floorY + gauss(r) * 0.08; tone = 0.05;
    } else if (k < 0.5) {
      // crash barriers
      const side = r() < 0.5 ? -1 : 1;
      x = side * 17 + gauss(r) * 0.12; y = floorY + r() * 1.6; tone = 0.4;
    } else if (k < 0.7) {
      // light posts
      const zz = Math.round(z / 14) * 14;
      const side = r() < 0.5 ? -1 : 1;
      const t = r();
      z = zz + gauss(r) * 0.1;
      if (t < 0.7) { x = side * 19; y = floorY + r() * 20; tone = 0.9; }
      else { x = side * (19 - r() * 7); y = floorY + 20 + gauss(r) * 0.1; tone = 1; }
    } else if (k < 0.86) {
      // ground grid
      x = (r() * 2 - 1) * 60;
      z = Math.round(z / 6) * 6 + gauss(r) * 0.08;
      y = floorY - 0.4; tone = 0.15 + r() * 0.1;
      if (Math.abs(x) < 17) y = floorY - 0.4;
    } else {
      // sky grid: faint horizon lines & drifting data motes
      x = (r() * 2 - 1) * 70; y = floorY + 4 + r() * 38; z = zFar + r() * 40; tone = 0.6 + r() * 0.4;
    }
    o.pos[i * 3] = x; o.pos[i * 3 + 1] = y + 3; o.pos[i * 3 + 2] = z * 0.62;
    o.tone[i] = tone;
  }
  return o;
}

// 04 — Kid A: faceted ice mountains + contour lines
function iceTerrain(n) {
  const r = mulberry32(44);
  const noise = makeNoise2(9);
  const o = alloc(n);
  const ridged = (x, z) => {
    let amp = 1, f = 0.045, sum = 0, norm = 0;
    for (let i = 0; i < 5; i++) {
      const v = 1 - Math.abs(noise(x * f + i * 7.1, z * f + i * 3.3) * 2 - 1);
      sum += v * v * amp; norm += amp; amp *= 0.5; f *= 2.05;
    }
    return sum / norm;
  };
  const height = (x, z) => {
    // quantise to facets for the low-poly look
    const q = 3.2;
    const gx = x / q, gz = z / q;
    const x0 = Math.floor(gx) * q, z0 = Math.floor(gz) * q;
    const fx = gx - Math.floor(gx), fz = gz - Math.floor(gz);
    const h00 = ridged(x0, z0), h10 = ridged(x0 + q, z0), h01 = ridged(x0, z0 + q), h11 = ridged(x0 + q, z0 + q);
    const h = fx + fz < 1 ? h00 + (h10 - h00) * fx + (h01 - h00) * fz : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
    const fall = Math.max(0, 1 - Math.pow(Math.hypot(x, z * 1.15) / 52, 2.5));
    return h * 34 * fall;
  };
  for (let i = 0; i < n; i++) {
    const k = r();
    let x = (r() * 2 - 1) * 52, z = (r() * 2 - 1) * 46;
    if (k < 0.32) {
      // contour / grid lines
      if (r() < 0.5) x = Math.round(x / 3.2) * 3.2; else z = Math.round(z / 3.2) * 3.2;
    }
    const h = height(x, z);
    if (k > 0.94) {
      // falling ice dust
      o.pos[i * 3] = x; o.pos[i * 3 + 1] = -10 + h + r() * 26; o.pos[i * 3 + 2] = z;
      o.tone[i] = 1; continue;
    }
    o.pos[i * 3] = x; o.pos[i * 3 + 1] = -14 + h; o.pos[i * 3 + 2] = z;
    // peaks white, valleys blue, a few red 'glitches'
    o.tone[i] = r() < 0.012 ? 0.5 : Math.min(1, Math.max(0, 0.0 + (h / 34) * 0.1)) + (h < 6 ? 0.85 : 0);
  }
  return o;
}

// 05 — Amnesiac: (3,5) torus knot
function knot(n) {
  const r = mulberry32(55);
  const o = alloc(n);
  const P = 3, Q = 5;
  const curve = (t, out) => {
    const rr = 2 + Math.cos(Q * t);
    out[0] = rr * Math.cos(P * t) * 8;
    out[1] = rr * Math.sin(P * t) * 8;
    out[2] = -Math.sin(Q * t) * 8 * 1.4;
  };
  const a = [0, 0, 0], b = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const t = r() * Math.PI * 2;
    curve(t, a); curve(t + 0.001, b);
    // frame
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
    const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    let ux = 0, uy = 0, uz = 1;
    let nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux;
    const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const ang = r() * Math.PI * 2;
    const rad = 2.0 * (r() < 0.8 ? 1 : 1 + r() * 2) * Math.sqrt(r()) + 0.3;
    const c = Math.cos(ang) * rad, s = Math.sin(ang) * rad;
    o.pos[i * 3] = a[0] + nx * c + bx * s;
    o.pos[i * 3 + 1] = a[1] + ny * c + by * s;
    o.pos[i * 3 + 2] = a[2] + nz * c + bz * s;
    o.tone[i] = (Math.sin(t * 5) * 0.5 + 0.5) * 0.8 + r() * 0.2;
  }
  return o;
}

// 06 — Hail to the Thief: Lorenz attractor (chaos)
function lorenz(n) {
  const r = mulberry32(66);
  const o = alloc(n);
  const runs = 6;
  const per = Math.ceil(n / runs);
  const dt = 0.0045;
  let idx = 0;
  for (let run = 0; run < runs; run++) {
    let x = 1 + r() * 2, y = 1 + r() * 2, z = 1 + r() * 2;
    for (let s = 0; s < 400; s++) { // burn-in
      const dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
    }
    for (let s = 0; s < per && idx < n; s++, idx++) {
      for (let q = 0; q < 2; q++) {
        const dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
        x += dx * dt; y += dy * dt; z += dz * dt;
      }
      const j = 0.35;
      o.pos[idx * 3] = x * 1.05 + gauss(r) * j;
      o.pos[idx * 3 + 1] = (z - 25) * 1.05 + gauss(r) * j;
      o.pos[idx * 3 + 2] = y * 1.05 + gauss(r) * j;
      o.tone[idx] = Math.min(1, Math.max(0, (x + 20) / 40)) * 0.7 + (run % 3) * 0.1 + r() * 0.1;
    }
  }
  return o;
}

// 07 — In Rainbows: spectrum arcs + nebula dust
function rainbow(n) {
  const r = mulberry32(77);
  const noise = makeNoise2(12);
  const o = alloc(n);
  const bands = 7;
  for (let i = 0; i < n; i++) {
    const k = r();
    let x, y, z, tone;
    if (k < 0.7) {
      const b = Math.floor(r() * bands);
      const rad = 11 + b * 2.9 + gauss(r) * 0.55;
      const a = Math.PI * (0.02 + r() * 0.96);
      x = Math.cos(a) * rad; y = Math.sin(a) * rad - 8;
      z = gauss(r) * (1.2 + b * 0.25) + Math.sin(a * 4 + b) * 2;
      tone = b / (bands - 1);
    } else {
      // luminous drifting nebula around arcs
      const a = r() * Math.PI * 2, rr = Math.pow(r(), 0.6) * 34;
      const nz = noise(Math.cos(a) * 2 + 40, Math.sin(a) * 2 + 40);
      x = Math.cos(a) * rr * 1.25; y = Math.sin(a) * rr * 0.7 - 6 + (nz - 0.5) * 8;
      z = gauss(r) * 8 + (nz - 0.5) * 18;
      tone = (noise(x * 0.07 + 5, y * 0.07) + r() * 0.15) % 1;
    }
    o.pos[i * 3] = x; o.pos[i * 3 + 1] = y; o.pos[i * 3 + 2] = z;
    o.tone[i] = tone;
  }
  return o;
}

// 08 — The King of Limbs: recursive 3D tree
function tree(n) {
  const r = mulberry32(88);
  const o = alloc(n);
  const segs = [];
  const grow = (px, py, pz, dx, dy, dz, len, rad, depth) => {
    const ex = px + dx * len, ey = py + dy * len, ez = pz + dz * len;
    segs.push({ px, py, pz, ex, ey, ez, rad, depth, w: len * (0.25 + rad) });
    if (depth >= 8 || len < 1.2) return;
    const kids = depth < 2 ? 3 : r() < 0.35 ? 3 : 2;
    for (let c = 0; c < kids; c++) {
      // random direction in cone around parent
      let rx = gauss(r), ry = gauss(r), rz = gauss(r);
      const spread = 0.62 + r() * 0.3;
      let nx = dx + rx * spread, ny = dy + ry * spread * 0.8 + 0.12, nz = dz + rz * spread;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      grow(ex, ey, ez, nx, ny, nz, len * (0.72 + r() * 0.12), rad * 0.7, depth + 1);
    }
  };
  grow(0, -26, 0, 0, 1, 0, 11, 1, 0);
  const total = segs.reduce((s, g) => s + g.w, 0);
  const cum = [];
  let acc = 0;
  for (const g of segs) { acc += g.w / total; cum.push(acc); }
  const pick = (u) => { let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; } return segs[lo]; };
  for (let i = 0; i < n; i++) {
    const g = pick(r());
    const t = r();
    const spread = 0.15 + g.rad * 0.9;
    let x = g.px + (g.ex - g.px) * t + gauss(r) * spread;
    let y = g.py + (g.ey - g.py) * t + gauss(r) * spread;
    let z = g.pz + (g.ez - g.pz) * t + gauss(r) * spread;
    let tone = g.depth / 8;
    if (g.depth >= 7 && r() < 0.6) { // canopy glow
      x += gauss(r) * 2.6; y += gauss(r) * 2.6; z += gauss(r) * 2.6; tone = 0.8 + r() * 0.2;
    }
    o.pos[i * 3] = x * 1.0; o.pos[i * 3 + 1] = y * 1.0 + 6; o.pos[i * 3 + 2] = z;
    o.tone[i] = Math.min(1, tone + (r() < 0.01 ? 1 : 0));
  }
  return o;
}

// 09 — A Moon Shaped Pool: crescent moon over rippling water
function moonPool(n) {
  const r = mulberry32(99);
  const o = alloc(n);
  const d = [0, 0, 0];
  const moonC = [-3, 10, 0], moonR = 12.5, cutC = [1.8, 11.5, 2.5], cutR = 11;
  for (let i = 0; i < n; i++) {
    const k = r();
    let x, y, z, tone;
    if (k < 0.42) {
      // crescent: shell points outside the cutting sphere
      for (let tries = 0; tries < 20; tries++) {
        sphereDir(r, d);
        const rad = moonR - Math.pow(r(), 3) * 2.2;
        x = moonC[0] + d[0] * rad; y = moonC[1] + d[1] * rad; z = moonC[2] + d[2] * rad;
        if (Math.hypot(x - cutC[0], y - cutC[1], z - cutC[2]) > cutR) break;
      }
      tone = 0.45 + r() * 0.1;
    } else if (k < 0.9) {
      // ripples on the pool
      const ring = 1 + Math.floor(Math.pow(r(), 0.8) * 11);
      const a = r() * Math.PI * 2;
      const rad = ring * 3.3 + gauss(r) * 0.18;
      x = Math.cos(a) * rad * 1.5; z = Math.sin(a) * rad * 1.5;
      y = -16 + Math.sin(rad * 0.9) * 0.9;
      tone = 0.85 - ring / 14 + r() * 0.05;
    } else {
      // reflection shimmer + stars
      if (r() < 0.5) { x = (r() * 2 - 1) * 45; y = r() * 40 - 5; z = -r() * 30; tone = 0.5; }
      else { const a = r() * Math.PI * 2, rr = Math.abs(gauss(r)) * 4; x = -3 + Math.cos(a) * rr; z = Math.sin(a) * rr * 2; y = -16 + gauss(r) * 5; tone = 0.4; }
    }
    o.pos[i * 3] = x; o.pos[i * 3 + 1] = y; o.pos[i * 3 + 2] = z;
    o.tone[i] = Math.min(1, Math.max(0, tone));
  }
  return o;
}

export const SHAPES = {
  noisy_sphere: noisySphere,
  helix,
  highway,
  ice_terrain: iceTerrain,
  knot,
  lorenz,
  rainbow,
  tree,
  moon_pool: moonPool,
};
