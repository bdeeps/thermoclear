// Chapter 5: limits and surprises.
// Absolute zero (third law): a cloud of rubidium-87 atoms (m = 86.909 u = 1.443 × 10⁻²⁵ kg) in a
//   vacuum cell with six laser beams. rms speed √(3 k T / m): 293 m/s at room temperature, about
//   7 mm/s at 170 nK. Milestones: dry ice 195 K; liquid nitrogen 77 K; liquid helium 4.2 K; deep
//   space (the cosmic microwave background) 2.725 K; helium-3 evaporation about 0.3 K; dilution
//   refrigerators about 10 mK; the Doppler cooling limit for rubidium about 146 μK; the first
//   Bose–Einstein condensate, 170 nK (JILA, 5 June 1995); a record 38 pK (Bremen drop tower,
//   Deppner et al., PRL 2021). "Cool again" halves the temperature, like a cooling step that removes
//   a fixed fraction of what is left: you can repeat it for ever and never reach 0 K (Nernst's
//   unattainability principle, 1912).
// Maxwell's demon (1867): two boxes of the same gas, 80 molecules each. Molecules keep their own
//   speeds (no collisions between them). A demon at a door in the wall lets fast molecules
//   (faster than the starting median speed) through left → right and slow ones right → left, so the
//   right warms and the left cools with no work done. Each molecule that reaches the door is one
//   yes/no measurement: one bit. Gas entropy, in units of k: S = Σ N_s (ln(V/N_s) + 3/2 ln T_s).
//   Landauer (1961): wiping one bit from memory releases at least k T ln 2 of heat, 2.87 × 10⁻²¹ J at
//   300 K, and adds at least k ln 2 of entropy, which always outweighs what the demon removed
//   (Bennett 1982; measured by Bérut et al., Nature 2012).
// The open fridge (myth-buster): a sealed, well-insulated kitchen of 30 m³ whose air, walls and
//   furniture together hold about 300 kJ/K. With the door open, the compressor runs non-stop at
//   150 W; its COP of about 2 pulls 300 W out of the air in front and dumps 450 W from the back coil
//   into the same room. Net: +150 W, so the room warms about 1.8 °C an hour. With the door shut it
//   still cycles, averaging about 35 W (0.8 kWh a day). Shown 120× fast.
import { THREE, M, box, beam, tube } from '../kit.js';
import { KB, K0, COL, hex, board, panelBg, axes, title, line, dot, dots, sankey, sankeyLabels, puffs, flowArrow, chamber, rng, gauss, tempColor, fitNarrow, inReel, reelBoards, clamp, fmtK, fmtW, sci } from '../thermo.js';

const M_RB = 86.909 * 1.66054e-27;
const MILES = [
  { T: 293, n: 'room' }, { T: 195, n: 'dry ice' }, { T: 77, n: 'liquid nitrogen' }, { T: 4.2, n: 'liquid helium' }, { T: 2.725, n: 'deep space' },
  { T: 0.3, n: 'helium-3' }, { T: 0.01, n: 'dilution fridge' }, { T: 146e-6, n: 'laser cooling' }, { T: 170e-9, n: 'first BEC, 1995' }, { T: 38e-12, n: 'record, 2021' },
];
const technique = (T) => T > 200 ? 'a freezer or dry ice' : T > 77 ? 'liquid nitrogen' : T > 4 ? 'liquid helium' : T > 0.3 ? 'pumped helium' : T > 5e-3 ? 'a dilution refrigerator' : T > 1e-4 ? 'magnetic cooling' : T > 1e-6 ? 'laser cooling' : 'laser plus evaporative cooling';
const DEM = { n: 80, l: [-2.75, -0.1], r: [0.1, 2.75], y: [0.45, 3.0], d: 1.4, door: [1.05, 2.4], vis: 0.004 };
const FR = { C: 3e5, Wopen: 150, cop: 2, Wshut: 35, fast: 120 };
const VIEWS = {
  zero: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
  demon: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
  fridge: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
};
const vRb = (T) => Math.sqrt((3 * KB * T) / M_RB);
function fmtV(v) { return v >= 1 ? v.toFixed(v >= 10 ? 0 : 1) + ' m/s' : v >= 1e-3 ? (v * 1000).toFixed(v >= 0.01 ? 0 : 1) + ' mm/s' : (v * 1e6).toFixed(0) + ' μm/s'; }

export default {
  id: 'limits',
  short: 'Limits and surprises',
  title: 'Absolute zero, a clever demon, and a fridge that heats',
  subtitle: 'Why you can never reach 0 K, why sorting molecules isn’t free, and why an open fridge warms the kitchen.',
  view: VIEWS.zero,
  learn: `<p><b>Third law:</b> as things get colder, molecules slow down, and at <b>absolute zero</b>, 0 K or −273.15 °C, they would have the least motion that quantum physics allows. But every cooling step removes only part of the heat that is left, so you can get closer and closer and <b>never arrive</b>. Walther Nernst worked this out between 1906 and 1912.</p>
    <p>Physicists have come astonishingly close. With <b>laser beams</b> that push on atoms and then let the fastest escape, they cooled rubidium to <b>170 billionths of a kelvin</b> in 1995, and the atoms merged into one quantum blob, a <b>Bose–Einstein condensate</b>. Deep space, by comparison, is a warm 2.7 K.</p>
    <p><b>Maxwell's demon</b> is a thought experiment from 1867. A tiny being opens a door only for fast molecules going one way and slow ones going the other. The gas splits into hot and cold with no work: the second law broken? The catch, found by <b>Rolf Landauer</b> and Charles Bennett, is <b>information</b>. The demon must remember each molecule, and <b>wiping its memory</b> costs at least <b>k T ln 2</b> of heat per bit, which makes more entropy than it removed.</p>
    <p><b>Life</b> seems to break the second law too: a seed builds a tree, beautifully ordered. But living things take in low-entropy food or sunlight and give out heat and waste with far more entropy. The total still grows. Order here is paid for by more disorder elsewhere.</p>
    <p><b>Myth-buster:</b> a fridge does not "make cold". It moves heat. Open its door in a closed kitchen and the room gets <b>warmer</b>, by exactly the electricity it uses. And the second law is about <b>odds</b>, not force: a gas could un-spread by chance, but for real numbers of molecules the chance is so tiny it never happens in the life of the universe.</p>
    <p class="tip"><b>Try it:</b> press <b>Cool again</b> over and over and watch the steps shrink without ever reaching zero. Wake the demon and watch its memory fill. Then open the fridge door and watch the kitchen warm up.</p>`,
  terms: [
    { t: 'Absolute zero', d: '0 K, or −273.15 °C: the coldest possible temperature, which can be approached but never reached.' },
    { t: 'Third law', d: 'As temperature approaches absolute zero, entropy approaches a minimum, and 0 K can’t be reached in a finite number of steps.' },
    { t: 'Bose–Einstein condensate', d: 'Atoms so cold they share one quantum state and act as a single wave. First made in 1995.' },
    { t: 'Maxwell’s demon', d: 'An imaginary being that sorts fast and slow molecules. Its memory costs are what save the second law.' },
    { t: 'Landauer’s principle', d: 'Erasing one bit of information releases at least k T ln 2 of heat: about 3 × 10⁻²¹ J at room temperature.' },
  ],
  defaults: { show: 'zero', temp: 293, demon: true, door: true },
  controls: [
    { key: 'show', type: 'seg', label: 'Show', options: [{ v: 'zero', label: 'Absolute zero' }, { v: 'demon', label: 'Maxwell’s demon' }, { v: 'fridge', label: 'Open fridge' }] },
    { key: 'temp', type: 'log', label: 'Absolute zero: temperature', min: 1e-10, max: 300, ends: ['0.1 nK', '300 K'], fmt: (v) => fmtK(v) },
    { key: 'go', type: 'buttons', label: 'Absolute zero', items: [{ label: 'Cool again (halve it)', act: (s) => { s.show = 'zero'; s.temp = Math.max(1e-10, s.temp / 2); } }, { label: 'Back to room', act: (s) => { s.show = 'zero'; s.temp = 293; } }] },
    { key: 'demon', type: 'toggle', label: 'Demon: awake and sorting' },
    { key: 'go2', type: 'buttons', label: 'Demon', items: [{ label: 'Mix the gas again', act: (s, inst) => { s.show = 'demon'; inst.mix(); } }] },
    { key: 'door', type: 'toggle', label: 'Fridge: door open' },
  ],
  onChange(s, key) { if (key === 'temp') s.show = 'zero'; if (key === 'demon') s.show = 'demon'; if (key === 'door') { s.show = 'fridge'; s._room = true; } },
  quiz: [
    { q: 'Why can’t anything be cooled all the way to absolute zero?', options: ['Freezers aren’t strong enough yet', 'Each cooling step removes only part of what’s left, so you get closer for ever without arriving', 'Atoms would explode', 'It is too expensive'], answer: 1, why: 'That is the third law. Each step gets you a fraction closer, like halving a distance over and over. Scientists have reached billionths of a kelvin, but never zero.' },
    { q: 'What stops Maxwell’s demon from breaking the second law?', options: ['Demons don’t exist', 'The door is too heavy', 'It must record each molecule, and erasing that memory makes at least as much entropy as the sorting removed', 'The molecules are too fast to see'], answer: 2, why: 'Landauer and Bennett showed that information has a cost: wiping each bit releases at least k T ln 2 of heat. The books still balance in the second law’s favour.' },
    { q: 'You leave the fridge door open in a closed, sealed kitchen. What happens to the kitchen?', options: ['It cools down', 'It warms up', 'It stays the same', 'It cools, then freezes'], answer: 1, why: 'The fridge pulls heat from the air in front and dumps it, plus its own electricity, out of the back into the same room. Net effect: the room gains the electricity as heat.' },
  ],
  reel: [
    { ms: 5600, caption: 'Each cooling step takes away part of what’s left. Absolute zero can be approached, never reached.', set: { show: 'zero' }, anim: { temp: [293, 1e-9, true] }, view: { pos: [-0.6, 5.5, 9.4], target: [-0.6, 4.7, 0] }, spin: 0.06 },
    { ms: 5600, caption: 'Maxwell’s demon sorts fast from slow, but erasing its memory costs more entropy than it saves.', set: { show: 'demon', demon: true }, act: (s, inst) => inst.mix(), view: { pos: [0, 5.5, 9.4], target: [0, 4.7, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gZ = new THREE.Group(), gD = new THREE.Group(), gF = new THREE.Group(); root.add(gZ, gD, gF);
    const rnd = rng(55);
    const col = new THREE.Color();
    const ground = box(6.0, 0.1, 2.6, M.matte(0x2b3039)); ground.position.set(0, 0.05, 0); root.add(ground);

    // ---------------------------------------------------------------- absolute zero: a vacuum cell and six lasers
    const C0 = [-0.6, 1.75, 0];
    const cell = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 2.0), M.clear(0xcfe8ff, 0.07)); cell.position.set(...C0); gZ.add(cell);
    const cellE = new THREE.LineSegments(new THREE.EdgesGeometry(cell.geometry), new THREE.LineBasicMaterial({ color: 0x9fb4c8 })); cellE.position.copy(cell.position); gZ.add(cellE);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false });
    const beams = [];
    for (const [a, b] of [[[-2.5, 0, 0], [2.5, 0, 0]], [[0, -1.6, 0], [0, 1.4, 0]], [[0, 0, -2.2], [0, 0, 2.2]]]) {
      const m = beam(a.map((v, i) => v + C0[i]), b.map((v, i) => v + C0[i]), 0.09, beamMat, 12); m.castShadow = false; gZ.add(m); beams.push(m);
    }
    for (const p of [[-2.6, 0, 0], [2.6, 0, 0], [0, 0, -2.3], [0, 0, 2.3]]) { const l = box(0.3, 0.3, 0.3, M.metal(0x4a505c)); l.position.set(p[0] + C0[0], p[1] + C0[1], p[2] + C0[2]); if (Math.abs(p[0]) > 0) gZ.add(l); }
    const NA = 220, atoms = dots(NA, 0.035, 0xffb547); gZ.add(atoms);
    const at = Array.from({ length: NA }, () => ({ p: [gauss(rnd), gauss(rnd), gauss(rnd)], ph: [rnd() * 6, rnd() * 6, rnd() * 6], w: 0.6 + rnd() }));
    const lCloud = stage.label('', [C0[0], C0[1] + 1.35, 0.5], gZ, 'hot');
    const zs = { T: 293, steps: 0, hist: [293] };

    // ---------------------------------------------------------------- the demon
    chamber(gD, DEM.l[0], DEM.l[1], DEM.y[0], DEM.y[1], DEM.d);
    chamber(gD, DEM.r[0], DEM.r[1], DEM.y[0], DEM.y[1], DEM.d);
    const wallM = M.matte(0x3a3f4b);
    const wLow = box(0.2, DEM.door[0] - DEM.y[0], DEM.d, wallM); wLow.position.set(0, (DEM.y[0] + DEM.door[0]) / 2, 0); gD.add(wLow);
    const wHigh = box(0.2, DEM.y[1] - DEM.door[1], DEM.d, wallM); wHigh.position.set(0, (DEM.y[1] + DEM.door[1]) / 2, 0); gD.add(wHigh);
    const doorM = box(0.08, DEM.door[1] - DEM.door[0], DEM.d, M.clear(0xffb547, 0.45, { depthWrite: true })); doorM.position.set(0, (DEM.door[0] + DEM.door[1]) / 2, 0); gD.add(doorM);
    const demon = new THREE.Group(); demon.position.set(0, DEM.y[1] + 0.35, 0.3); gD.add(demon);
    const dBody = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16), M.plastic(0xc0304a, { roughness: 0.4 })); demon.add(dBody);
    for (const x of [-0.09, 0.09]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.glow(0xffffff)); e.position.set(x, 0.06, 0.22); demon.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), M.glow(0x111111)); p.position.set(x, 0.06, 0.27); demon.add(p); }
    for (const x of [-0.14, 0.14]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 8), M.plastic(0xc0304a)); h.position.set(x, 0.3, 0); h.rotation.z = -x * 2; demon.add(h); }
    const molD = dots(DEM.n * 2, 0.055); gD.add(molD);
    const md = Array.from({ length: DEM.n * 2 }, () => ({ p: [0, 0, 0], v: [0, 0, 0] }));
    const lL = stage.label('', [-1.42, 0.12, 1.0], gD, 'hot'), lR = stage.label('', [1.42, 0.12, 1.0], gD, 'hot');
    lL.element.style.setProperty('--c', COL.cold); lR.element.style.setProperty('--c', COL.hot);
    const ds = { bits: 0, passed: 0, t: 0, rows: [], v0: 1, T0: 300, flash: 0, tape: [] };

    // ---------------------------------------------------------------- the open fridge in a sealed kitchen
    const K = { x0: -2.8, x1: 2.3, y1: 2.9, d: 2.2 };
    const kFloor = box(K.x1 - K.x0, 0.06, K.d, M.matte(0x8a6a44)); kFloor.position.set((K.x0 + K.x1) / 2, 0.13, 0); gF.add(kFloor);
    const kBack = box(K.x1 - K.x0, K.y1, 0.08, M.matte(0xd9dde3)); kBack.position.set((K.x0 + K.x1) / 2, K.y1 / 2 + 0.1, -K.d / 2); gF.add(kBack);
    const kLeft = box(0.08, K.y1, K.d, M.clear(0xd9dde3, 0.3)); kLeft.position.set(K.x0, K.y1 / 2 + 0.1, 0); gF.add(kLeft);
    const kRight = box(0.08, K.y1, K.d, M.clear(0xd9dde3, 0.3)); kRight.position.set(K.x1, K.y1 / 2 + 0.1, 0); gF.add(kRight);
    const kAir = new THREE.Mesh(new THREE.BoxGeometry(K.x1 - K.x0 - 0.12, K.y1 - 0.1, K.d - 0.12), M.clear(0xff9a6a, 0.05)); kAir.position.set((K.x0 + K.x1) / 2, K.y1 / 2 + 0.15, 0); gF.add(kAir);
    const fr = new THREE.Group(); fr.position.set(-1.2, 0.16, -0.45); gF.add(fr);
    const frBody = box(1.1, 2.3, 0.9, M.plastic(0xe6e9ee, { roughness: 0.35 })); frBody.position.y = 1.15; fr.add(frBody);
    const frIn = box(0.96, 2.1, 0.02, M.matte(0x9fd0ff)); frIn.position.set(0, 1.15, 0.46); fr.add(frIn);
    const frDoor = new THREE.Group(); frDoor.position.set(0.55, 0, 0.47); fr.add(frDoor);
    const dPanel = box(1.1, 2.3, 0.08, M.plastic(0xf2f4f7, { roughness: 0.3 })); dPanel.position.set(-0.55, 1.15, 0.04); frDoor.add(dPanel);
    const coil = []; for (let i = 0; i <= 8; i++) { const y = 0.3 + i * 0.24; coil.push([(i % 2 ? 0.45 : -0.45), y, -0.5]); coil.push([(i % 2 ? -0.45 : 0.45), y + 0.12, -0.5]); }
    fr.add(tube(coil, 0.025, M.metal(0x2b3039), false, 180));
    const coldPuff = puffs(gF, 120, 0.05, hex(COL.cold), rnd), hotPuff = puffs(gF, 150, 0.05, hex(COL.hot), rnd);
    const wF = flowArrow(hex(COL.elec), 0.05, 0.22); gF.add(wF);
    const lRoom = stage.label('', [0.9, 2.5, 0.6], gF, 'hot'), lBack = stage.label('back coil: hot', [-1.2, 2.75, -0.9], gF);
    lRoom.element.style.setProperty('--c', COL.hot);
    const fs = { T: 30 + K0, t: 0, rows: [] };

    // ---------------------------------------------------------------- boards
    let S = {}, show = '', key = '';
    const gasS = () => {
      let nL = 0, nR = 0, eL = 0, eR = 0;
      for (const m of md) { const e = m.v[0] ** 2 + m.v[1] ** 2 + m.v[2] ** 2; if (m.p[0] < 0) { nL++; eL += e; } else { nR++; eR += e; } }
      const TL = nL ? (eL / nL / ds.v2) * ds.T0 : ds.T0, TR = nR ? (eR / nR / ds.v2) * ds.T0 : ds.T0;
      const part = (n, T) => (n ? n * (Math.log(1 / n) + 1.5 * Math.log(T / ds.T0)) : 0);
      const S0 = 2 * DEM.n * Math.log(1 / DEM.n);
      return { nL, nR, TL, TR, dS: part(nL, TL) + part(nR, TR) - S0 };
    };
    const bA = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (show === 'zero') {
        title(g, 'The ladder down to absolute zero', 'log scale');
        const { X, Y } = axes(g, w, h, { x0: 88, x1: w - 250, y1: 58, y0: h - 30, xMax: 1, logY: true, yMin: 1e-11, yMax: 1e3, xTicks: [], yTicks: [1e3, 1, 1e-3, 1e-6, 1e-9], yFmt: (v) => fmtK(v) });
        g.font = '15px sans-serif';
        let ly = -99; MILES.forEach((m) => { const y = Y(m.T), t = Math.max(y, ly + 19); ly = t; g.fillStyle = '#c8d2e4'; g.fillRect(X(0) + 4, y - 1, 30, 2); g.fillText(m.n, w - 236, t + 5); g.strokeStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(X(0) + 34, y); g.lineTo(w - 250, y); g.lineTo(w - 240, t); g.stroke(); });
        g.fillStyle = COL.heat; g.beginPath(); const yy = Y(zs.T); g.moveTo(X(0.5) - 14, yy); g.lineTo(X(0.5) + 14, yy - 10); g.lineTo(X(0.5) + 14, yy + 10); g.fill();
        g.font = 'bold 19px sans-serif'; g.fillText(fmtK(zs.T), X(0.5) + 20, yy + 6);
        g.fillStyle = 'rgba(255,90,160,.9)'; g.font = 'bold 16px sans-serif'; g.fillText('0 K is off the bottom, for ever', X(0) + 10, h - 8);
      } else if (show === 'demon') {
        const gs = gasS();
        title(g, 'Temperatures', 'left and right');
        const t1 = Math.max(30, ds.t), t0 = t1 - 30;
        const { X, Y } = axes(g, w, h, { x0: 76, y1: 64, y0: h - 44, xMin: t0, xMax: t1, yMin: 0, yMax: 600, xTicks: [], yTicks: [0, 150, 300, 450, 600], yFmt: (v) => v + ' K' });
        line(g, ds.rows.filter((r) => r[0] >= t0).map((r) => [r[0], r[1]]), X, Y, COL.cold, 5);
        line(g, ds.rows.filter((r) => r[0] >= t0).map((r) => [r[0], r[2]]), X, Y, COL.hot, 5);
        g.font = 'bold 19px sans-serif'; g.fillStyle = COL.cold; g.fillText(`left ${gs.TL.toFixed(0)} K`, 90, 60 + 26); g.fillStyle = COL.hot; g.fillText(`right ${gs.TR.toFixed(0)} K`, 250, 86);
      } else {
        title(g, 'Kitchen temperature', 'hours, sealed room');
        const t1 = Math.max(4 * 3600, fs.t), t0 = t1 - 4 * 3600;
        const xt = []; for (let v = Math.ceil(t0 / 3600) * 3600; v <= t1; v += 3600) xt.push(v);
        const { X, Y } = axes(g, w, h, { x0: 76, y1: 64, y0: h - 44, xMin: t0, xMax: t1, yMin: 28, yMax: 40, xTicks: xt, yTicks: [28, 31, 34, 37, 40], xFmt: (v) => (v / 3600).toFixed(0) + ' h', yFmt: (v) => v + '°' });
        line(g, fs.rows.filter((r) => r[0] >= t0).map((r) => [r[0], r[1] - K0]), X, Y, COL.hot, 5);
      }
    }, [5.3, 3.4, 0]);
    const bB = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (show === 'zero') {
        title(g, 'Halve it, again and again', 'kelvin, not a log scale');
        const H = zs.hist.slice(-12), T0 = H[0];
        const { X, Y } = axes(g, w, h, { x0: 76, y1: 58, y0: h - 44, xMin: -0.5, xMax: 11.5, yMax: T0 * 1.05, xTicks: [], yTicks: [0, T0 / 2, T0], yFmt: (v) => (v === 0 ? '0 K' : fmtK(v)) });
        H.forEach((T, i) => { g.fillStyle = i === H.length - 1 ? COL.heat : 'rgba(111,182,255,.7)'; g.fillRect(X(i) - 16, Y(T), 32, Y(0) - Y(T)); });
        g.strokeStyle = COL.entropy; g.lineWidth = 3; g.setLineDash([10, 6]); g.beginPath(); g.moveTo(X(-0.5), Y(0)); g.lineTo(X(11.5), Y(0)); g.stroke(); g.setLineDash([]);
        g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '17px sans-serif'; g.fillText(`${zs.steps} halvings so far. The bars shrink, but never to zero.`, 24, h - 14);
      } else if (show === 'demon') {
        const gs = gasS(), kl2 = Math.LN2;
        title(g, 'The demon’s memory', `${ds.bits} bits`);
        const cols = 40, rows = 5, cw = (w - 40) / cols;
        for (let i = 0; i < cols * rows; i++) { const b = ds.tape[ds.tape.length - cols * rows + i]; g.fillStyle = b === undefined ? 'rgba(255,255,255,.08)' : b ? COL.hot : COL.cold; g.fillRect(20 + (i % cols) * cw, 52 + Math.floor(i / cols) * (cw + 2), cw - 2, cw - 2); }
        const y0 = 52 + rows * (cw + 2) + 30;
        g.font = 'bold 20px sans-serif'; g.fillStyle = COL.text; g.fillText('Entropy, in units of k:', 20, y0);
        g.font = '19px sans-serif';
        g.fillStyle = COL.cold; g.fillText(`gas after sorting: ${gs.dS.toFixed(1)} k`, 20, y0 + 32);
        g.fillStyle = COL.entropy; g.fillText(`wiping the memory: +${(ds.bits * kl2).toFixed(1)} k  (bits × ln 2)`, 20, y0 + 62);
        g.fillStyle = COL.work; g.font = 'bold 19px sans-serif'; g.fillText(`total: ${(gs.dS + ds.bits * kl2) >= 0 ? '+' : ''}${(gs.dS + ds.bits * kl2).toFixed(1)} k: the second law wins`, 20, y0 + 94);
      } else {
        const W = S.door ? FR.Wopen : FR.Wshut, Qc = W * FR.cop;
        title(g, 'Heat in the kitchen', 'every second');
        const s2 = sankey(g, { x: 14, y: 56, w: w - 28, h: h - 76 }, [{ label: 'from the air in front', value: Qc, color: COL.cold }, { label: 'electricity', value: W, color: COL.elec }],
          [{ label: 'out of the back coil', value: Qc + W, color: COL.hot }], { labelW: 200, bar: 16, gap: 18 });
        sankeyLabels(g, s2, (v) => fmtW(v), { font: 19, small: 17 });
      }
    }, [5.3, 1.05, 0]);

    // ---------------------------------------------------------------- state
    const mix = () => {
      const sp = 1;
      md.forEach((m, i) => {
        const left = i < DEM.n, x0 = left ? DEM.l[0] : DEM.r[0], x1 = left ? DEM.l[1] : DEM.r[1];
        m.p = [x0 + 0.1 + rnd() * (x1 - x0 - 0.2), DEM.y[0] + 0.1 + rnd() * (DEM.y[1] - DEM.y[0] - 0.2), (rnd() - 0.5) * (DEM.d - 0.2)];
        m.v = [gauss(rnd) * sp, gauss(rnd) * sp, gauss(rnd) * sp];
      });
      const sp2 = md.map((m) => Math.hypot(...m.v)).sort((a, b) => a - b);
      ds.v0 = sp2[sp2.length >> 1]; ds.v2 = md.reduce((a, m) => a + m.v[0] ** 2 + m.v[1] ** 2 + m.v[2] ** 2, 0) / md.length;
      Object.assign(ds, { bits: 0, passed: 0, t: 0, flash: 0 }); ds.rows.length = 0; ds.tape.length = 0;
    };
    mix();

    return {
      mix,
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lBack]); reelBoards([bA, bB], show === 'zero' ? -0.6 : 0);
        if (s.show !== show) { show = s.show; gZ.visible = show === 'zero'; gD.visible = show === 'demon'; gF.visible = show === 'fridge'; const v = VIEWS[show]; if (!inReel()) stage.setView(v.pos, v.target, 1.0); key = ''; }

        if (show === 'zero') {
          // new temperature: record halvings (or any big drop) for the bar chart
          if (Math.abs(Math.log(s.temp / zs.T)) > 1e-6) {
            const r = s.temp / zs.T;
            if (Math.abs(r - 0.5) < 1e-6) { zs.steps++; zs.hist.push(s.temp); }
            else { zs.steps = 0; zs.hist = [s.temp]; }
            zs.T = s.temp;
          }
          // cloud: size and jiggle shrink with temperature (drawn on a log scale so every decade shows)
          const k = clamp((Math.log10(zs.T) + 10) / 12.5, 0, 1), spread = 0.12 + 0.8 * k, jig = 0.02 + 0.3 * k, sp = 0.5 + 6 * k;
          const tNow = (ds.clock = (ds.clock || 0) + dt);
          at.forEach((a, i) => {
            const x = C0[0] + spread * a.p[0] * 0.55 + jig * Math.sin(tNow * sp * a.w + a.ph[0]);
            const y = C0[1] + spread * a.p[1] * 0.55 + jig * Math.sin(tNow * sp * a.w * 1.1 + a.ph[1]);
            const z = C0[2] + spread * a.p[2] * 0.55 + jig * Math.sin(tNow * sp * a.w * 0.9 + a.ph[2]);
            atoms.place(i, x, y, z, zs.T < 170e-9 * 1.01 ? 1.25 : 1);
            atoms.tint(i, zs.T < 2e-7 ? col.set(0x8ef0ff) : tempColor(250 + 350 * k, 250, 600, col));
          });
          atoms.done();
          beamMat.opacity = zs.T < 1e-3 ? 0.45 : 0.12;
          lCloud.element.innerHTML = `<b>${fmtK(zs.T)}</b> · atoms at ${fmtV(vRb(zs.T))}`;
          const kk = `${zs.T}|${zs.steps}`; if (kk !== key) { key = kk; bA.redraw(); bB.redraw(); }
        }

        if (show === 'demon') {
          const r = 0.07, run = dt, vs = DEM.vis * 380;
          for (let i = 0; i < md.length; i++) {
            const m = md[i], left = m.p[0] < 0;
            for (let k = 0; k < 3; k++) m.p[k] += m.v[k] * vs * run;
            const x0 = left ? DEM.l[0] + r : 0.1 + r, x1 = left ? -0.1 - r : DEM.r[1] - r;
            if (m.p[1] < DEM.y[0] + r) { m.p[1] = 2 * (DEM.y[0] + r) - m.p[1]; m.v[1] *= -1; }
            if (m.p[1] > DEM.y[1] - r) { m.p[1] = 2 * (DEM.y[1] - r) - m.p[1]; m.v[1] *= -1; }
            const hz = DEM.d / 2 - r;
            if (m.p[2] < -hz) { m.p[2] = -2 * hz - m.p[2]; m.v[2] *= -1; }
            if (m.p[2] > hz) { m.p[2] = 2 * hz - m.p[2]; m.v[2] *= -1; }
            if (m.p[0] < (left ? x0 : DEM.r[0] + r)) { const lo = left ? x0 : DEM.r[0] + r; if (left) { m.p[0] = 2 * lo - m.p[0]; m.v[0] *= -1; } else hitWall(m, false, lo); }
            else if (m.p[0] > (left ? x1 : x1)) { if (left) hitWall(m, true, x1); else { m.p[0] = 2 * x1 - m.p[0]; m.v[0] *= -1; } }
            molD.place(i, ...m.p);
            const e = (m.v[0] ** 2 + m.v[1] ** 2 + m.v[2] ** 2) / ds.v2;
            molD.tint(i, tempColor(300 * e, 60, 700, col));
          }
          molD.done();
          function hitWall(m, fromLeft, x) {
            const atDoor = m.p[1] > DEM.door[0] + r && m.p[1] < DEM.door[1] - r;
            let pass = false;
            if (atDoor && s.demon) {
              const fast = Math.hypot(...m.v) > ds.v0;
              ds.bits++; ds.tape.push(fast ? 1 : 0); if (ds.tape.length > 400) ds.tape.shift();
              pass = fromLeft ? fast : !fast;
              if (pass) { ds.passed++; ds.flash = 0.25; }
            } else if (atDoor && !s.demon) pass = false;
            if (!pass) { m.p[0] = 2 * x - m.p[0]; m.v[0] *= -1; }
            else m.p[0] = fromLeft ? 0.1 + r + 0.01 : -0.1 - r - 0.01;
          }
          ds.t += dt; ds.flash = Math.max(0, ds.flash - dt);
          const gs = gasS();
          if (!ds.rows.length || ds.t - ds.rows[ds.rows.length - 1][0] > 0.2) { ds.rows.push([ds.t, gs.TL, gs.TR]); if (ds.rows.length > 300) ds.rows.shift(); }
          doorM.visible = ds.flash <= 0 || !s.demon;
          demon.rotation.y = Math.sin(ds.t * 3) * 0.4; demon.position.y = DEM.y[1] + 0.35 + (s.demon ? 0.05 * Math.sin(ds.t * 8) : -0.08);
          dBody.material.color.setHex(s.demon ? 0xc0304a : 0x5a2a36);
          lL.element.innerHTML = `left: <b>${gs.TL.toFixed(0)} K</b> · ${gs.nL}`; lR.element.innerHTML = `right: <b>${gs.TR.toFixed(0)} K</b> · ${gs.nR}`;
          const kk = `${ds.rows.length}|${ds.bits}`; if (kk !== key) { key = kk; bA.redraw(); bB.redraw(); }
        }

        if (show === 'fridge') {
          if (s._room) { s._room = false; }
          const W = s.door ? FR.Wopen : FR.Wshut, h = dt * FR.fast;
          fs.T += (W * h) / FR.C; fs.t += h;
          if (!fs.rows.length || fs.t - fs.rows[fs.rows.length - 1][0] > 60) { fs.rows.push([fs.t, fs.T]); if (fs.rows.length > 400) fs.rows.shift(); }
          if (fs.T > 40 + K0) { fs.T = 30 + K0; fs.t = 0; fs.rows.length = 0; }
          const open = s.door ? 1 : 0;
          frDoor.rotation.y = -1.9 * open;
          coldPuff.step(dt, 45 * open, () => [-1.2 + (rnd() - 0.5) * 0.8, 0.5 + rnd() * 1.8, 0.1], () => [(rnd() - 0.3) * 0.5, -0.25, 0.7 + rnd() * 0.3], 1.4);
          hotPuff.step(dt, s.door ? 55 : 14, () => [-1.2 + (rnd() - 0.5) * 0.9, 0.5 + rnd() * 1.9, -0.98], () => [(rnd() - 0.5) * 0.3, 0.55 + rnd() * 0.3, 0.3], 1.5);
          wF.aim([0.3, 0.45, -0.45], [-1, 0, 0], 0.3 + 0.5 * (W / FR.Wopen));
          kAir.material.opacity = 0.03 + 0.1 * clamp((fs.T - K0 - 30) / 8, 0, 1);
          lRoom.element.innerHTML = `kitchen: <b>${(fs.T - K0).toFixed(2)} °C</b> · ${(fs.t / 3600).toFixed(1)} h`;
          const kk = `${fs.rows.length}|${s.door}`; if (kk !== key) { key = kk; bA.redraw(); bB.redraw(); }
        }
      },
      readout: (s) => {
        if (show === 'demon') {
          const gs = gasS(), bill = ds.bits * KB * 300 * Math.LN2;
          return `<div class="big">${s.demon ? 'The demon sorts: left cools, right warms' : 'Demon asleep: nothing sorts'}</div>
            <div class="row"><span>Left / right temperature</span><b><span style="color:${COL.cold}">${gs.TL.toFixed(0)} K</span> / <span style="color:${COL.hot}">${gs.TR.toFixed(0)} K</span></b></div>
            <div class="row"><span>Molecules let through</span><b>${ds.passed}</b></div>
            <div class="row"><span>Yes/no decisions remembered</span><b>${ds.bits} bits</b></div>
            <div class="row"><span>Least heat to wipe them, bits × k T ln 2</span><b style="color:${COL.entropy}">${sci(bill)} J</b></div>
            <small>At 300 K, forgetting one bit costs at least 2.87 × 10⁻²¹ J. Tiny, but it always produces more entropy than the sorting removed.</small>`;
        }
        if (show === 'fridge') {
          const W = s.door ? FR.Wopen : FR.Wshut, rate = (W / FR.C) * 3600;
          return `<div class="big">${s.door ? 'Door open: the kitchen warms up' : 'Door shut: still a little warming'}</div>
            <div class="row"><span>Heat pulled from the air in front</span><b style="color:${COL.cold}">${fmtW(W * FR.cop)}</b></div>
            <div class="row"><span>Electricity used</span><b style="color:${COL.elec}">${fmtW(W)}</b></div>
            <div class="row"><span>Heat dumped from the back coil</span><b style="color:${COL.hot}">${fmtW(W * (1 + FR.cop))}</b></div>
            <div class="row"><span>Net heat into the sealed kitchen</span><b style="color:${COL.hot}">+${fmtW(W)}</b></div>
            <div class="row"><span>Kitchen warming</span><b>+${rate.toFixed(1)} °C per hour</b></div>
            <small>A fridge moves heat; it doesn’t make cold. In a closed room, everything it pulls from the front comes back out of the back, plus its electricity.</small>`;
        }
        const T = zs.T;
        return `<div class="big">${fmtK(T)} · ${T >= 1 ? (T - K0).toFixed(T > 10 ? 0 : 2) + ' °C' : 'a hair above −273.15 °C'}</div>
          <div class="row"><span>Rubidium atoms’ speed, √(3kT/m)</span><b>${fmtV(vRb(T))}</b></div>
          <div class="row"><span>Getting there takes</span><b>${technique(T)}</b></div>
          <div class="row"><span>Still left above absolute zero</span><b>${fmtK(T)}</b></div>
          <div class="row"><span>Halving steps from room temperature</span><b>${Math.max(0, Math.log2(293 / T)).toFixed(1)}</b></div>
          <small>${T < 2e-7 ? 'Below about 170 nK the atoms fall into one quantum state: a Bose–Einstein condensate.' : 'Every step leaves something. However many steps you take, zero is never reached.'}</small>`;
      },
    };
  },
};
