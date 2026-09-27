// Chapter 3: heat pumps move heat "uphill", from cold to hot, by using work (1 scene unit ≈ 1 m for
// the room, ≈ 0.6 m for the fridge).
// Heat leaks in by itself through walls: Q_leak = UA·(T_out − T_in). The machine pumps heat Q_c out
// of the cold space using electrical work W and dumps Q_h = Q_c + W outside (first law). The best
// possible coefficient of performance is Carnot's, COP = T_c ÷ (T_h − T_c) in kelvin; the entropy
// dumped, Q_h/T_h, must be at least the entropy removed, Q_c/T_c (second law).
// Real COP: the refrigerant must be colder than the inside air and hotter than the outside air to
// move heat through the coils, so we take the Carnot COP between (T_in − 12 K) and (T_out + 12 K),
// times a second-law efficiency: 0.45 for a split AC, 0.4 for a fridge. At 24 °C inside and 35 °C
// outside that gives an AC a COP of about 3.7 (Indian 5-star inverter ACs are rated ISEER ≥ 5 over
// a season of milder days; see ACClear). A fridge at 4 °C in a 30 °C kitchen gets about 2.3.
// AC: a 1.5-ton split (5.3 kW of cooling, as in ACClear); room UA = 400 W/K (walls, window, sun
//   and people lumped together), room plus furniture heat capacity 600 kJ/K. Shown 30× fast.
// Fridge: about 120 W of cooling at most; cabinet UA = 1.0 W/K (a 250 L fridge leaks about 25 W
//   at a 26 K difference); food and air heat capacity 40 kJ/K. Shown 600× fast.
// Both behave like inverter units: cooling = leak + a correction towards the set temperature, up to
// the maximum.
import { THREE, M, box, beam, tube } from '../kit.js';
import { COL, K0, hex, board, panelBg, axes, title, line, sankey, sankeyLabels, puffs, flowArrow, rng, fitNarrow, inReel, reelBoards, clamp, fmtW } from '../thermo.js';

const UNITS = {
  ac: { UA: 400, Qmax: 5300, C: 6e5, fast: 30, eta: 0.45, name: 'room', win: 3600 },
  fridge: { UA: 1.0, Qmax: 120, C: 4e4, fast: 600, eta: 0.4, name: 'fridge', win: 6 * 3600 },
};
const VIEWS = {
  ac: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
  fridge: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
};
export function copReal(u, Tin, Tout) { const c = Tin - 12, h = Tout + 12; return (c / (h - c)) * UNITS[u].eta; }
export const copCarnot = (Tin, Tout) => (Tout > Tin ? Tin / (Tout - Tin) : Infinity);

export default {
  id: 'pumps',
  short: 'Heat pumps',
  title: 'Pushing heat uphill costs work',
  subtitle: 'An AC and a fridge move heat from cold to hot. The second law sets the price.',
  view: VIEWS.ac,
  learn: `<p>Heat flows from hot to cold <b>by itself</b>. So on a 35 °C day, heat leaks into a 24 °C room through the walls, the window and the roof, all the time. To keep the room cool, something has to carry that heat back out, <b>uphill</b>, from cold to hot.</p>
    <p>That machine is a <b>heat pump</b>. An <b>AC</b> and a <b>fridge</b> are both heat pumps. A cold liquid in the inside coil soaks up heat, the compressor squeezes the vapour until it is hotter than the outside air, and the outside coil dumps the heat there. See ACClear and FridgeClear.</p>
    <p>The second law says moving heat uphill <b>always costs work</b>. The first law says where it all goes: <b>heat out = heat taken + electricity</b>. So the outdoor unit blows out more heat than the AC removes from your room.</p>
    <p>How much heat you move per unit of electricity is the <b>COP</b> (coefficient of performance). Carnot's rule caps it at <b>T<sub>cold</sub> ÷ (T<sub>hot</sub> − T<sub>cold</sub>)</b>, in kelvin. The smaller the temperature gap, the cheaper the pumping. That is why setting your AC at 24 °C instead of 18 °C saves so much.</p>
    <p class="tip"><b>Try it:</b> turn the outside temperature up and watch the COP fall. Switch the machine off and watch heat leak in by itself until inside and outside match.</p>`,
  terms: [
    { t: 'Heat pump', d: 'A machine that uses work to move heat from a colder place to a hotter one.' },
    { t: 'COP', d: 'Coefficient of performance: heat moved ÷ electricity used. For a good AC it is 3 to 5.' },
    { t: 'Carnot COP', d: 'The best possible COP: T_cold ÷ (T_hot − T_cold), in kelvin.' },
    { t: 'Compressor', d: 'The pump that squeezes the refrigerant vapour, making it hot enough to give heat away outside.' },
    { t: 'Heat leak', d: 'Heat that flows in by itself through walls and gaps, from the hot side to the cold side.' },
  ],
  defaults: { unit: 'ac', tin: 24, tout: 35, on: true },
  controls: [
    { key: 'unit', type: 'seg', label: 'Look at', options: [{ v: 'ac', label: 'Split AC' }, { v: 'fridge', label: 'Fridge' }] },
    { key: 'tin', type: 'range', label: 'Set temperature inside', min: -20, max: 28, step: 1, ends: ['−20 °C', '28 °C'], fmt: (v) => `${v} °C` },
    { key: 'tout', type: 'range', label: 'Outside (or the kitchen)', min: 20, max: 48, step: 1, ends: ['20 °C', '48 °C'], fmt: (v) => `${v} °C` },
    { key: 'on', type: 'toggle', label: 'Machine switched on' },
  ],
  onChange(s, key) {
    if (key === 'unit' || key === null) { if (s.unit === 'fridge' && s.tin > 10) s.tin = 4; if (s.unit === 'ac' && s.tin < 16) s.tin = 24; s._reset = true; }
  },
  quiz: [
    { q: 'An AC removes 5 kW of heat from a room using 1.5 kW of electricity. How much heat comes out of the outdoor unit?', options: ['3.5 kW', '5 kW', '6.5 kW', '1.5 kW'], answer: 2, why: 'First law: heat out = heat taken + electricity = 5 + 1.5 = 6.5 kW. That is why the outdoor unit blows hot air.' },
    { q: 'Why does a heat pump need electricity at all?', options: ['To make cold', 'Heat never flows from cold to hot by itself, so moving it uphill takes work', 'To light the display', 'Only to run the fan'], answer: 1, why: 'The second law: heat flows downhill by itself. Carrying it uphill always costs work, just as pumping water uphill does.' },
    { q: 'When is an AC most efficient (highest COP)?', options: ['When it is very hot outside', 'When the inside and outside temperatures are close', 'When the room is set very cold', 'COP never changes'], answer: 1, why: 'Carnot COP = T_cold ÷ (T_hot − T_cold). A small gap means a big COP, so less electricity per unit of heat moved.' },
  ],
  reel: [
    { ms: 5600, caption: 'An AC carries heat uphill, from a cool room to the hot outdoors, and pays for it with electricity.', set: { unit: 'ac', tin: 24, tout: 38, on: true }, view: { pos: [-0.3, 5.5, 9.4], target: [-0.3, 4.7, 0] }, spin: 0.04 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gA = new THREE.Group(), gF = new THREE.Group(); root.add(gA, gF);
    const rnd = rng(31);
    const ground = box(6.0, 0.1, 2.6, M.matte(0x2b3039)); ground.position.set(0, 0.05, 0); root.add(ground);

    // ---------------------------------------------------------------- AC: a room cut open, the wall, the outdoor unit
    const R0 = { x0: -2.8, x1: 0.3, y1: 2.9, d: 2.2 };
    const floor = box(R0.x1 - R0.x0, 0.06, R0.d, M.matte(0x8a6a44)); floor.position.set((R0.x0 + R0.x1) / 2, 0.13, 0); gA.add(floor);
    const back = box(R0.x1 - R0.x0, R0.y1, 0.08, M.matte(0xd9dde3)); back.position.set((R0.x0 + R0.x1) / 2, R0.y1 / 2 + 0.1, -R0.d / 2); gA.add(back);
    const leftW = box(0.08, R0.y1, R0.d, M.clear(0xd9dde3, 0.25)); leftW.position.set(R0.x0, R0.y1 / 2 + 0.1, 0); gA.add(leftW);
    const outer = box(0.22, R0.y1, R0.d, M.matte(0xbfc5ce)); outer.position.set(R0.x1 + 0.11, R0.y1 / 2 + 0.1, 0); gA.add(outer);
    const roomAir = new THREE.Mesh(new THREE.BoxGeometry(R0.x1 - R0.x0 - 0.1, R0.y1 - 0.1, R0.d - 0.1), M.clear(0x6fb6ff, 0.08)); roomAir.position.set((R0.x0 + R0.x1) / 2, R0.y1 / 2 + 0.15, 0); gA.add(roomAir);
    const indoor = box(1.1, 0.34, 0.26, M.plastic(0xf2f4f7, { roughness: 0.3 })); indoor.position.set(-0.45, 2.55, -R0.d / 2 + 0.2); gA.add(indoor);
    const louver = box(0.9, 0.03, 0.05, M.matte(0x9aa3b2)); louver.position.set(-0.45, 2.39, -R0.d / 2 + 0.34); gA.add(louver);
    const odu = box(1.3, 0.95, 0.6, M.plastic(0xe6e9ee, { roughness: 0.4 })); odu.position.set(1.55, 0.6, -0.3); gA.add(odu);
    const fanA = new THREE.Group(); fanA.position.set(1.4, 0.6, 0.02); gA.add(fanA);
    const grill = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 8, 40), M.matte(0x3a3f4b)); fanA.add(grill);
    for (let i = 0; i < 3; i++) { const b = box(0.3, 0.1, 0.02, M.matte(0x3a3f4b)); b.geometry.translate(0.15, 0, 0); b.rotation.z = (i * 2 * Math.PI) / 3; fanA.add(b); }
    const comp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.38, 20), M.metal(0x4a505c)); comp.position.set(1.95, 0.42, -0.15); gA.add(comp);
    const pipeA = tube([[-0.05, 2.55, -0.95], [0.5, 2.55, -0.95], [0.9, 2.2, -0.6], [1.0, 1.2, -0.5], [1.05, 0.9, -0.4]], 0.035, M.metal(0xc07a4a), false, 80); gA.add(pipeA);
    const lIn = stage.label('', [-1.3, 1.55, 0.8], gA, 'hot'), lOut = stage.label('', [1.55, 1.45, 0.3], gA, 'hot');
    const lIdu = stage.label('indoor coil: cold', [-0.45, 3.05, -0.9], gA), lOdu = stage.label('outdoor coil: hot', [1.55, 0.0, 0.5], gA);
    const pumpedA = puffs(gA, 180, 0.05, hex(COL.cold), rnd), dumpA = puffs(gA, 180, 0.055, hex(COL.hot), rnd), leakA = puffs(gA, 120, 0.045, hex(COL.heat), rnd);
    const wA = flowArrow(hex(COL.elec), 0.05, 0.24); gA.add(wA);

    // ---------------------------------------------------------------- fridge: cabinet, back coil, compressor
    const F = { x0: -2.0, x1: -0.3, y0: 0.15, y1: 3.0, d: 1.3 };
    const cab = box(F.x1 - F.x0, F.y1 - F.y0, F.d, M.clear(0xf2f4f7, 0.22)); cab.position.set((F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, 0); gF.add(cab);
    const cabE = new THREE.LineSegments(new THREE.EdgesGeometry(cab.geometry), new THREE.LineBasicMaterial({ color: 0xc8d2e4 })); cabE.position.copy(cab.position); gF.add(cabE);
    const fAir = new THREE.Mesh(new THREE.BoxGeometry(F.x1 - F.x0 - 0.14, F.y1 - F.y0 - 0.14, F.d - 0.14), M.clear(0x6fb6ff, 0.12)); fAir.position.copy(cab.position); gF.add(fAir);
    for (const y of [1.0, 1.8, 2.4]) { const sh = box(F.x1 - F.x0 - 0.16, 0.02, F.d - 0.2, M.clear(0xffffff, 0.35)); sh.position.set((F.x0 + F.x1) / 2, y, 0); gF.add(sh); }
    const foods = [[-1.6, 1.12, 0x5ce1a9], [-1.0, 1.15, 0xf2c230], [-0.7, 1.92, 0xe0663a], [-1.4, 1.92, 0x8ef0ff]].map(([x, y, c]) => { const f = box(0.28, 0.24, 0.28, M.plastic(c)); f.position.set(x, y, 0.1); gF.add(f); return f; });
    const evap = box(F.x1 - F.x0 - 0.3, 0.3, 0.05, M.metal(0x8fb0ff)); evap.position.set((F.x0 + F.x1) / 2, 2.75, -F.d / 2 + 0.1); gF.add(evap);
    const coilPts = []; for (let i = 0; i <= 10; i++) { const y = 0.6 + i * 0.22; coilPts.push([(i % 2 ? 0.55 : 0.05), y, -0.2]); coilPts.push([(i % 2 ? 0.05 : 0.55), y + 0.11, -0.2]); }
    const cond = tube(coilPts, 0.03, M.metal(0x2b3039), false, 200); gF.add(cond);
    const compF = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 20), M.metal(0x4a505c)); compF.position.set(0.3, 0.3, -0.2); gF.add(compF);
    const lInF = stage.label('', [-1.15, 3.3, 0.5], gF, 'hot'), lOutF = stage.label('', [1.3, 2.4, 0], gF, 'hot');
    const lCond = stage.label('back coil: warm', [0.3, 0.0, 0.3], gF);
    const pumpedF = puffs(gF, 140, 0.045, hex(COL.cold), rnd), dumpF = puffs(gF, 160, 0.05, hex(COL.hot), rnd), leakF = puffs(gF, 100, 0.04, hex(COL.heat), rnd);
    const wF = flowArrow(hex(COL.elec), 0.05, 0.24); gF.add(wF);
    for (const l of [lIn, lOut, lInF, lOutF]) l.element.style.setProperty('--c', COL.text);

    // ---------------------------------------------------------------- state
    const st = { T: 0, t: 0, rows: [], Qc: 0, W: 0 };
    let S = {}, unit = '', key = '';
    const reset = () => { st.T = Math.min(S.tout, S.tin + 3) + K0; st.t = 0; st.rows.length = 0; };
    const sk = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h); if (!unit) return; title(g, 'Heat moved each second', S.on ? '' : 'switched off');
      const Qh = st.Qc + st.W;
      if (!S.on || Qh < 1e-6) {
        g.font = '22px sans-serif'; g.fillStyle = COL.heat; g.fillText(`Heat leaking in by itself: ${fmtW(UNITS[unit].UA * Math.max(0, S.tout + K0 - st.T))}`, 24, 170);
        g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '19px sans-serif'; g.fillText('Nothing carries it back out.', 24, 204); return;
      }
      const s2 = sankey(g, { x: 14, y: 56, w: w - 28, h: h - 76 }, [{ label: `from the ${UNITS[unit].name}`, value: st.Qc, color: COL.cold }, { label: 'electricity', value: st.W, color: COL.elec }],
        [{ label: 'dumped outside', value: Qh, color: COL.hot }], { labelW: 180, bar: 16, gap: 18 });
      sankeyLabels(g, s2, (v) => fmtW(v), { font: 20, small: 18 });
    }, [5.3, 3.4, 0]);
    const chart = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h); if (!unit) return; const U = UNITS[unit], hrs = U.win >= 7200;
      title(g, `Temperature inside the ${U.name}`, hrs ? 'hours' : 'minutes');
      const t1 = Math.max(U.win, st.t), t0 = t1 - U.win, div = hrs ? 3600 : 60;
      const lo = Math.min(S.tin, S.tout) - 4, hi = Math.max(S.tin, S.tout) + 4, yMin = Math.floor(lo / 10) * 10, yMax = Math.ceil(hi / 10) * 10;
      const yt = []; for (let v = yMin; v <= yMax; v += 10) yt.push(v);
      const xt = []; const stp = hrs ? 3600 : 600; for (let v = Math.ceil(t0 / stp) * stp; v <= t1; v += stp) xt.push(v);
      const { X, Y } = axes(g, w, h, { x0: 76, y1: 64, y0: h - 44, xMin: t0, xMax: t1, yMin, yMax, xTicks: xt, yTicks: yt, xFmt: (v) => (v / div).toFixed(0), yFmt: (v) => v + '°' });
      const dash = (v, c, t) => { g.strokeStyle = c; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(t0), Y(v)); g.lineTo(X(t1), Y(v)); g.stroke(); g.setLineDash([]); g.fillStyle = c; g.font = '17px sans-serif'; g.fillText(t, X(t1) - g.measureText(t).width - 4, Y(v) - 7); };
      dash(S.tout, COL.hot, 'outside'); dash(S.tin, COL.cold, 'set');
      line(g, st.rows.filter((r) => r[0] >= t0).map((r) => [r[0], r[1] - K0]), X, Y, COL.elec, 5);
    }, [5.3, 1.05, 0]);

    return {
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lIdu, lOdu, lCond]); reelBoards([sk, chart]);
        if (s.unit !== unit) { unit = s.unit; gA.visible = unit === 'ac'; gF.visible = unit === 'fridge'; const v = VIEWS[unit]; if (!inReel()) stage.setView(v.pos, v.target, 1.0); s._reset = true; }
        if (s._reset) { s._reset = false; reset(); }
        const U = UNITS[unit], Tout = s.tout + K0, Tset = s.tin + K0;
        const n = 10, h = (dt * U.fast) / n;
        for (let i = 0; i < n; i++) {
          const leak = U.UA * (Tout - st.T);
          const want = s.on ? clamp(leak + (U.C / 400) * (st.T - Tset), 0, U.Qmax) : 0;
          const cop = Math.max(0.5, copReal(unit, Math.min(st.T, Tout), Tout));
          st.Qc = want; st.W = want / cop;
          st.T += ((leak - want) * h) / U.C;
        }
        st.t += dt * U.fast;
        if (!st.rows.length || st.t - st.rows[st.rows.length - 1][0] > U.win / 150) { st.rows.push([st.t, st.T]); if (st.rows.length > 400) st.rows.shift(); }
        const kPump = st.Qc / U.Qmax, leakK = clamp((Tout - st.T) / 25, 0, 1);
        if (unit === 'ac') {
          const d = R0.d / 2;
          pumpedA.step(dt, 50 * kPump, () => [R0.x0 + 0.3 + rnd() * 2.4, 0.4 + rnd() * 1.6, (rnd() - 0.5) * 1.6], () => { return [0.35, 0.55, -0.35]; }, 1.6);
          dumpA.step(dt, 60 * kPump * (1 + st.W / Math.max(1, st.Qc)), () => [1.45 + (rnd() - 0.5) * 0.4, 0.6 + (rnd() - 0.5) * 0.4, 0.05], () => [0.35 + rnd() * 0.3, 0.5 + rnd() * 0.4, 0.8 + rnd() * 0.4], 1.3);
          leakA.step(dt, 40 * leakK, () => [R0.x1 + 0.25, 0.4 + rnd() * 2.3, (rnd() - 0.5) * 2 * d * 0.9], () => [-0.7 - rnd() * 0.4, 0, 0], 1.4);
          fanA.rotation.z -= dt * 14 * (s.on ? 0.3 + kPump : 0);
          wA.aim([2.5, 1.35, -0.15], [-0.6, -1, 0], st.W > 1 ? 0.3 + 0.5 * st.W / 1500 : 0);
          roomAir.material.color.setHex(st.T - K0 > 30 ? 0xff9a6a : 0x6fb6ff); roomAir.material.opacity = 0.06 + 0.06 * clamp(Math.abs(st.T - Tout) / 15, 0, 1);
          lIn.element.innerHTML = `room: <b>${(st.T - K0).toFixed(1)} °C</b>`; lOut.element.innerHTML = `outside: <b>${s.tout} °C</b>`;
        } else {
          pumpedF.step(dt, 40 * kPump, () => [F.x0 + 0.2 + rnd() * 1.3, 0.4 + rnd() * 2.0, (rnd() - 0.5) * 1.0], () => [0, 0.6, -0.2], 1.4);
          dumpF.step(dt, 55 * kPump * (1 + st.W / Math.max(1, st.Qc)), () => [0.05 + rnd() * 0.5, 0.6 + rnd() * 2.2, -0.2], () => [0.3 + rnd() * 0.3, 0.5 + rnd() * 0.3, 0.2], 1.3);
          leakF.step(dt, 35 * leakK, () => { const side = rnd(); return side < 0.5 ? [F.x0 - 0.2, 0.4 + rnd() * 2.4, (rnd() - 0.5) * 1.0] : [-1.15 + (rnd() - 0.5) * 1.5, 0.4 + rnd() * 2.4, 0.85]; }, () => [0.25, 0, -0.35], 1.2);
          wF.aim([0.8, 0.3, 0.3], [-1, 0, -0.4], st.W > 0.5 ? 0.3 + 0.4 * st.W / 80 : 0);
          fAir.material.opacity = 0.08 + 0.1 * clamp((Tout - st.T) / 30, 0, 1);
          lInF.element.innerHTML = `inside: <b>${(st.T - K0).toFixed(1)} °C</b>`; lOutF.element.innerHTML = `kitchen: <b>${s.tout} °C</b>`;
        }
        const k = `${st.rows.length}|${Math.round(st.Qc)}|${s.on}|${s.tin}|${s.tout}`;
        if (k !== key) { key = k; sk.redraw(); chart.redraw(); }
      },
      readout: (s) => {
        const U = UNITS[unit || s.unit], Tin = st.T, Tout = s.tout + K0;
        const cop = copReal(unit || s.unit, Math.min(Tin, Tout), Tout), cc = copCarnot(Tin, Tout);
        const Qh = st.Qc + st.W, dS = st.Qc > 0 ? Qh / Tout - st.Qc / Tin : 0;
        if (!s.on) return `<div class="big">Switched off: heat leaks in</div>
          <div class="row"><span>Inside now</span><b>${(Tin - K0).toFixed(1)} °C</b></div>
          <div class="row"><span>Heat flowing in by itself, UA × ΔT</span><b style="color:${COL.heat}">${fmtW(U.UA * Math.max(0, Tout - Tin))}</b></div>
          <small>Heat only flows downhill. It keeps coming in until inside and outside are at the same temperature: thermal equilibrium.</small>`;
        return `<div class="big">COP ${cop.toFixed(1)} · Carnot limit ${isFinite(cc) ? cc.toFixed(0) : '∞'}</div>
          <div class="row"><span>Heat pumped out of the ${U.name}, Q<sub>c</sub></span><b style="color:${COL.cold}">${fmtW(st.Qc)}</b></div>
          <div class="row"><span>Electricity, W = Q<sub>c</sub> ÷ COP</span><b style="color:${COL.elec}">${fmtW(st.W)}</b></div>
          <div class="row"><span>Dumped outside, Q<sub>h</sub> = Q<sub>c</sub> + W</span><b style="color:${COL.hot}">${fmtW(Qh)}</b></div>
          <div class="row"><span>Carnot COP, T<sub>c</sub> ÷ (T<sub>h</sub> − T<sub>c</sub>)</span><b>${Tin.toFixed(0)} ÷ ${(Tout - Tin).toFixed(0)}</b></div>
          <div class="row"><span>Entropy made, Q<sub>h</sub>/T<sub>h</sub> − Q<sub>c</sub>/T<sub>c</sub></span><b style="color:${COL.entropy}">+${dS.toFixed(2)} W/K</b></div>
          <small>The coils must be colder than the inside and hotter than the outside to move heat, so a real COP is well below Carnot's.</small>`;
      },
    };
  },
};
