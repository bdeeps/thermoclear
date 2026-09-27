// Shared parts for ThermoClear: physical constants, colours, chart boards, a Sankey drawer, gas
// particles, glass chambers and a few helpers. Scenes are built in "scene units" (a chapter says
// what one unit is): +x to the right, +y up.
import { THREE, M, box, beam, sphere, arrow, clamp } from './kit.js';

// ---------------------------------------------------------------- constants
export const KB = 1.380649e-23;        // J/K, Boltzmann constant (exact since the 2019 SI)
export const NA = 6.02214076e23;       // 1/mol, Avogadro constant (exact)
export const R = KB * NA;              // 8.314 J/(mol·K), gas constant
export const M_AIR = 0.02897;          // kg/mol, dry air
export const M_N2 = 0.028014;          // kg/mol, nitrogen
export const C_WATER = 4186;           // J/(kg·K), liquid water
export const C_ICE = 2100;             // J/(kg·K), ice near −10 °C (Engineering Toolbox: 2.05–2.11)
export const L_FUS = 334000;           // J/kg, latent heat of melting ice at 0 °C
export const L_VAP = 2.257e6;          // J/kg, latent heat of boiling water at 100 °C
export const K0 = 273.15;              // 0 °C in kelvin
export const TAU = Math.PI * 2;

// Colours used everywhere: hot, cold, heat flowing, work, internal energy, entropy.
export const COL = {
  hot: '#ff7a59',
  cold: '#6fb6ff',
  heat: '#ffb547',     // heat Q
  work: '#5ce1a9',     // work W
  inner: '#c49bff',    // internal energy U
  entropy: '#ff5aa0',  // entropy S
  elec: '#8ef0ff',     // electricity
  text: '#e8eef8',
};
export const hex = (c) => new THREE.Color(c).getHex();

// Numbers people can read.
export const fmt = (v, d = 1) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-IN') : v.toFixed(d));
export function fmtJ(J, d = 1) {
  const a = Math.abs(J);
  if (a >= 1e9) return (J / 1e9).toFixed(d) + ' GJ';
  if (a >= 1e6) return (J / 1e6).toFixed(d) + ' MJ';
  if (a >= 1e4) return (J / 1e3).toFixed(a >= 1e5 ? 0 : d) + ' kJ';
  if (a >= 100) return Math.round(J).toLocaleString('en-IN') + ' J';
  return J.toFixed(a >= 10 ? 0 : d) + ' J';
}
export function fmtW(W, d = 1) {
  const a = Math.abs(W);
  if (a >= 1e6) return (W / 1e6).toFixed(d) + ' MW';
  if (a >= 1e3) return (W / 1e3).toFixed(d) + ' kW';
  return W.toFixed(a >= 10 ? 0 : 1) + ' W';
}
export const cel = (T, d = 0) => (T - K0).toFixed(d) + ' °C';
// Very small and very large numbers as 1.4 × 10⁻²¹.
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function sci(v, d = 2) {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  if (e >= -2 && e < 5) return v.toFixed(Math.max(0, d - e));
  return `${(v / 10 ** e).toFixed(d)} × 10${String(e).split('').map((c) => SUP[c]).join('')}`;
}
// A temperature from nanokelvin to thousands of kelvin, in the most readable unit.
export function fmtK(T) {
  if (T >= 10) return Math.round(T) + ' K';
  if (T >= 1) return T.toFixed(1) + ' K';
  const f = (v, u) => (v >= 10 ? Math.round(v) : v.toFixed(1)) + ' ' + u;
  if (T >= 1e-3) return f(T * 1e3, 'mK');
  if (T >= 1e-6) return f(T * 1e6, 'μK');
  if (T >= 1e-9) return f(T * 1e9, 'nK');
  return f(T * 1e12, 'pK');
}

// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logY = false }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = logY
    ? (y) => y0 - ((Math.log10(Math.max(y, 1e-30)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (y0 - y1)
    : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function legend(g, items, x = 24, y = 54, font = 18) {
  g.font = `bold ${font}px sans-serif`;
  for (const [n, c] of items) { g.fillStyle = c; g.fillRect(x, y, 16, 16); g.fillStyle = COL.text; g.fillText(n, x + 22, y + 15); x += 36 + g.measureText(n).width; }
}
// A Sankey diagram: inputs stacked on the left flow into outputs stacked on the right. Band
// thickness is proportional to energy.   ins/outs: [{ label, value, color }]
export function sankey(g, rect, ins, outs, { gap = 14, bar = 16, labelW = 0 } = {}) {
  const I = ins.filter((o) => o.value > 0), O = outs.filter((o) => o.value > 0);
  const tIn = Math.max(1e-12, I.reduce((a, b) => a + b.value, 0)), tOut = Math.max(1e-12, O.reduce((a, b) => a + b.value, 0));
  const avail = (n) => rect.h - gap * Math.max(0, n - 1);
  const sc = Math.min(avail(I.length) / tIn, avail(O.length) / tOut);
  const xl = rect.x + labelW, xr = rect.x + rect.w - labelW;
  const place = (arr, tot) => {
    let y = rect.y + (rect.h - (tot * sc + gap * Math.max(0, arr.length - 1))) / 2;
    return arr.map((o) => { const h = o.value * sc, r = { ...o, y0: y, y1: y + h }; y += h + gap; return r; });
  };
  const L = place(I, tIn), Rr = place(O, tOut);
  let i = 0, j = 0, ui = 0, uj = 0; const lo = L.map(() => 0), ro = Rr.map(() => 0);
  while (i < L.length && j < Rr.length) {
    const take = Math.min(L[i].value - ui, Rr[j].value - uj);
    if (take > 1e-12) {
      const h = take * sc, ly = L[i].y0 + lo[i], ry = Rr[j].y0 + ro[j], x0 = xl + bar, x1 = xr - bar, mx = (x0 + x1) / 2;
      const grad = g.createLinearGradient(x0, 0, x1, 0); grad.addColorStop(0, L[i].color); grad.addColorStop(1, Rr[j].color);
      g.fillStyle = grad; g.globalAlpha = 0.55; g.beginPath();
      g.moveTo(x0, ly); g.bezierCurveTo(mx, ly, mx, ry, x1, ry); g.lineTo(x1, ry + h); g.bezierCurveTo(mx, ry + h, mx, ly + h, x0, ly + h); g.closePath(); g.fill(); g.globalAlpha = 1;
      lo[i] += h; ro[j] += h;
    }
    ui += take; uj += take;
    if (L[i].value - ui <= 1e-12) { i++; ui = 0; }
    if (Rr[j] && Rr[j].value - uj <= 1e-12) { j++; uj = 0; }
  }
  for (const o of L) { g.fillStyle = o.color; g.fillRect(xl, o.y0, bar, Math.max(2, o.y1 - o.y0)); }
  for (const o of Rr) { g.fillStyle = o.color; g.fillRect(xr - bar, o.y0, bar, Math.max(2, o.y1 - o.y0)); }
  return { L, R: Rr, xl, xr, bar };
}
export function sankeyLabels(g, s, unit, { font = 20, small = 17 } = {}) {
  const put = (o, right) => {
    const cy = (o.y0 + o.y1) / 2, a = o.label, b = unit(o.value);
    g.font = `bold ${font}px sans-serif`; g.fillStyle = o.color;
    if (right) { g.fillText(a, s.xr + 8, cy - 2); g.font = `${small}px sans-serif`; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(b, s.xr + 8, cy + small + 1); }
    else { g.fillText(a, s.xl - 8 - g.measureText(a).width, cy - 2); g.font = `${small}px sans-serif`; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(b, s.xl - 8 - g.measureText(b).width, cy + small + 1); }
  };
  s.L.forEach((o) => put(o, false)); s.R.forEach((o) => put(o, true));
}

// ---------------------------------------------------------------- statistics
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function gauss(r) { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
// Maxwell–Boltzmann speed distribution for a gas of molar mass Mm (kg/mol) at T (K): f(v) in 1/(m/s).
export function maxwell(v, T, Mm = M_N2) { const a = Mm / (2 * R * T); return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v); }
export const vrms = (T, Mm = M_N2) => Math.sqrt((3 * R * T) / Mm);
// ln of n choose k, for entropy counting (Stirling-free, exact via lgamma sums for small n).
const LF = [0]; for (let i = 1; i <= 4000; i++) LF[i] = LF[i - 1] + Math.log(i);
export const lnChoose = (n, k) => LF[n] - LF[k] - LF[n - k];

// ---------------------------------------------------------------- 3D pieces
// Glowing dots, one instanced mesh, each with its own colour.
export function dots(n, r, color = 0xffffff, seg = 8) {
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) mesh.setColorAt(i, col);
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// A see-through glass chamber from (x0,y0) to (x1,y1), depth d, with bright edges.
export function chamber(parent, x0, x1, y0, y1, d, { color = 0xcfe8ff, opacity = 0.08, edge = 0x9fb4c8 } = {}) {
  const g = new THREE.Group();
  const w = x1 - x0, h = y1 - y0;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.clear(color, opacity)); glass.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); g.add(glass);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: 0.7 }));
  e.position.copy(glass.position); g.add(e);
  parent.add(g);
  g.glass = glass; g.edges = e;
  return g;
}
// A glass thermometer, bulb at the bottom, standing at (x, y): set(k) fills the column 0→1.
export function thermometer(parent, x, y, z, len = 1.6, color = 0xff3b30) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const tubeM = M.clear(0xffffff, 0.3);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 16, 1, true), tubeM); t.position.y = len / 2 + 0.1; g.add(t);
  const bulb = sphere(0.13, M.glow(color), 20); g.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10), M.glow(color)); g.add(col);
  for (let i = 0; i <= 4; i++) { const tk = box(0.1, 0.012, 0.012, M.glow(0xc8d2e4)); tk.position.set(0.1, 0.2 + (i / 4) * (len - 0.2), 0); g.add(tk); }
  g.set = (k) => { k = clamp(k, 0.02, 1); const L = 0.1 + k * (len - 0.2); col.scale.y = L; col.position.y = L / 2; };
  g.set(0.3);
  g.bulb = bulb; g.col = col; g.len = len;
  return g;
}
// An arrow that ignores depth, aimed from a point along a direction with a length.
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function flowArrow(color, r = 0.05, head = 0.28) {
  const a = arrow(color, 1, head, r);
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.05) a.visible = false;
  };
  return a;
}
// Temperature to colour: deep blue (cold) through white to red-orange (hot), for T in kelvin
// between lo and hi.
const C_COLD = new THREE.Color(0x3b7bff), C_MID = new THREE.Color(0xe8eef8), C_HOT = new THREE.Color(0xff5a2a);
export function tempColor(T, lo = 250, hi = 650, out = new THREE.Color()) {
  const k = clamp((T - lo) / (hi - lo), 0, 1);
  return k < 0.5 ? out.copy(C_COLD).lerp(C_MID, k * 2) : out.copy(C_MID).lerp(C_HOT, (k - 0.5) * 2);
}
// Glowing heat: dull red to white-hot for 0…1.
export function heatColor(k, out = new THREE.Color()) {
  k = clamp(k, 0, 1);
  return out.setRGB(0.25 + 0.75 * Math.min(1, k * 1.6), Math.max(0, k * 1.3 - 0.35), Math.max(0, k * 2 - 1.3));
}
// Little heat "sparks" that drift from a source: spawn(p, v) and step(dt).
export function puffs(parent, n, r, color, rnd) {
  const d = dots(n, r, color); parent.add(d);
  const P = Array.from({ length: n }, () => ({ life: 0, max: 1, p: [0, -99, 0], v: [0, 0, 0] }));
  let acc = 0;
  return {
    mesh: d,
    // rate: puffs per second; at(): start point [x,y,z]; vel(): velocity [vx,vy,vz]; life seconds
    step(dt, rate, at, vel, life = 1.2, shrink = true) {
      acc += rate * dt;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        if (q.life <= 0 && acc >= 1) { acc -= 1; q.life = q.max = life * (0.75 + 0.5 * rnd()); q.p = at(); q.v = vel(); }
        if (q.life > 0) { q.life -= dt; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; }
        const k = q.life / q.max;
        d.place(i, q.p[0], q.p[1], q.p[2], q.life > 0 ? (shrink ? 0.35 + 0.65 * k : 1) : 0.0001);
      }
      if (acc > 20) acc = 20;
      d.done();
    },
    clear() { P.forEach((q) => { q.life = 0; }); acc = 0; },
  };
}

// On a phone-width stage: hide minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// True while the Glassbox studio records the reel: scenes then choose their own camera views.
export const inReel = () => document.body.classList.contains('gb-reel');
// Chart boards sit to the right of the model on screen. In the tall reel video they stack above the
// model instead, so everything fits the portrait frame.
export function reelBoards(boards, x = 0) {
  const r = inReel();
  boards.forEach((b, i) => {
    if (!b.home) b.home = b.mesh.position.clone();
    if (r) { b.mesh.position.set(x, 7.85 - i * 3.05, 0); b.mesh.scale.setScalar(1.3); }
    else { b.mesh.position.copy(b.home); b.mesh.scale.setScalar(1); }
  });
}
export { clamp, beam, box, sphere };
