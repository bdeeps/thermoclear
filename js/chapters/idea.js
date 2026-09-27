// Chapter 1: the laws of thermodynamics as three live experiments (1 scene unit ≈ 6.7 cm).
// Touch (zeroth and second laws): two 1-litre boxes of air at 1 atm, one hot and one cold, share a
//   wall. Each holds n = P·V ÷ (R·T) of gas; we fix n = 0.0406 mol (1 L at 20 °C), so each has a
//   heat capacity C = n·(5/2)·R = 0.84 J/K (air is diatomic, Cv = 5/2 R). Heat flows through the
//   wall at Q' = G·(T_hot − T_cold). G is set by the thin films of still air on each side
//   (h ≈ 8 W/m²·K on a 10 × 10 cm wall, both films in series gives about 0.04 W/K; we use 0.06 for
//   a thin metal wall). A foam wall 2 cm thick (k ≈ 0.03 W/m·K) adds 0.015 W/K in series, so about
//   0.012 W/K. Entropy made = C ln(T1/T1₀) + C ln(T2/T2₀), which is always ≥ 0.
//   Molecules: each dot has a fixed random direction-and-size u drawn from a 3D normal
//   distribution, and its velocity is u·√(R·T/M). So the speeds always follow the Maxwell–Boltzmann
//   distribution for the box's temperature, f(v) = 4π (M/2πRT)^{3/2} v² e^{−Mv²/2RT}, with M the
//   molar mass of nitrogen (air is 78 % N₂). At 20 °C the rms speed √(3RT/M) is 511 m/s.
// Piston (first law, ΔU = Q − W): the same 1 L of air under a 10 × 10 cm piston. Pressure is
//   atmosphere plus the load, P = 101,325 Pa + m·g ÷ A. Heating at steady pressure:
//   Q = n·Cp·ΔT, W = P·ΔV = n·R·ΔT, ΔU = n·Cv·ΔT, so W/Q = R/Cp = 2/7 ≈ 29 % for air. With the
//   piston locked, W = 0 and all of Q raises U. Stops limit the volume to 0.3–2.4 L.
// Spread (second law as counting): N molecules start in the left half of a box. With the wall
//   lifted they fly freely (ideal gas, no collisions between dots, mirror walls). The number of ways
//   to have k of N on the left is W = N! ÷ (k!(N−k)!), and Boltzmann's entropy is S = k_B ln W.
//   "Reverse time" flips every velocity, which retraces every path exactly (the motion is
//   reversible), so the gas un-spreads. The chance of finding all N on the left by luck is 2^−N.
import { THREE, M, box, beam, tube } from '../kit.js';
import {
  R, M_N2, K0, COL, hex, board, panelBg, axes, title, line, legend, dots, chamber, thermometer, flowArrow, rng, gauss,
  maxwell, vrms, lnChoose, tempColor, heatColor, fitNarrow, fmtJ, fmtW, sci, inReel, reelBoards, clamp,
} from '../thermo.js';

const N_MOL = 0.0406, CV = 2.5 * R, CP = 3.5 * R, C_BOX = N_MOL * CV;   // 0.844 J/K
const WALLS = { metal: 0.06, foam: 0.012, none: 0 };
const P0 = 101325, AREA = 0.01, G = 9.81;
const VIS = 0.0036;                    // scene units per (m/s) for drawing molecules
const NP = 150, NS = 300;              // molecules per box; most for the spread box
const WIN = 30;                        // seconds on the temperature chart
const PIST = { x0: -1.4, x1: 1.4, y0: 0.45, perL: 1.0, vMin: 0.3, vMax: 2.4, d: 1.7 };
const VIEWS = {
  touch: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
  piston: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
  spread: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
};
const C2K = (c) => c + K0;

export default {
  id: 'idea',
  short: 'The laws, live',
  title: 'Heat flows downhill, and the books always balance',
  subtitle: 'Hot meets cold, a heater pushes a piston, and a gas spreads out and never un-spreads.',
  view: VIEWS.touch,
  learn: `<p><b>Thermodynamics</b> is the science of heat, work and temperature. It rests on four short laws, and they explain everything from an ice cube in your drink to the engine in a car.</p>
    <p><b>Temperature</b> is how fast molecules jiggle. In air at 20 °C the molecules fly at about <b>500 metres a second</b>, some slower, some faster. Hot air's molecules are faster. The board shows their speeds: the curve is the <b>Maxwell–Boltzmann</b> spread.</p>
    <p><b>Zeroth law:</b> put two things in touch and heat flows until they reach the <b>same temperature</b>. That is <b>thermal equilibrium</b>, and it is why a thermometer works: it settles to the temperature of whatever it touches.</p>
    <p><b>First law:</b> energy is never made or destroyed (see EnergyClear). For a gas it reads <b>ΔU = Q − W</b>: the change in the gas's inner energy U equals the heat Q put in, minus the work W the gas does pushing the piston. Switch to <b>Piston</b> and watch the books balance.</p>
    <p><b>Second law:</b> heat flows from hot to cold <b>by itself</b>, never the other way. The reason is counting. There are vastly more ways for energy and molecules to be spread out than bunched up, so things spread. The measure of that spreading is <b>entropy</b>, and in anything left alone it only grows. <b>Third law:</b> you can get ever closer to <b>absolute zero</b>, −273.15 °C, but never reach it (see chapter 5).</p>
    <p class="tip"><b>Try it:</b> in <b>Touch</b>, make one box very hot and watch the red and blue curves slide together. Swap the wall for none at all: nothing flows. In <b>Spread</b>, lift the wall, then press <b>Reverse time</b>. Only a perfect reversal of every molecule could ever put them back.</p>`,
  terms: [
    { t: 'Temperature', d: 'How fast molecules jiggle on average. Measured in °C, or in kelvin (K) from absolute zero.' },
    { t: 'Thermal equilibrium', d: 'When two things in touch stop exchanging heat because they are at the same temperature.' },
    { t: 'Heat (Q)', d: 'Energy that flows because of a temperature difference, always from hotter to colder by itself.' },
    { t: 'Work (W)', d: 'Energy passed on by a push through a distance, like gas pushing a piston up.' },
    { t: 'Internal energy (U)', d: 'All the jiggling and spinning energy of the molecules inside something.' },
    { t: 'Entropy (S)', d: 'A count of how many ways the energy and molecules can be arranged. Left alone, it only grows.' },
  ],
  defaults: { mode: 'touch', th: 250, tc: -50, wall: 'metal', heat: 12, load: 0, lock: false, n: 80 },
  controls: [
    { key: 'mode', type: 'seg', label: 'Experiment', options: [{ v: 'touch', label: 'Touch' }, { v: 'piston', label: 'Piston' }, { v: 'spread', label: 'Spread' }] },
    { key: 'th', type: 'range', label: 'Touch: left box starts at', min: 20, max: 400, step: 5, ends: ['20 °C', '400 °C'], fmt: (v) => `${v} °C (${Math.round(C2K(v))} K)` },
    { key: 'tc', type: 'range', label: 'Touch: right box starts at', min: -150, max: 100, step: 5, ends: ['−150 °C', '100 °C'], fmt: (v) => `${v} °C (${Math.round(C2K(v))} K)` },
    { key: 'wall', type: 'seg', label: 'Touch: the wall between them', options: [{ v: 'metal', label: 'Thin metal' }, { v: 'foam', label: 'Foam' }, { v: 'none', label: 'Gap (no touch)' }] },
    { key: 'heat', type: 'range', label: 'Piston: heat going in (Q per second)', min: -8, max: 20, step: 1, ends: ['cooling', 'heating'], fmt: (v) => (v === 0 ? 'off' : v > 0 ? `+${v} W` : `${v} W (cooling)`) },
    { key: 'load', type: 'range', label: 'Piston: weight on top', min: 0, max: 20, step: 1, ends: ['0 kg', '20 kg'], fmt: (v) => `${v} kg` },
    { key: 'lock', type: 'toggle', label: 'Piston: lock it (no work)' },
    { key: 'n', type: 'range', label: 'Spread: molecules', min: 4, max: 300, step: 1, ends: ['4', '300'], fmt: (v) => v + ' molecules' },
    { key: 'go', type: 'buttons', label: 'Start again', items: [
      { label: 'Restart', act: (s, inst) => inst.restart() },
      { label: 'Reverse time', act: (s, inst) => { s.mode = 'spread'; inst.reverse(); } },
    ] },
  ],
  onChange(s, key) { if (['th', 'tc', 'load', 'n', 'mode'].includes(key)) s._restart = true; },
  quiz: [
    { q: 'A spoon at 20 °C sits in soup at 70 °C. What happens?', options: ['Cold flows from the spoon into the soup', 'Heat flows from the soup into the spoon until they reach the same temperature', 'Nothing, metal doesn’t take heat', 'The spoon ends up hotter than the soup'], answer: 1, why: 'Heat flows from hotter to colder by itself until both are at one temperature: thermal equilibrium. There is no such thing as "cold" flowing.' },
    { q: 'You put 100 J of heat into a gas and it does 30 J of work pushing a piston. How much did its internal energy go up?', options: ['130 J', '100 J', '70 J', '30 J'], answer: 2, why: 'First law: ΔU = Q − W = 100 − 30 = 70 J. The rest of the energy left as work on the piston.' },
    { q: 'Why does a gas that has spread through a box never gather back in one half by itself?', options: ['A force pushes it apart', 'There are overwhelmingly more spread-out arrangements than bunched ones, so it is almost impossible', 'Molecules can’t move backwards', 'The box would explode'], answer: 1, why: 'For 100 molecules the chance of all being on one side is 1 in 2¹⁰⁰, about 1 in 10³⁰. Real gases have around 10²² molecules in a litre. That counting is the second law.' },
  ],
  reel: [
    { ms: 5600, caption: 'Hot and cold boxes touch. Fast molecules share their energy until both reach one temperature.', set: { mode: 'touch', th: 300, tc: -100, wall: 'metal' }, act: (s, inst) => inst.restart(), view: { pos: [0, 5.5, 9.4], target: [0, 4.7, 0] }, spin: 0.04 },
    { ms: 5200, caption: 'First law: heat in equals the gas’s energy gain plus the work it does. ΔU = Q − W.', set: { mode: 'piston', heat: 20, load: 5, lock: false }, act: (s, inst) => inst.restart(), view: { pos: [0, 5.5, 9.4], target: [0, 4.7, 0] }, spin: 0.05 },
    { ms: 5800, caption: 'Lift the wall and the gas spreads. Only reversing every molecule could ever put it back.', set: { mode: 'spread', n: 120 }, act: (s, inst) => inst.restart(true), view: { pos: [0, 5.5, 9.4], target: [0, 4.7, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gT = new THREE.Group(), gP = new THREE.Group(), gS = new THREE.Group(); root.add(gT, gP, gS);
    const rnd = rng(7);
    const col = new THREE.Color();
    const base = box(6.0, 0.12, 2.2, M.matte(0x2b3039)); base.position.set(0, 0.06, 0); root.add(base);

    // ---------------------------------------------------------------- touch: two boxes and a wall
    const TB = { l: [-2.75, -0.1], r: [0.1, 2.75], y: [0.45, 3.0], d: 1.6 };
    chamber(gT, TB.l[0], TB.l[1], TB.y[0], TB.y[1], TB.d);
    chamber(gT, TB.r[0], TB.r[1], TB.y[0], TB.y[1], TB.d);
    const wallMat = M.metal(0xc07a4a, { roughness: 0.35 });
    const wall = box(0.2, TB.y[1] - TB.y[0], TB.d, wallMat); wall.position.set(0, (TB.y[0] + TB.y[1]) / 2, 0); gT.add(wall);
    const thL = thermometer(gT, -1.42, 0.85, 0.55, 1.75), thR = thermometer(gT, 1.42, 0.85, 0.55, 1.75, 0x3b7bff);
    const lTL = stage.label('', [-1.42, 0.12, 1.0], gT, 'hot'), lTR = stage.label('', [1.42, 0.12, 1.0], gT, 'hot');
    const qArrow = flowArrow(hex(COL.heat), 0.06, 0.3); gT.add(qArrow);
    const lQ = stage.label('', [0, -0.35, 1.0], gT);
    const molL = dots(NP, 0.055), molR = dots(NP, 0.055); gT.add(molL, molR);
    const mk = (n) => Array.from({ length: n }, () => ({ p: [0, 0, 0], u: [gauss(rnd), gauss(rnd), gauss(rnd)] }));
    const A = mk(NP), B = mk(NP);
    const place = (arr, x0, x1, y0, y1, d) => arr.forEach((m) => { m.p = [x0 + 0.08 + rnd() * (x1 - x0 - 0.16), y0 + 0.08 + rnd() * (y1 - y0 - 0.16), (rnd() - 0.5) * (d - 0.16)]; });

    // ---------------------------------------------------------------- piston: 1 L of air, a heater and a load
    chamber(gP, PIST.x0, PIST.x1, PIST.y0, PIST.y0 + PIST.vMax * PIST.perL + 0.25, PIST.d, { opacity: 0.06 });
    const piston = new THREE.Group(); gP.add(piston);
    const pMat = M.metal(0xb9bec8, { roughness: 0.3 });
    piston.add(box(PIST.x1 - PIST.x0 - 0.04, 0.2, PIST.d - 0.04, pMat));
    const rod = beam([0, 0.1, 0], [0, 0.45, 0], 0.08, pMat); piston.add(rod);
    const plate = box(1.2, 0.06, 1.0, pMat); plate.position.y = 0.53; piston.add(plate);
    const weights = [];
    for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 32), M.metal(0x4a505c, { roughness: 0.5 })); w.position.y = 0.63 + i * 0.16; w.castShadow = true; piston.add(w); weights.push(w); }
    const stopTop = PIST.y0 + PIST.vMax * PIST.perL, stopBot = PIST.y0 + PIST.vMin * PIST.perL;
    for (const x of [PIST.x0 + 0.06, PIST.x1 - 0.06]) for (const y of [stopTop + 0.1, stopBot - 0.1]) { const st = box(0.1, 0.05, PIST.d - 0.1, M.glow(0x6f7886)); st.position.set(x, y, 0); gP.add(st); }
    const coilPts = []; for (let i = 0; i <= 14; i++) coilPts.push([-1.0 + (i / 14) * 2.0, PIST.y0 + 0.12 + (i % 2) * 0.12, 0]);
    const coilMat = new THREE.MeshBasicMaterial({ color: 0x552218, toneMapped: false });
    const coil = tube(coilPts, 0.04, coilMat, false, 120); gP.add(coil);
    const molP = dots(NP, 0.055); gP.add(molP);
    const P = mk(NP);
    const qIn = flowArrow(hex(COL.heat), 0.07, 0.3), wOut = flowArrow(hex(COL.work), 0.07, 0.3); gP.add(qIn, wOut);
    const lPg = stage.label('', [0, 0, 1.0], gP, 'hot'), lHeat = stage.label('', [0, -0.35, 1.0], gP), lW = stage.label('', [0, 0, 0.9], gP);

    // ---------------------------------------------------------------- spread: one long box, a lifting wall
    const SB = { x: [-2.8, 2.8], y: [0.45, 2.95], d: 1.6 };
    chamber(gS, SB.x[0], SB.x[1], SB.y[0], SB.y[1], SB.d);
    const gate = box(0.06, SB.y[1] - SB.y[0] - 0.02, SB.d - 0.02, M.clear(0x8ef0ff, 0.35, { depthWrite: true })); gS.add(gate);
    const molS = dots(NS, 0.06, 0x8ef0ff); gS.add(molS);
    const S0 = Array.from({ length: NS }, () => ({ p: [0, 0, 0], v: [0, 0, 0] }));
    const lLeft = stage.label('', [-1.4, 0.12, 1.0], gS, 'hot'), lRight = stage.label('', [1.4, 0.12, 1.0], gS, 'hot');

    // ---------------------------------------------------------------- state
    const tc = { TL: 523, TR: 223, TL0: 523, TR0: 223, Q: 0, t: 0, rows: [] };
    const pc = { T: 293.15, V: 1, T0: 293.15, V0: 1, Q: 0, W: 0, t: 0, path: [] };
    const sc = { t: 0, lift: 0, dir: 1, hold: 0, rows: [], n: 80, released: false, back: false };
    let S = {}, mode = '', key = '';

    // ---------------------------------------------------------------- boards
    const hist = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (mode === 'touch') {
        title(g, 'Speeds of the molecules', 'Maxwell–Boltzmann');
        const vMax = 1600, bw = 100, nb = vMax / bw;
        const cnt = (arr, T) => { const b = new Array(nb).fill(0); const sq = Math.sqrt((R * T) / M_N2); arr.forEach((m) => { const v = Math.hypot(...m.u) * sq; const i = Math.floor(v / bw); if (i < nb) b[i]++; }); return b; };
        const bL = cnt(A, tc.TL), bR = cnt(B, tc.TR);
        const peak = Math.max(maxwell(Math.sqrt((2 * R * tc.TR) / M_N2), tc.TR), maxwell(Math.sqrt((2 * R * tc.TL) / M_N2), tc.TL)) * bw * 1.25;
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 86, y0: h - 44, xMax: vMax, yMax: Math.max(0.2, peak), xTicks: [0, 400, 800, 1200, 1600], yTicks: [], xFmt: (v) => v + ' m/s' });
        for (let i = 0; i < nb; i++) {
          g.fillStyle = 'rgba(255,122,89,.45)'; g.fillRect(X(i * bw) + 2, Y(bL[i] / NP), X(bw) - X(0) - 4, Y(0) - Y(bL[i] / NP));
          g.fillStyle = 'rgba(111,182,255,.45)'; g.fillRect(X(i * bw) + 2, Y(bR[i] / NP), X(bw) - X(0) - 4, Y(0) - Y(bR[i] / NP));
        }
        const curve = (T) => { const pts = []; for (let v = 0; v <= vMax; v += 20) pts.push([v, maxwell(v, T) * bw]); return pts; };
        line(g, curve(tc.TL), X, Y, COL.hot, 4); line(g, curve(tc.TR), X, Y, COL.cold, 4);
        legend(g, [[`left ${Math.round(tc.TL - K0)} °C`, COL.hot], [`right ${Math.round(tc.TR - K0)} °C`, COL.cold]]);
      } else if (mode === 'piston') {
        title(g, 'The energy books', 'ΔU = Q − W');
        const dU = N_MOL * CV * (pc.T - pc.T0), items = [['Heat in, Q', pc.Q, COL.heat], ['Work out, W', pc.W, COL.work], ['Inner energy gain, ΔU', dU, COL.inner]];
        const mx = Math.max(20, ...items.map((r) => Math.abs(r[1]))) * 1.1, zx = 300, span = w - zx - 30;
        items.forEach(([n, v, c], i) => {
          const y = 76 + i * 76; g.fillStyle = c; g.globalAlpha = 0.85;
          const L = (v / mx) * span; g.fillRect(L >= 0 ? zx : zx + L, y, Math.abs(L), 40); g.globalAlpha = 1;
          g.font = 'bold 21px sans-serif'; g.fillStyle = c; g.fillText(n, 20, y + 27);
          g.fillStyle = '#fff'; g.font = '20px sans-serif'; const t = fmtJ(v); g.fillText(t, L >= 0 ? zx + Math.max(L, 0) + 8 : zx + 8, y + 27);
        });
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(zx, 66); g.lineTo(zx, 300); g.stroke();
        g.font = '19px sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)';
        g.fillText(`Q − W = ${fmtJ(pc.Q - pc.W)}   and   ΔU = ${fmtJ(dU)}`, 20, h - 22);
      } else {
        title(g, 'How many are on the left?', `${sc.n} molecules`);
        const t1 = Math.max(12, sc.t), t0 = t1 - 12;
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 64, y0: h - 44, xMin: t0, xMax: t1, yMax: 1, xTicks: [], yTicks: [0, 0.5, 1], yFmt: (v) => Math.round(v * 100) + '%' });
        const sd = 0.5 / Math.sqrt(sc.n);
        g.fillStyle = 'rgba(142,240,255,.12)'; g.fillRect(X(t0), Y(0.5 + sd), X(t1) - X(t0), Y(0.5 - sd) - Y(0.5 + sd));
        line(g, sc.rows.filter((r) => r[0] >= t0), X, Y, COL.elec, 4);
        g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.65)'; g.fillText('shaded: the usual wobble, ±½√N', X(t0) + 10, Y(0.5 + sd) - 8);
      }
    }, [5.3, 3.4, 0]);
    const chart = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (mode === 'touch') {
        title(g, 'Temperature over time', 'seconds');
        const t1 = Math.max(WIN, tc.t), t0 = t1 - WIN;
        const lo = Math.min(tc.TL0, tc.TR0) - K0, hi = Math.max(tc.TL0, tc.TR0) - K0;
        const pad = Math.max(20, (hi - lo) * 0.1), yMin = Math.floor((lo - pad) / 50) * 50, yMax = Math.ceil((hi + pad) / 50) * 50;
        const yt = []; const step = yMax - yMin > 300 ? 100 : 50; for (let v = yMin; v <= yMax; v += step) yt.push(v);
        const xt = []; for (let v = Math.ceil(t0 / 10) * 10; v <= t1; v += 10) xt.push(v);
        const { X, Y } = axes(g, w, h, { x0: 82, y1: 64, y0: h - 44, xMin: t0, xMax: t1, yMin, yMax, xTicks: xt, yTicks: yt, xFmt: (v) => v + ' s', yFmt: (v) => v + '°' });
        const eq = (tc.TL0 + tc.TR0) / 2 - K0;
        if (S.wall !== 'none') { g.strokeStyle = 'rgba(255,255,255,.55)'; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(t0), Y(eq)); g.lineTo(X(t1), Y(eq)); g.stroke(); g.setLineDash([]); g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(`meet at ${eq.toFixed(0)} °C`, X(t1) - 130, Y(eq) - 8); }
        const rows = tc.rows.filter((r) => r[0] >= t0);
        line(g, rows.map((r) => [r[0], r[1] - K0]), X, Y, COL.hot, 5); line(g, rows.map((r) => [r[0], r[2] - K0]), X, Y, COL.cold, 5);
      } else if (mode === 'piston') {
        title(g, 'Pressure and volume', 'the work is the area under the path');
        const Pk = pc.path.map((r) => r[1] / 1000), yMax = Math.max(160, Math.ceil(Math.max(...Pk, 100) / 40) * 40 + 20);
        const { X, Y } = axes(g, w, h, { x0: 82, y1: 64, y0: h - 44, xMin: 0, xMax: 2.5, yMin: 0, yMax, xTicks: [0, 0.5, 1, 1.5, 2, 2.5], yTicks: [0, 50, 100, 150, 200, 250, 300].filter((v) => v <= yMax), xFmt: (v) => v + ' L', yFmt: (v) => v + ' kPa' });
        if (pc.path.length > 1) {
          g.fillStyle = 'rgba(92,225,169,.25)'; g.beginPath(); g.moveTo(X(pc.path[0][0]), Y(0));
          pc.path.forEach((r) => g.lineTo(X(r[0]), Y(r[1] / 1000))); g.lineTo(X(pc.path[pc.path.length - 1][0]), Y(0)); g.closePath(); g.fill();
        }
        line(g, pc.path.map((r) => [r[0], r[1] / 1000]), X, Y, COL.work, 4);
        const Pn = S.lock ? (N_MOL * R * pc.T) / (pc.V / 1000) : P0 + (S.load * G) / AREA;
        g.fillStyle = COL.work; g.beginPath(); g.arc(X(pc.V), Y(Pn / 1000), 9, 0, 7); g.fill();
      } else {
        const n = sc.n, k = countLeft(), lnW = lnChoose(n, k), lnMax = lnChoose(n, Math.floor(n / 2));
        title(g, 'Count the arrangements', `S = k ln W`);
        const { X, Y } = axes(g, w, h, { x0: 60, y1: 70, y0: h - 44, xMax: n, yMax: 1.08, xTicks: [0, n / 2, n], yTicks: [], xFmt: (v) => Math.round(v) + ' left' });
        const stepK = Math.max(1, Math.ceil(n / 120)), bw = Math.max(1, X(stepK) - X(0) - 1);
        for (let j = 0; j <= n; j += stepK) { const f = Math.exp(lnChoose(n, j) - lnMax); g.fillStyle = j === k || (k >= j && k < j + stepK) ? COL.entropy : 'rgba(196,155,255,.55)'; g.fillRect(X(j) - bw / 2, Y(f), bw, Y(0) - Y(f)); }
        g.font = 'bold 20px sans-serif'; g.fillStyle = COL.entropy;
        g.fillText(`now ${k} left: W = ${sci(Math.exp(lnW))} ways`, 20, 62);
        g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)';
        g.fillText(`all ${n} left: just 1 way`, X(0) + 6, Y(0) - 10 > 90 ? 96 : 96);
      }
    }, [5.3, 1.05, 0]);

    function countLeft() { let k = 0; for (let i = 0; i < sc.n; i++) if (S0[i].p[0] < 0) k++; return k; }

    const restart = (quick = false) => {
      if (mode === 'touch') {
        Object.assign(tc, { TL: C2K(S.th), TR: C2K(S.tc), TL0: C2K(S.th), TR0: C2K(S.tc), Q: 0, t: 0 }); tc.rows.length = 0;
        place(A, TB.l[0], TB.l[1], TB.y[0], TB.y[1], TB.d); place(B, TB.r[0], TB.r[1], TB.y[0], TB.y[1], TB.d);
      } else if (mode === 'piston') {
        Object.assign(pc, { T: 293.15, V: 1, T0: 293.15, V0: 1, Q: 0, W: 0, t: 0 }); pc.path.length = 0;
        const Pk = P0 + (S.load * G) / AREA; pc.V = (N_MOL * R * pc.T) / Pk * 1000; pc.V0 = pc.V; pc.path.push([pc.V, Pk]);
        place(P, PIST.x0, PIST.x1, PIST.y0, PIST.y0 + pc.V * PIST.perL, PIST.d);
      } else {
        sc.n = S.n; sc.t = 0; sc.lift = 0; sc.dir = 1; sc.hold = quick ? 0.3 : 1.2; sc.rows.length = 0; sc.released = false; sc.back = false;
        const sp = Math.sqrt((R * 293.15) / M_N2) * VIS;
        for (let i = 0; i < NS; i++) {
          const m = S0[i];
          m.p = [SB.x[0] + 0.08 + rnd() * (-SB.x[0] - 0.2), SB.y[0] + 0.08 + rnd() * (SB.y[1] - SB.y[0] - 0.16), (rnd() - 0.5) * (SB.d - 0.16)];
          m.v = [gauss(rnd) * sp, gauss(rnd) * sp, gauss(rnd) * sp];
        }
      }
    };
    const reverse = () => {
      if (mode !== 'spread' || !sc.released) return;
      sc.dir = -sc.dir; S0.forEach((m) => { m.v[0] *= -1; m.v[1] *= -1; m.v[2] *= -1; });
      sc.back = sc.dir < 0;
    };
    // Move molecules in a box with mirror walls.
    const fly = (m, v, dt, x0, x1, y0, y1, hz) => {
      for (let k = 0; k < 3; k++) {
        m.p[k] += v[k] * dt;
        const lo = k === 0 ? x0 : k === 1 ? y0 : -hz, hi = k === 0 ? x1 : k === 1 ? y1 : hz;
        if (m.p[k] < lo) { m.p[k] = 2 * lo - m.p[k]; v[k] = -v[k]; }
        if (m.p[k] > hi) { m.p[k] = 2 * hi - m.p[k]; v[k] = -v[k]; }
      }
    };
    const tmpV = [0, 0, 0];
    const flyU = (m, T, dt, x0, x1, y0, y1, hz) => {
      const sq = Math.sqrt((R * T) / M_N2) * VIS;
      tmpV[0] = m.u[0] * sq; tmpV[1] = m.u[1] * sq; tmpV[2] = m.u[2] * sq;
      fly(m, tmpV, dt, x0, x1, y0, y1, hz);
      m.u[0] = tmpV[0] / sq; m.u[1] = tmpV[1] / sq; m.u[2] = tmpV[2] / sq;
      return Math.hypot(...m.u) * sq / VIS;
    };

    return {
      restart: (q) => restart(q), reverse,
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lQ, lHeat, lW]); reelBoards([hist, chart]);
        if (s.mode !== mode) { mode = s.mode; gT.visible = mode === 'touch'; gP.visible = mode === 'piston'; gS.visible = mode === 'spread'; const v = VIEWS[mode]; if (!inReel()) stage.setView(v.pos, v.target, 1.0); s._restart = true; }
        if (s._restart) { s._restart = false; restart(); }
        const r = 0.08;

        if (mode === 'touch') {
          const Gw = WALLS[s.wall] ?? 0, n = 8, h = dt / n;
          for (let i = 0; i < n; i++) { const q = Gw * (tc.TL - tc.TR) * h; tc.TL -= q / C_BOX; tc.TR += q / C_BOX; tc.Q += q; }
          tc.t += dt;
          if (!tc.rows.length || tc.t - tc.rows[tc.rows.length - 1][0] > 0.25) { tc.rows.push([tc.t, tc.TL, tc.TR]); if (tc.rows.length > 400) tc.rows.shift(); }
          A.forEach((m, i) => { const v = flyU(m, tc.TL, dt, TB.l[0] + r, TB.l[1] - r, TB.y[0] + r, TB.y[1] - r, TB.d / 2 - r); molL.place(i, ...m.p); molL.tint(i, tempColor(v * v * M_N2 / (3 * R), 120, 700, col)); });
          B.forEach((m, i) => { const v = flyU(m, tc.TR, dt, TB.r[0] + r, TB.r[1] - r, TB.y[0] + r, TB.y[1] - r, TB.d / 2 - r); molR.place(i, ...m.p); molR.tint(i, tempColor(v * v * M_N2 / (3 * R), 120, 700, col)); });
          molL.done(); molR.done();
          const k = (T) => (T - 100) / 600;
          thL.set(k(tc.TL)); thR.set(k(tc.TR));
          thL.bulb.material.color.copy(tempColor(tc.TL, 150, 650, col)); thL.col.material.color.copy(thL.bulb.material.color);
          thR.bulb.material.color.copy(tempColor(tc.TR, 150, 650, col)); thR.col.material.color.copy(thR.bulb.material.color);
          lTL.element.innerHTML = `<b>${(tc.TL - K0).toFixed(0)} °C</b>`; lTR.element.innerHTML = `<b>${(tc.TR - K0).toFixed(0)} °C</b>`;
          lTL.element.style.setProperty('--c', COL.hot); lTR.element.style.setProperty('--c', COL.cold);
          const flow = Gw * (tc.TL - tc.TR);
          qArrow.aim([-Math.sign(flow || 1) * 0.55, 1.9, 0.95], [Math.sign(flow || 1), 0, 0], Math.min(1.3, Math.abs(flow) * 0.08));
          wall.visible = s.wall !== 'none';
          wallMat.color.setHex(s.wall === 'foam' ? 0xf2d27a : 0xc07a4a); wallMat.metalness = s.wall === 'foam' ? 0 : 0.9; wallMat.roughness = s.wall === 'foam' ? 0.9 : 0.35;
          lQ.element.innerHTML = s.wall === 'none' ? 'a gap: no touch, no heat flow' : `heat flowing: <b>${fmtW(Math.abs(flow))}</b>`;
          const kk = `${tc.rows.length}|${Math.round(tc.TL * 3)}`;
          if (kk !== key) { key = kk; hist.redraw(); chart.redraw(); }
        }

        if (mode === 'piston') {
          const Pk = P0 + (s.load * G) / AREA, n = 8, h = dt / n;
          for (let i = 0; i < n; i++) {
            const Q = s.heat * h; pc.Q += Q;
            if (s.lock) pc.T += Q / (N_MOL * CV);
            else {
              // The piston holds the gas at the load's pressure Pk. If the pressure is off (just
              // unlocked, or pinned against a stop) the gas first relaxes towards Pk. Work is always
              // done against the load: W = Pk·ΔV, and ΔU = Q − W.
              const Pin = (N_MOL * R * pc.T) / (pc.V / 1000);
              let dV;
              if (Math.abs(Pin - Pk) > 50) { const Vt = clamp((N_MOL * R * pc.T) / Pk * 1000, PIST.vMin, PIST.vMax); dV = (Vt - pc.V) * Math.min(1, h * 6); }
              else dV = clamp(pc.V + (R * Q / CP) / Pk * 1000, PIST.vMin, PIST.vMax) - pc.V;
              const Wd = (Pk * dV) / 1000;
              pc.W += Wd; pc.V += dV; pc.T += (Q - Wd) / (N_MOL * CV);
            }
            pc.T = Math.max(60, pc.T);
          }
          pc.t += dt;
          const Pn = (N_MOL * R * pc.T) / (pc.V / 1000);
          const last = pc.path[pc.path.length - 1];
          if (!last || Math.abs(last[0] - pc.V) > 0.004 || Math.abs(last[1] - Pn) > 400) { pc.path.push([pc.V, Pn]); if (pc.path.length > 600) pc.path.shift(); }
          if (pc.T > 1400 || pc.t > 90) restart();
          const top = PIST.y0 + pc.V * PIST.perL;
          piston.position.set(0, top + 0.1, 0);
          weights.forEach((w, i) => { w.visible = s.load > i * 5; });
          P.forEach((m, i) => { const v = flyU(m, pc.T, dt, PIST.x0 + r, PIST.x1 - r, PIST.y0 + r, top - r, PIST.d / 2 - r); molP.place(i, ...m.p); molP.tint(i, tempColor(v * v * M_N2 / (3 * R), 120, 700, col)); });
          molP.done();
          heatColor(s.heat > 0 ? 0.25 + s.heat / 22 : 0.05, coilMat.color); if (s.heat < 0) coilMat.color.setHex(0x3b7bff);
          qIn.aim([-1.9, PIST.y0 + 0.2, 0.9], [0, Math.sign(s.heat || 1), 0], Math.abs(s.heat) * 0.07);
          qIn.position.y = s.heat >= 0 ? PIST.y0 - 0.2 : PIST.y0 + 1.3;
          const Wrate = s.lock ? 0 : s.heat * (R / CP);
          wOut.aim([1.9, top + 0.1, 0.4], [0, Math.sign(Wrate || 1), 0], Math.abs(Wrate) * 0.2);
          lPg.position.set(0, top - 0.35, 1.0); lPg.element.innerHTML = `<b>${(pc.T - K0).toFixed(0)} °C</b> · ${pc.V.toFixed(2)} L · ${(Pn / 1000).toFixed(0)} kPa`;
          lHeat.element.innerHTML = s.heat === 0 ? 'heater off' : s.heat > 0 ? `heater: Q = <b>${s.heat} J</b> each second` : `cooling: <b>${-s.heat} J</b> out each second`;
          lW.position.set(2.6, top + 0.35, 0.9); lW.element.innerHTML = s.lock ? 'locked: <b>no work</b>' : `work on the piston: <b>${(Wrate).toFixed(1)} J/s</b>`;
          const kk = `${pc.path.length}|${Math.round(pc.Q)}|${s.lock}`;
          if (kk !== key) { key = kk; hist.redraw(); chart.redraw(); }
        }

        if (mode === 'spread') {
          if (s.n !== sc.n) { s._restart = true; }
          if (sc.hold > 0) { sc.hold -= dt; if (sc.hold <= 0) sc.released = true; }
          sc.lift = Math.min(1, Math.max(0, sc.lift + (sc.released ? dt * 2 : -dt * 2)));
          const run = sc.released ? dt : 0;
          const gx = 0;
          for (let i = 0; i < NS; i++) {
            const m = S0[i];
            if (i < sc.n) {
              if (!sc.released) fly(m, m.v, dt, SB.x[0] + r, gx - 0.05, SB.y[0] + r, SB.y[1] - r, SB.d / 2 - r);
              else fly(m, m.v, run, SB.x[0] + r, SB.x[1] - r, SB.y[0] + r, SB.y[1] - r, SB.d / 2 - r);
              molS.place(i, ...m.p);
            } else molS.place(i, 0, -50, 0, 0.0001);
          }
          molS.done();
          if (sc.released) {
            sc.t += run * sc.dir;
            if (sc.back && sc.t <= 0) { sc.t = 0; reverse(); sc.released = false; sc.hold = 2.5; sc.back = false; }
          }
          const k = countLeft();
          if (sc.released || !sc.rows.length) { const T = sc.rows.length ? sc.rows[sc.rows.length - 1][0] + dt : 0; sc.rows.push([T, k / sc.n]); if (sc.rows.length > 800) sc.rows.shift(); }
          sc.clock = (sc.clock || 0) + dt;
          gate.position.set(0, (SB.y[0] + SB.y[1]) / 2 + sc.lift * (SB.y[1] - SB.y[0] + 0.1), 0);
          gate.visible = sc.lift < 0.98;
          lLeft.element.innerHTML = `left: <b>${k}</b>`; lRight.element.innerHTML = `right: <b>${sc.n - k}</b>`;
          const kk = `${sc.rows.length}|${k}`;
          if (kk !== key) { key = kk; hist.redraw(); chart.redraw(); }
        }
      },
      readout: (s) => {
        if (mode === 'piston') {
          const dU = N_MOL * CV * (pc.T - pc.T0), Pk = P0 + (s.load * G) / AREA;
          return `<div class="big">ΔU = Q − W</div>
            <div class="row"><span>Heat in so far, Q</span><b style="color:${COL.heat}">${fmtJ(pc.Q)}</b></div>
            <div class="row"><span>Work pushing the piston, W = P ΔV</span><b style="color:${COL.work}">${fmtJ(pc.W)}</b></div>
            <div class="row"><span>Inner energy gain, ΔU = n C<sub>v</sub> ΔT</span><b style="color:${COL.inner}">${fmtJ(dU)}</b></div>
            <div class="row"><span>Gas now</span><b>${(pc.T - K0).toFixed(0)} °C · ${pc.V.toFixed(2)} L</b></div>
            <div class="row"><span>Load pressure, 1 atm + m g ÷ A</span><b>${(Pk / 1000).toFixed(1)} kPa</b></div>
            <small>${s.lock ? 'Locked: the gas can’t push anything, so W = 0 and every joule of heat raises U. The pressure climbs instead.' : 'Free to move, air turns 2/7 of the heat (29%) into work and keeps 5/7 as hotter molecules.'}</small>`;
        }
        if (mode === 'spread') {
          const n = sc.n, k = countLeft(), lnW = lnChoose(n, k), lnMax = lnChoose(n, Math.floor(n / 2));
          const odds = n * Math.log10(2);
          return `<div class="big">${k} of ${n} on the left</div>
            <div class="row"><span>Ways to arrange that, W</span><b>${sci(Math.exp(lnW))}</b></div>
            <div class="row"><span>Entropy, S = k ln W</span><b style="color:${COL.entropy}">${lnW.toFixed(1)} k</b></div>
            <div class="row"><span>Most spread out (half and half)</span><b>${lnMax.toFixed(1)} k</b></div>
            <div class="row"><span>Chance all ${n} are on the left</span><b>1 in ${odds < 5 ? Math.round(2 ** n).toLocaleString('en-IN') : '10<sup>' + odds.toFixed(0) + '</sup>'}</b></div>
            <small>${sc.back ? 'Running backwards: every molecule retraces its path exactly. Nature never does this by itself.' : sc.released ? 'A real litre of air has about 2.5 × 10²² molecules. The chance they all crowd into one half is 1 in 10 to the power of 7.5 × 10²¹: never.' : 'Held on the left by the wall. Lifting it...'}</small>`;
        }
        const flow = (WALLS[s.wall] ?? 0) * (tc.TL - tc.TR);
        const Sgen = C_BOX * Math.log(tc.TL / tc.TL0) + C_BOX * Math.log(tc.TR / tc.TR0);
        return `<div class="big">${(tc.TL - K0).toFixed(0)} °C → ← ${(tc.TR - K0).toFixed(0)} °C</div>
          <div class="row"><span>Average molecule speed, left</span><b style="color:${COL.hot}">${vrms(tc.TL).toFixed(0)} m/s</b></div>
          <div class="row"><span>Average molecule speed, right</span><b style="color:${COL.cold}">${vrms(tc.TR).toFixed(0)} m/s</b></div>
          <div class="row"><span>Heat moved left → right so far</span><b style="color:${COL.heat}">${fmtJ(tc.Q)}</b></div>
          <div class="row"><span>Entropy made, ΔS = Σ C ln(T/T₀)</span><b style="color:${COL.entropy}">+${Sgen.toFixed(3)} J/K</b></div>
          <small>${s.wall === 'none' ? 'Not touching, so no heat flows and each keeps its temperature.' : Math.abs(flow) < 0.05 ? 'Equilibrium: one temperature, no more heat flow. That is the zeroth law.' : 'Heat only flows from the hotter box to the colder one, and entropy only grows.'} Each box: 1 L of air.</small>`;
      },
    };
  },
};
