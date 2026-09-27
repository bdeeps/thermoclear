// Chapter 2: heat engines and the Carnot limit (1 scene unit ≈ 10 cm for the car cylinder).
// Carnot's engine: heat Q_h flows in from a hot place at T_h, work W comes out, and heat Q_c must
//   be dumped into a cold place at T_c. First law: Q_h = W + Q_c. Second law: the entropy handed
//   to the cold side, Q_c/T_c, can't be less than the entropy taken from the hot side, Q_h/T_h.
//   So W/Q_h ≤ 1 − T_c/T_h (Sadi Carnot, 1824; Clausius and Kelvin, 1850–51). A "real" engine here
//   gets 60 % of the Carnot limit, typical of good large plants.
//   Marks on the chart are rough, typical values: a pressurised-water nuclear plant (steam about
//   285 °C, ≈ 33 %), a supercritical coal plant (steam about 600 °C, ≈ 42 %), a combined-cycle gas
//   plant (turbine inlet about 1,500 °C, ≈ 60 %), a car petrol engine (≈ 30 % at its best).
// Car engine: a four-stroke petrol cylinder, drawn as the ideal "air-standard" Otto cycle:
//   compression and expansion are adiabats, P·V^γ = constant with γ = 1.4, and the fuel burns at
//   top dead centre. Ideal efficiency 1 − 1/r^(γ−1), r the compression ratio (petrol cars run about
//   10–13). Intake air at 300 K and 100 kPa; peak gas temperature taken as 2,500 K (real engines
//   reach about 2,300–2,800 K), so the Carnot limit between 2,500 K and 300 K is 88 %.
//   Real brake efficiency is 25–35 % (the best production petrol engines claim about 40 %). A
//   rough split of the fuel's energy at a good operating point: 30 % work, 35 % hot exhaust,
//   28 % into the coolant, 7 % friction and pumping (Heywood, Internal Combustion Engine
//   Fundamentals; US DOE fueleconomy.gov "Where the energy goes").
import { THREE, M, box, beam, tube } from '../kit.js';
import { COL, hex, board, panelBg, axes, title, line, dot, legend, sankey, sankeyLabels, dots, puffs, flowArrow, rng, heatColor, fitNarrow, inReel, reelBoards, clamp, K0 } from '../thermo.js';

const GAM = 1.4, T1 = 300, P1 = 100, T3 = 2500;
const REALK = 0.6;
const PLANTS = [
  { n: 'nuclear', T: 558, e: 0.33 },
  { n: 'coal', T: 873, e: 0.42 },
  { n: 'car', T: 2500, e: 0.30 },
  { n: 'gas, combined cycle', T: 1773, e: 0.60 },
];
const VIEWS = {
  carnot: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
  car: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
};
const pct = (v) => Math.round(v * 100) + '%';

// Otto cycle, volumes in units of the clearance volume (Vc = 1).
function otto(r) {
  const V1 = r, T2 = T1 * Math.pow(r, GAM - 1), P2 = P1 * Math.pow(r, GAM), P3 = P2 * (T3 / T2), P4 = P3 * Math.pow(1 / r, GAM);
  return { V1, T2, P2, P3, P4, eff: 1 - Math.pow(r, 1 - GAM) };
}
// Pressure at crank angle th (0–720°, 0 = top dead centre at the start of intake).
function ottoAt(r, deg) {
  const o = otto(r), a = (deg * Math.PI) / 180, V = 1 + ((r - 1) / 2) * (1 - Math.cos(a));
  const ph = Math.floor(deg / 180) % 4;
  let P;
  if (ph === 0) P = P1;
  else if (ph === 1) P = P1 * Math.pow(r / V, GAM);
  else if (ph === 2) P = o.P3 * Math.pow(1 / V, GAM);
  else P = P1;
  return { V, P, ph };
}

export default {
  id: 'engines',
  short: 'Heat engines',
  title: 'No engine can turn all its heat into work',
  subtitle: 'Carnot’s perfect engine, and the petrol engine in a car.',
  view: VIEWS.carnot,
  learn: `<p>A <b>heat engine</b> turns heat into motion. Fuel burns and makes a hot gas, the hot gas pushes, and the push drives wheels or a generator. Car engines, motorbikes, power stations and jet engines are all heat engines.</p>
    <p>In 1824 a young French engineer, <b>Sadi Carnot</b>, worked out the rule for all of them. Heat can only do work while it flows from something <b>hot</b> to something <b>cold</b>, just as a water wheel needs water to fall. And some heat must always be <b>dumped</b> into the cold side. You can never turn all of it into work.</p>
    <p>The best any engine can possibly do is the <b>Carnot limit</b>: <b>efficiency = 1 − T<sub>cold</sub> ÷ T<sub>hot</sub></b>, with both temperatures in <b>kelvin</b>. Between 600 K and 300 K, at most half the heat can become work. That is the second law in its engineer's form: the entropy the heat carries in must be carried out, and the cold side can only take it with some heat.</p>
    <p>A car's <b>petrol engine</b> squeezes air and fuel into a small space, sparks it, and the burning gas at about 2,500 K pushes the piston down. Carnot would allow 88%. Real engines manage about <b>25 to 35%</b>: heat soaks into the cylinder walls and coolant, the exhaust leaves still very hot, and friction takes its share. See CarClear and MotorcycleClear.</p>
    <p class="tip"><b>Try it:</b> raise the hot temperature and watch the limit climb. Then choose <b>Impossible</b> and try to dump no heat at all: the entropy books go negative, which never happens. In the car, raise the compression ratio and watch the loop get fatter.</p>`,
  terms: [
    { t: 'Heat engine', d: 'A machine that turns part of a flow of heat, from hot to cold, into work.' },
    { t: 'Efficiency', d: 'Work out ÷ heat in. For heat engines it is always less than 100%.' },
    { t: 'Carnot limit', d: 'The best possible efficiency: 1 − T_cold ÷ T_hot, with temperatures in kelvin.' },
    { t: 'Kelvin (K)', d: 'Temperature counted from absolute zero. 0 °C = 273.15 K.' },
    { t: 'Compression ratio', d: 'How much a petrol engine squeezes its mixture, about 10 to 1. Higher means more efficient.' },
    { t: 'Waste heat', d: 'The heat an engine must dump into its surroundings: through the radiator and exhaust in a car.' },
  ],
  defaults: { focus: 'carnot', th: 900, tc: 300, kind: 'perfect', r: 10 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'carnot', label: 'Carnot’s engine' }, { v: 'car', label: 'Car engine' }] },
    { key: 'th', type: 'range', label: 'Hot side, T hot', min: 350, max: 2500, step: 10, ends: ['350 K', '2,500 K'], fmt: (v) => `${v} K (${Math.round(v - K0)} °C)` },
    { key: 'tc', type: 'range', label: 'Cold side, T cold', min: 200, max: 400, step: 5, ends: ['200 K', '400 K'], fmt: (v) => `${v} K (${Math.round(v - K0)} °C)` },
    { key: 'kind', type: 'seg', label: 'The engine is', options: [{ v: 'perfect', label: 'Perfect' }, { v: 'real', label: 'Real' }, { v: 'impossible', label: 'Impossible' }] },
    { key: 'r', type: 'range', label: 'Car: compression ratio', min: 6, max: 14, step: 0.5, ends: ['6 : 1', '14 : 1'], fmt: (v) => `${v} : 1` },
  ],
  onChange(s, key) { if (key === 'r') s.focus = 'car'; if (key === 'th' || key === 'tc' || key === 'kind') s.focus = 'carnot'; },
  quiz: [
    { q: 'An engine takes heat from steam at 600 K and dumps heat to a river at 300 K. What is the best efficiency it could possibly have?', options: ['100%', '75%', '50%', '25%'], answer: 2, why: 'Carnot limit = 1 − 300 ÷ 600 = 0.5, so 50%. Even a perfect engine must dump half the heat into the river.' },
    { q: 'Why can’t a car engine turn all the heat from its fuel into motion?', options: ['Petrol isn’t pure enough', 'Heat can only do work while flowing to something colder, and some must always be dumped there', 'Engines are made badly', 'Air slows it down'], answer: 1, why: 'The second law: some heat must flow out to the cold side (exhaust and radiator). Carnot’s limit is the best possible, and real losses make it worse.' },
    { q: 'How could you raise the Carnot limit of an engine?', options: ['Make the hot side hotter or the cold side colder', 'Paint it black', 'Make it bigger', 'Run it slower'], answer: 0, why: '1 − T_cold ÷ T_hot grows when T_hot goes up or T_cold goes down. That is why power-station turbines run as hot as their metals allow.' },
  ],
  reel: [
    { ms: 5000, caption: 'Heat does work only as it flows from hot to cold, and some must always be dumped.', set: { focus: 'carnot', tc: 300, kind: 'perfect' }, anim: { th: [450, 2000] }, view: { pos: [0, 5.5, 9.4], target: [0, 4.7, 0] }, spin: 0.04 },
    { ms: 5200, caption: 'A car engine: Carnot allows 88%, the ideal cycle 60%, real engines about 30%.', set: { focus: 'car', r: 10 }, view: { pos: [-0.3, 5.5, 9.4], target: [-0.3, 4.7, 0] }, spin: 0.06 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gC = new THREE.Group(), gE = new THREE.Group(); root.add(gC, gE);
    const rnd = rng(12);
    const base = box(6.0, 0.12, 2.2, M.matte(0x2b3039)); base.position.set(0, 0.06, 0); root.add(base);

    // ---------------------------------------------------------------- Carnot: hot, engine, cold
    const hotMat = new THREE.MeshStandardMaterial({ color: 0x7a2a18, emissive: 0xff5a2a, emissiveIntensity: 0.6, roughness: 0.6 });
    const hot = box(1.1, 2.1, 1.5, hotMat); hot.position.set(-2.3, 1.2, 0); gC.add(hot);
    const coldMat = new THREE.MeshStandardMaterial({ color: 0x1d3f7a, emissive: 0x3b7bff, emissiveIntensity: 0.35, roughness: 0.4 });
    const cold = box(1.1, 2.1, 1.5, coldMat); cold.position.set(2.3, 1.2, 0); gC.add(cold);
    const lHot = stage.label('', [-2.3, 2.55, 0.5], gC, 'hot'), lCold = stage.label('', [2.3, 2.55, 0.5], gC, 'hot');
    lHot.element.style.setProperty('--c', COL.hot); lCold.element.style.setProperty('--c', COL.cold);
    // the engine: a cylinder, a piston rod and a flywheel
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 32, 1, true), M.clear(0xcfe8ff, 0.2)); cyl.position.set(0, 1.2, 0); gC.add(cyl);
    const gasC = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1, 32), new THREE.MeshStandardMaterial({ color: 0xff9a6a, transparent: true, opacity: 0.55, emissive: 0xff5a2a, emissiveIntensity: 0.3 })); gC.add(gasC);
    const pistC = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.14, 32), M.metal(0xb9bec8)); gC.add(pistC);
    const rodC = beam([0, 0, 0], [0, 1, 0], 0.04, M.metal(0xc9ced8)); gC.add(rodC);
    const fly = new THREE.Group(); fly.position.set(0, 2.55, 0); gC.add(fly);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 40), M.metal(0x6f7886)); wheel.rotation.x = Math.PI / 2; fly.add(wheel);
    const spoke = box(0.8, 0.07, 0.14, M.metal(0xc9a24a)); fly.add(spoke);
    const crankPin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.metal(0xd8dde6)); fly.add(crankPin); crankPin.position.set(0.3, 0, 0.08);
    const pipeIn = beam([-1.75, 1.2, 0], [-0.45, 1.2, 0], 0.08, M.metal(0xc07a4a)); gC.add(pipeIn);
    const pipeOut = beam([0.45, 1.2, 0], [1.75, 1.2, 0], 0.08, M.metal(0x8fb0ff)); gC.add(pipeOut);
    const qhDots = puffs(gC, 140, 0.055, hex(COL.hot), rnd), qcDots = puffs(gC, 140, 0.055, hex(COL.cold), rnd);
    const wArrow = flowArrow(hex(COL.work), 0.06, 0.28); gC.add(wArrow);
    const lEng = stage.label('', [0, 0.35, 0.9], gC), lW = stage.label('', [0.9, 3.05, 0.4], gC);

    // ---------------------------------------------------------------- car engine: one cylinder, cut away
    const CR = { y: 0.72, r: 0.35, L: 1.15, bore: 0.55 };
    gE.scale.setScalar(1.15); gE.position.x = -0.5;
    const blockM = M.clear(0xcfe8ff, 0.16);
    const cylE = new THREE.Mesh(new THREE.CylinderGeometry(CR.bore + 0.04, CR.bore + 0.04, 1.4, 40, 1, true), blockM); gE.add(cylE);
    const jacket = new THREE.Mesh(new THREE.CylinderGeometry(CR.bore + 0.2, CR.bore + 0.2, 1.3, 40, 1, true, 0, Math.PI * 1.3), M.clear(0x6fb6ff, 0.12)); gE.add(jacket);
    const head = box(1.6, 0.26, 1.4, M.metal(0x8c95a3, { roughness: 0.4 })); gE.add(head);
    const plug = beam([0, 0, 0], [0, 0.35, 0], 0.05, M.plastic(0xf2f4f7)); gE.add(plug);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), M.glow(0xfff2a0)); gE.add(spark);
    const valves = [-0.28, 0.28].map((x) => { const v = new THREE.Group(); v.add(beam([0, 0, 0], [0, 0.45, 0], 0.03, M.metal(0xc9ced8))); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 24), M.metal(0xc9ced8)); v.add(d); v.position.x = x; gE.add(v); return v; });
    const pist = new THREE.Mesh(new THREE.CylinderGeometry(CR.bore, CR.bore, 0.38, 40), M.metal(0xb9bec8, { roughness: 0.3 })); gE.add(pist);
    const gasMat = new THREE.MeshStandardMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.6, emissive: 0x000000, depthWrite: false });
    const gas = new THREE.Mesh(new THREE.CylinderGeometry(CR.bore - 0.01, CR.bore - 0.01, 1, 40), gasMat); gE.add(gas);
    const conrod = beam([0, 0, 0], [0, 1, 0], 0.07, M.metal(0x8c95a3)); gE.add(conrod);
    const crank = new THREE.Group(); crank.position.set(0, CR.y, 0); gE.add(crank);
    const web = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 40), M.metal(0x6f7886)); web.rotation.x = Math.PI / 2; web.position.z = -0.3; crank.add(web);
    const cwt = box(0.5, 0.25, 0.14, M.metal(0x4a505c)); cwt.position.set(0, -0.3, -0.3); crank.add(cwt);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 16), M.metal(0xd8dde6)); shaft.rotation.x = Math.PI / 2; crank.add(shaft);
    const exhaust = puffs(gE, 120, 0.07, 0x9aa3b2, rnd), coolant = puffs(gE, 120, 0.05, hex(COL.hot), rnd);
    const wArrowE = flowArrow(hex(COL.work), 0.06, 0.28); gE.add(wArrowE);
    const lStroke = stage.label('', [-1.6, 2.6, 0.5], gE, 'hot'), lCool = stage.label('coolant carries heat away', [-1.8, 1.0, 0.6], gE), lEx = stage.label('hot exhaust', [1.4, 3.35, 0.3], gE);
    lStroke.element.style.setProperty('--c', COL.heat);

    // ---------------------------------------------------------------- boards
    let S = {}, focus = '', key = '', deg = 0, spin = 0;
    const effOf = (s) => { const c = 1 - s.tc / s.th; return s.kind === 'perfect' ? c : s.kind === 'real' ? c * REALK : 1; };
    const flow = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (focus === 'carnot') {
        const e = Math.max(0, effOf(S));
        title(g, 'Where 100 J of heat goes', S.kind === 'impossible' ? 'not allowed!' : '');
        const sk = sankey(g, { x: 14, y: 60, w: w - 28, h: h - 84 }, [{ label: 'heat in', value: 100, color: COL.hot }],
          [{ label: 'work', value: 100 * e, color: COL.work }, { label: 'dumped', value: 100 * (1 - e), color: COL.cold }], { labelW: 150, bar: 16, gap: 16 });
        sankeyLabels(g, sk, (v) => v.toFixed(0) + ' J', { font: 22, small: 19 });
      } else {
        title(g, 'Where the fuel’s energy goes', 'a real petrol engine');
        const sk = sankey(g, { x: 14, y: 56, w: w - 28, h: h - 76 }, [{ label: 'fuel', value: 100, color: COL.heat }],
          [{ label: 'work at the wheels', value: 30, color: COL.work }, { label: 'hot exhaust', value: 35, color: '#9aa3b2' }, { label: 'coolant', value: 28, color: COL.hot }, { label: 'friction', value: 7, color: COL.inner }], { labelW: 170, bar: 16, gap: 12 });
        sankeyLabels(g, sk, (v) => v.toFixed(0) + '%', { font: 19, small: 17 });
      }
    }, [5.3, 3.4, 0]);
    const chart = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (focus === 'carnot') {
        title(g, 'The Carnot limit', `1 − T cold ÷ T hot, T cold = ${S.tc} K`);
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 60, y0: h - 44, xMin: 300, xMax: 2500, yMax: 1, xTicks: [500, 1000, 1500, 2000, 2500], yTicks: [0, 0.25, 0.5, 0.75, 1], xFmt: (v) => v + ' K', yFmt: pct });
        const pts = []; for (let T = S.tc; T <= 2500; T += 10) pts.push([T, 1 - S.tc / T]);
        g.fillStyle = 'rgba(255,90,160,.12)'; g.beginPath(); g.moveTo(X(Math.max(300, S.tc)), Y(1)); pts.forEach(([x, y]) => g.lineTo(X(Math.max(300, x)), Y(y))); g.lineTo(X(2500), Y(1)); g.closePath(); g.fill();
        line(g, pts.filter((p) => p[0] >= 300), X, Y, COL.work, 4);
        g.font = '16px sans-serif';
        for (const p of PLANTS) { g.fillStyle = '#c8d2e4'; g.beginPath(); g.arc(X(p.T), Y(p.e), 6, 0, 7); g.fill(); const tw = g.measureText(p.n).width; g.fillText(p.n, X(p.T) + 9 + tw > w - 10 ? X(p.T) - 9 - tw : X(p.T) + 9, Y(p.e) + 5); }
        g.fillStyle = 'rgba(255,90,160,.85)'; g.font = 'bold 17px sans-serif'; g.fillText('forbidden', X(420), Y(0.93));
        dot(g, X(S.th), Y(Math.min(1, effOf(S))), S.kind === 'impossible' ? COL.entropy : COL.work, 10);
      } else {
        const o = otto(S.r), cur = ottoAt(S.r, deg);
        title(g, 'Pressure and volume', 'the loop’s area is the work');
        const pMax = Math.ceil(o.P3 / 2000) * 2000;
        const { X, Y } = axes(g, w, h, { x0: 88, y1: 60, y0: h - 44, xMin: 0, xMax: 15, yMax: pMax / 1000, xTicks: [1, 5, 10, 14], yTicks: [0, pMax / 2000, pMax / 1000], xFmt: (v) => v + '', yFmt: (v) => v.toFixed(0) + ' MPa', xLabel: 'volume (× smallest)' });
        const loop = [];
        for (let V = o.V1; V >= 1; V -= 0.05) loop.push([V, (P1 * Math.pow(o.V1 / V, GAM)) / 1000]);
        for (let V = 1; V <= o.V1; V += 0.05) loop.push([V, (o.P3 * Math.pow(1 / V, GAM)) / 1000]);
        loop.push([o.V1, o.P4 / 1000], [o.V1, P1 / 1000]);
        g.fillStyle = 'rgba(92,225,169,.2)'; g.beginPath(); loop.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath(); g.fill();
        line(g, loop, X, Y, COL.work, 4);
        line(g, [[1, P1 / 1000], [o.V1, P1 / 1000]], X, Y, 'rgba(255,255,255,.4)', 3);
        dot(g, X(cur.V), Y(cur.P / 1000), COL.heat, 10);
      }
    }, [5.3, 1.05, 0]);

    const STROKES = ['Intake: air and fuel drawn in', 'Compression: squeezed about 10 : 1', 'Power: the hot gas pushes', 'Exhaust: hot gas pushed out'];

    return {
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lEng, lCool, lEx]); reelBoards([flow, chart]);
        if (s.focus !== focus) { focus = s.focus; gC.visible = focus === 'carnot'; gE.visible = focus === 'car'; const v = VIEWS[focus]; if (!inReel()) stage.setView(v.pos, v.target, 1.0); key = ''; }

        if (focus === 'carnot') {
          const e = clamp(effOf(s), 0, 1), qh = 1, W = e, qc = 1 - e;
          heatColor(clamp((s.th - 300) / 1800, 0.1, 1), hotMat.emissive); hotMat.emissiveIntensity = 0.4 + 0.5 * clamp((s.th - 300) / 2000, 0, 1);
          coldMat.emissiveIntensity = 0.2 + 0.4 * clamp((400 - s.tc) / 200, 0, 1);
          spin += dt * (0.6 + 4 * W); fly.rotation.z = -spin;
          const pinY = 2.55 + 0.3 * Math.sin(-spin), px = 0.3 * Math.cos(-spin);
          const pistY = 1.25 + 0.25 * Math.sin(-spin);
          pistC.position.set(0, pistY, 0); gasC.scale.y = pistY - 0.62 - 0.07; gasC.position.y = 0.62 + gasC.scale.y / 2;
          rodC.position.set(px / 2, (pistY + pinY) / 2, 0); rodC.scale.y = Math.hypot(px, pinY - pistY); rodC.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(px, pinY - pistY, 0).normalize());
          qhDots.step(dt, 60 * qh, () => [-1.7, 1.2 + (rnd() - 0.5) * 0.22, (rnd() - 0.5) * 0.22], () => [1.3 + rnd() * 0.2, 0, 0], 0.95);
          qcDots.step(dt, 60 * qc, () => [0.5, 1.2 + (rnd() - 0.5) * 0.22, (rnd() - 0.5) * 0.22], () => [1.3 + rnd() * 0.2, 0, 0], 0.95);
          wArrow.aim([0.55, 2.55, 0.3], [0, 1, 0], W * 1.1);
          lHot.element.innerHTML = `hot: <b>${s.th} K</b>`; lCold.element.innerHTML = `cold: <b>${s.tc} K</b>`;
          lEng.element.innerHTML = s.kind === 'impossible' ? 'dumps nothing: <b>impossible</b>' : `efficiency <b>${pct(e)}</b>`;
          lW.element.innerHTML = `work: <b>${(W * 100).toFixed(0)} J</b> per 100 J`;
          const k = `${s.th}|${s.tc}|${s.kind}`; if (k !== key) { key = k; flow.redraw(); chart.redraw(); }
        }

        if (focus === 'car') {
          deg = (deg + dt * 150) % 720;                             // slowed right down: 12.5 rpm
          const a = (deg * Math.PI) / 180;
          crank.rotation.z = -a;
          const sx = CR.r * Math.sin(a), sy = CR.r * Math.cos(a);
          const pinY = CR.y + sy + Math.sqrt(CR.L * CR.L - sx * sx);
          const clear = (2 * CR.r) / (s.r - 1), tdcTop = CR.y + CR.r + CR.L + 0.19, headY = tdcTop + clear;
          pist.position.set(0, pinY, 0);
          const top = pinY + 0.19;
          gas.scale.y = Math.max(0.01, headY - top); gas.position.y = top + gas.scale.y / 2;
          cylE.position.y = headY - 0.7; jacket.position.y = headY - 0.65; head.position.y = headY + 0.13;
          plug.position.set(0, headY + 0.2, 0); spark.position.set(0, headY - 0.04, 0);
          conrod.position.set(sx / 2, (CR.y + sy + pinY) / 2, 0); conrod.scale.y = Math.hypot(sx, pinY - CR.y - sy);
          conrod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-sx, pinY - CR.y - sy, 0).normalize());
          const ph = Math.floor(deg / 180);
          const within = (deg % 180) / 180;
          valves[0].position.y = headY - 0.08 - (ph === 0 ? 0.12 * Math.sin(within * Math.PI) : 0);
          valves[1].position.y = headY - 0.08 - (ph === 3 ? 0.12 * Math.sin(within * Math.PI) : 0);
          spark.visible = ph === 2 && within < 0.08;
          const temp = ph === 0 ? 300 : ph === 1 ? T1 * Math.pow(s.r / (1 + ((s.r - 1) / 2) * (1 - Math.cos(a))), GAM - 1) : ph === 2 ? T3 * Math.pow(1 / (1 + ((s.r - 1) / 2) * (1 - Math.cos(a))), GAM - 1) : 900;
          heatColor(clamp((temp - 300) / 2200, 0, 1), gasMat.emissive); gasMat.color.setHex(ph === 0 ? 0x9fd0ff : ph === 3 ? 0x9aa3b2 : 0xffc08a);
          if (ph === 0) gasMat.emissive.setHex(0x000000);
          exhaust.step(dt, ph === 3 ? 60 : 0, () => [0.3, headY + 0.1, (rnd() - 0.5) * 0.2], () => [0.9 + rnd() * 0.4, 0.6 + rnd() * 0.3, (rnd() - 0.5) * 0.2], 1.2);
          coolant.step(dt, ph >= 2 ? 40 : 8, () => { const t = rnd() * 2 * Math.PI; return [(CR.bore + 0.05) * Math.cos(t), headY - 0.2 - rnd() * 0.8, (CR.bore + 0.05) * Math.sin(t)]; }, () => [-0.5 - rnd() * 0.3, (rnd() - 0.5) * 0.2, 0], 1.0);
          wArrowE.aim([0.75, CR.y, 0.55], [1, 0, 0], ph === 2 ? 0.9 : 0.25);
          lStroke.position.set(-1.55, headY + 0.5, 0.5);
          lStroke.element.innerHTML = `<b>${STROKES[ph]}</b>`;
          lEx.position.set(1.5, headY + 0.75, 0.3);
          const k = `${Math.round(deg / 4)}|${s.r}`; if (k !== key) { key = k; chart.redraw(); if (!flow.done) { flow.redraw(); flow.done = true; } }
        } else flow.done = false;
      },
      readout: (s) => {
        if (focus === 'car') {
          const o = otto(s.r);
          return `<div class="big">Carnot 88% · ideal ${pct(o.eff)} · real about 30%</div>
            <div class="row"><span>Carnot limit, 1 − 300 K ÷ 2,500 K</span><b style="color:${COL.entropy}">88%</b></div>
            <div class="row"><span>Ideal petrol cycle, 1 − 1 ÷ r<sup>0.4</sup></span><b style="color:${COL.work}">${pct(o.eff)}</b></div>
            <div class="row"><span>Squeezed air heats to</span><b>${Math.round(o.T2 - K0)} °C</b></div>
            <div class="row"><span>Real engines, at their best</span><b style="color:${COL.heat}">25–35%</b></div>
            <small>The ideal cycle already loses heat in the hot exhaust. Real engines also leak heat into the cylinder walls and coolant, and lose some to friction.</small>`;
        }
        const c = 1 - s.tc / s.th, e = effOf(s), W = 100 * e, Qc = 100 - W;
        const Sin = 100 / s.th, Sout = Qc / s.tc, dS = Sout - Sin;
        return `<div class="big">Carnot limit: 1 − ${s.tc} ÷ ${s.th} = ${pct(c)}</div>
          <div class="row"><span>This engine turns into work</span><b style="color:${COL.work}">${W.toFixed(0)} J of 100 J</b></div>
          <div class="row"><span>Heat it must dump to the cold side</span><b style="color:${COL.cold}">${Qc.toFixed(0)} J</b></div>
          <div class="row"><span>Entropy taken in, Q<sub>h</sub> ÷ T<sub>h</sub></span><b>${Sin.toFixed(3)} J/K</b></div>
          <div class="row"><span>Entropy dumped, Q<sub>c</sub> ÷ T<sub>c</sub></span><b>${Sout.toFixed(3)} J/K</b></div>
          <div class="row"><span>Entropy made</span><b style="color:${dS < -1e-6 ? '#ff5a5a' : COL.entropy}">${Math.abs(dS) < 5e-4 ? '0.000' : (dS > 0 ? '+' : '') + dS.toFixed(3)} J/K</b></div>
          <small>${s.kind === 'impossible' ? 'Dumping no heat would destroy entropy. The second law forbids it: no engine is 100% efficient.' : s.kind === 'real' ? 'A real engine gets less work and dumps more heat, so it makes entropy. Every real process does.' : 'A perfect engine makes no new entropy: what comes in with the heat goes out with the dumped heat.'}</small>`;
      },
    };
  },
};
