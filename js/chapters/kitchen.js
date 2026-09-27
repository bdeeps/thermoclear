// Chapter 4: heat flows downhill in the kitchen (ice drink: 1 scene unit ≈ 4 cm; hob: ≈ 12 cm).
// Ice in a drink: m_d grams of drink (treated as water, c = 4,186 J/kg·K) and m_i grams of ice from
//   a freezer at −18 °C (c_ice = 2,100 J/kg·K, latent heat of melting 334 kJ/kg). Cubes of 25 g
//   (27 cm³, about 3 cm a side). Heat flows into the ice at q = h·A·(T_drink − T_ice), with
//   h = 300 W/m²·K (still liquid round a melting cube; natural convection in water is roughly
//   100–1,000) and A the cubes' surface, which shrinks as m^(2/3). Meltwater joins the drink at 0 °C.
//   Heat from the room is left out: think of a well-insulated tumbler. Shown 20× fast.
//   Final state from the energy books: if the drink can give enough heat to warm and melt all the
//   ice, T_f = (m_d·c·T_d − m_i·c_ice·18 − m_i·L) ÷ ((m_d + m_i)·c); otherwise 0 °C with some ice left.
//   Entropy change: m c ln(T_f/T_0) for each part, plus m_melt·L ÷ 273.15 K for the melting. Always > 0.
// Pot on a gas hob: an LPG burner of 0.5–2.5 kW (a domestic Indian 2-burner stove is about
//   1.5–2 kW per burner). About 60 % reaches the pot in everyday use (BIS IS 4246 asks a new LPG
//   stove for at least 68 % in a standard test with a matched vessel); the rest leaves as hot flue
//   gas, which the chimney hood pulls away (see ChimneyClear). The pot loses heat to the kitchen at
//   2.5 W/K. LPG–air flames reach about 1,950 °C (adiabatic flame temperature of propane and
//   butane in air, about 1,970–1,980 °C). Once at 100 °C, each 2,257 J boils off 1 g. Shown 20× fast.
import { THREE, M, box, beam, tube, latheX } from '../kit.js';
import { COL, K0, C_WATER, C_ICE, L_FUS, L_VAP, hex, board, panelBg, axes, title, line, sankey, sankeyLabels, puffs, flowArrow, rng, heatColor, tempColor, fitNarrow, inReel, reelBoards, clamp, fmtJ, fmtW } from '../thermo.js';

const ICE = { h: 300, cube: 0.025, rho: 917, T0: -18, fast: 20 };
const HOB = { eta: 0.6, UA: 2.5, Tflame: 1950, Troom: 30, fast: 20 };
const VIEWS = {
  ice: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
  hob: { pos: [2.2, 4.3, 11.6], target: [2.2, 3.0, 0] },
};

// Final equilibrium of drink + ice (grams, °C).
export function iceFinal(md, Td, mi) {
  const m = md / 1000, i = mi / 1000;
  const avail = m * C_WATER * Td, Q1 = i * C_ICE * -ICE.T0, Q2 = i * L_FUS;
  if (avail >= Q1 + Q2) return { T: (avail - Q1 - Q2) / ((m + i) * C_WATER), melted: mi, Q1, Q2, Q3: 0, avail };
  if (avail >= Q1) return { T: 0, melted: ((avail - Q1) / L_FUS) * 1000, Q1, Q2: avail - Q1, Q3: 0, avail };
  return { T: 0, melted: 0, Q1: avail, Q2: 0, Q3: 0, avail };
}

export default {
  id: 'kitchen',
  short: 'In the kitchen',
  title: 'Cold never flows in: heat flows out',
  subtitle: 'Ice in a drink and a pot on the flame. Heat always runs downhill, and entropy always grows.',
  view: VIEWS.ice,
  learn: `<p>Drop ice into a warm drink and the drink gets cold. It feels as if <b>cold flows out of the ice</b>. It doesn't. <b>Heat flows out of the drink into the ice</b>, downhill, as the second law says. There is no such thing as a flow of "cold".</p>
    <p>That heat first warms the ice from the freezer's −18 °C up to 0 °C. Then it does something sneaky: it <b>melts</b> the ice without warming it at all. Melting 1 gram takes <b>334 joules</b>, enough to cool 80 grams of drink by 1 °C. That hidden <b>latent heat</b>, not the ice's coldness, is why ice cools a drink so well.</p>
    <p>At the end, the drink and the meltwater sit at <b>one temperature</b>. That's the zeroth law again: thermal equilibrium. And the total entropy has gone <b>up</b>: the ice gained more entropy than the drink lost, because the same heat counts for more at a lower temperature (ΔS = Q ÷ T).</p>
    <p>On the <b>hob</b>, heat tumbles down a staircase: a flame at about <b>1,950 °C</b>, the pot, the water at up to 100 °C, and finally the kitchen at 30 °C. Every step makes entropy, and none can run backwards. Hot flue gas that misses the pot goes up the chimney hood. See ChimneyClear, and AirFryerClear for heat blown into food.</p>
    <p class="tip"><b>Try it:</b> add lots of ice to a small drink and watch the drink stop at 0 °C with ice left over. On the hob, turn the flame down and see how much longer the water takes to boil.</p>`,
  terms: [
    { t: 'Latent heat', d: 'Energy that melts or boils something without changing its temperature. Melting ice takes 334 J per gram.' },
    { t: 'Specific heat', d: 'The energy to warm 1 kg by 1 °C: 4,186 J for water, about 2,100 J for ice.' },
    { t: 'Thermal equilibrium', d: 'The end state: everything in touch at the same temperature, and no more heat flowing.' },
    { t: 'ΔS = Q ÷ T', d: 'Heat Q arriving at temperature T adds entropy Q ÷ T. The same heat counts for more when it is cold.' },
    { t: 'Flue gas', d: 'The hot burnt gas from a flame. The part that misses the pot carries heat away.' },
  ],
  defaults: { focus: 'ice', drink: 250, tdrink: 35, ice: 75, flame: 1.8, litres: 1.5 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'ice', label: 'Ice in a drink' }, { v: 'hob', label: 'Pot on the hob' }] },
    { key: 'drink', type: 'range', label: 'Ice: drink in the glass', min: 100, max: 400, step: 10, ends: ['100 mL', '400 mL'], fmt: (v) => v + ' mL' },
    { key: 'tdrink', type: 'range', label: 'Ice: drink starts at', min: 5, max: 45, step: 1, ends: ['5 °C', '45 °C'], fmt: (v) => v + ' °C' },
    { key: 'ice', type: 'range', label: 'Ice: ice from the freezer (−18 °C)', min: 0, max: 200, step: 25, ends: ['none', '8 cubes'], fmt: (v) => `${v} g (${Math.round(v / 25)} cubes)` },
    { key: 'go', type: 'buttons', label: 'Ice', items: [{ label: 'Drop the ice in', act: (s, inst) => { s.focus = 'ice'; inst.dropIce(s); } }] },
    { key: 'flame', type: 'range', label: 'Hob: flame size', min: 0.5, max: 2.5, step: 0.1, ends: ['sim', 'full'], fmt: (v) => v.toFixed(1) + ' kW of gas' },
    { key: 'litres', type: 'range', label: 'Hob: water in the pot', min: 0.5, max: 3, step: 0.1, ends: ['0.5 L', '3 L'], fmt: (v) => v.toFixed(1) + ' L' },
    { key: 'go2', type: 'buttons', label: 'Hob', items: [{ label: 'Fresh cold water', act: (s, inst) => { s.focus = 'hob'; inst.refill(s); } }] },
  ],
  onChange(s, key) { if (['drink', 'tdrink', 'ice'].includes(key)) { s.focus = 'ice'; s._ice = true; } if (key === 'litres') { s.focus = 'hob'; s._pot = true; } if (key === 'flame') s.focus = 'hob'; },
  quiz: [
    { q: 'When you drop ice into a warm drink, what actually flows?', options: ['Cold flows from the ice into the drink', 'Heat flows from the drink into the ice', 'Both at once, equally', 'Nothing flows; the ice just shrinks'], answer: 1, why: 'Heat always flows from hotter to colder. The drink loses heat to the ice, which is why the drink cools. "Cold" is just less heat.' },
    { q: 'Why is ice at 0 °C much better at cooling a drink than the same amount of water at 0 °C?', options: ['Ice is heavier', 'Melting soaks up 334 J per gram without the ice warming up', 'Ice is colder than 0 °C inside', 'Water can’t cool anything'], answer: 1, why: 'Melting takes latent heat: 334 J per gram. Ice soaks up that heat as it melts, while water at 0 °C can only warm up.' },
    { q: 'A pot of water sits on a flame at about 1,950 °C. Why doesn’t the water get hotter than 100 °C?', options: ['The flame isn’t hot enough', 'At 100 °C the heat goes into turning water into steam instead', 'The pot blocks the heat', 'Water can’t be heated'], answer: 1, why: 'At the boiling point, each 2,257 J boils off a gram of water. The temperature stays at 100 °C until the water is gone.' },
  ],
  reel: [
    { ms: 5400, caption: 'Ice doesn’t push cold into a drink. Heat flows out of the drink into the ice and melts it.', set: { focus: 'ice', drink: 300, tdrink: 35, ice: 75 }, act: (s, inst) => inst.dropIce(s), view: { pos: [-0.6, 5.5, 9.4], target: [-0.6, 4.7, 0] }, spin: 0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gI = new THREE.Group(), gH = new THREE.Group(); root.add(gI, gH);
    gH.scale.setScalar(1.25); gH.position.x = 0.1; gI.scale.setScalar(1.12);
    const rnd = rng(44);
    const ground = box(6.0, 0.1, 2.6, M.matte(0x2b3039)); ground.position.set(0, 0.05, 0); root.add(ground);

    // ---------------------------------------------------------------- the glass, drink and ice
    const GL = { x: -0.9, r: 0.95, y0: 0.14, H: 2.6 };   // about 480 mL fills it
    const glass = latheX([[0, GL.r * 0.85], [GL.H, GL.r]], M.clear(0xffffff, 0.16), { seg: 48 }); glass.rotation.z = Math.PI / 2; glass.position.set(GL.x, GL.y0, 0); gI.add(glass);
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(GL.r * 0.85, GL.r * 0.85, 0.12, 48), M.clear(0xffffff, 0.3)); bottom.position.set(GL.x, GL.y0 + 0.06, 0); gI.add(bottom);
    const drinkMat = new THREE.MeshStandardMaterial({ color: 0x6b2e14, roughness: 0.2, transparent: true, opacity: 0.72, emissive: 0x000000 });
    const drink = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48), drinkMat); gI.add(drink);
    const cubes = Array.from({ length: 8 }, (_, i) => { const c = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0xe8f6ff, roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.85, thickness: 0.4 })); c.castShadow = true; c.userData.ph = rnd() * 6; gI.add(c); return c; });
    const pos8 = [[-0.35, 0.3], [0.3, 0.32], [0, -0.3], [-0.4, -0.35], [0.4, -0.28], [0.05, 0.05], [-0.1, 0.45], [0.42, 0.05]];
    const lDrink = stage.label('', [GL.x - 1.6, 1.0, 0.4], gI, 'hot'), lIce = stage.label('', [GL.x + 1.55, 2.2, 0.4], gI, 'hot');
    lDrink.element.style.setProperty('--c', COL.hot); lIce.element.style.setProperty('--c', COL.cold);
    const hFlow = puffs(gI, 120, 0.045, hex(COL.heat), rnd);
    const thermo = beam([GL.x + 0.55, GL.y0 + 0.4, 0.3], [GL.x + 0.85, GL.y0 + 3.0, 0.3], 0.035, M.clear(0xffffff, 0.5)); gI.add(thermo);
    const tBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), M.glow(0xff3b30)); tBulb.position.set(GL.x + 0.56, GL.y0 + 0.4, 0.3); gI.add(tBulb);

    // ---------------------------------------------------------------- hob, flame and pot
    const hobTop = box(3.2, 0.12, 2.0, M.plastic(0x16181d, { roughness: 0.15, metalness: 0.2 })); hobTop.position.set(-0.8, 0.5, 0); gH.add(hobTop);
    const hobBody = box(3.2, 0.4, 2.0, M.metal(0x8c95a3)); hobBody.position.set(-0.8, 0.25, 0); gH.add(hobBody);
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 32), M.metal(0x3a3f4b)); burner.position.set(-0.8, 0.62, 0); gH.add(burner);
    const flames = []; const flameMat = new THREE.MeshBasicMaterial({ color: 0x4f8bff, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false });
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), flameMat); f.position.set(-0.8 + 0.4 * Math.cos(a), 0.8, 0.4 * Math.sin(a)); f.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); f.userData.ph = rnd() * 6; gH.add(f); flames.push(f); }
    const potR = 0.75;
    const pot = latheX([[0, potR], [1.3, potR]], M.metal(0xc9ced8, { side: THREE.DoubleSide, roughness: 0.25 }), { seg: 48, phiStart: Math.PI * 0.6, phiLength: Math.PI * 1.8 }); pot.rotation.z = Math.PI / 2; pot.position.set(-0.8, 1.02, 0); gH.add(pot);
    const potBase = new THREE.Mesh(new THREE.CylinderGeometry(potR, potR, 0.06, 48), M.metal(0x8c95a3)); potBase.position.set(-0.8, 1.02, 0); gH.add(potBase);
    const baseGlow = new THREE.MeshBasicMaterial({ color: 0x331108, toneMapped: false }); const bg = new THREE.Mesh(new THREE.CylinderGeometry(potR * 0.7, potR * 0.7, 0.01, 40), baseGlow); bg.position.set(-0.8, 0.985, 0); gH.add(bg);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.15, transparent: true, opacity: 0.75, emissive: 0x000000 });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(potR - 0.03, potR - 0.03, 1, 48), waterMat); gH.add(water);
    const handle = beam([-0.8 + potR, 2.0, 0], [-0.8 + potR + 0.8, 2.05, 0], 0.05, M.matte(0x1b1d22)); gH.add(handle);
    const flue = puffs(gH, 160, 0.06, hex(COL.hot), rnd), steam = puffs(gH, 120, 0.07, 0xe8eef8, rnd), potLoss = puffs(gH, 80, 0.04, hex(COL.heat), rnd);
    const qArrowH = flowArrow(hex(COL.heat), 0.06, 0.26); gH.add(qArrowH);
    const lFlame = stage.label('', [0.9, 0.75, 0.6], gH, 'hot'), lWater = stage.label('', [-0.8, 2.75, 0.4], gH, 'hot'), lRoom = stage.label('kitchen: 30 °C', [1.6, 2.2, 0], gH);
    lFlame.element.style.setProperty('--c', COL.hot); lWater.element.style.setProperty('--c', COL.cold);

    // ---------------------------------------------------------------- state
    const ic = { md: 0.25, Td: 30, mi: 0, Ti: -18, n: 0, t: 0, rows: [], Qin: 0 };
    const hc = { m: 1.5, T: 25, t: 0, rows: [], boiled: 0, Egas: 0, Ewater: 0, Eloss: 0, Eflue: 0 };
    let S = {}, focus = '', key = '';
    const dropIce = (s2) => { if (s2) S = s2; Object.assign(ic, { md: S.drink / 1000, Td: S.tdrink, mi: S.ice / 1000, Ti: ICE.T0, n: Math.round(S.ice / 25), t: 0, Qin: 0, md0: S.drink / 1000, Td0: S.tdrink, mi0: S.ice / 1000 }); ic.rows.length = 0; };
    const refill = (s2) => { if (s2) S = s2; Object.assign(hc, { m: S.litres, T: 25, t: 0, boiled: 0, Egas: 0, Ewater: 0, Eloss: 0, Eflue: 0 }); hc.rows.length = 0; };

    const bA = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (focus === 'ice') {
        const f = iceFinal(ic.md0 * 1000, ic.Td0, ic.mi0 * 1000);
        title(g, 'Temperatures', 'minutes');
        const T1 = Math.max(600, ic.t), yMax = Math.ceil((ic.Td0 + 5) / 10) * 10;
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 64, y0: h - 44, xMax: T1, yMin: -20, yMax, xTicks: [0, 120, 240, 360, 480, 600].filter((v) => v <= T1), yTicks: [-20, -10, 0, 10, 20, 30, 40].filter((v) => v <= yMax), xFmt: (v) => (v / 60).toFixed(0), yFmt: (v) => v + '°' });
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(0), Y(f.T)); g.lineTo(X(T1), Y(f.T)); g.stroke(); g.setLineDash([]);
        g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(`ends at ${f.T.toFixed(1)} °C`, X(T1) - 140, Y(f.T) - 8);
        line(g, ic.rows.map((r) => [r[0], r[1]]), X, Y, COL.hot, 5);
        line(g, ic.rows.filter((r) => r[2] !== null).map((r) => [r[0], r[2]]), X, Y, COL.cold, 5);
      } else {
        title(g, 'Water temperature', 'minutes');
        const T1 = Math.max(900, hc.t);
        const xt = []; for (let v = 0; v <= T1; v += T1 > 1800 ? 600 : 300) xt.push(v);
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 64, y0: h - 44, xMax: T1, yMax: 110, xTicks: xt, yTicks: [0, 25, 50, 75, 100], xFmt: (v) => (v / 60).toFixed(0), yFmt: (v) => v + '°' });
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(0), Y(100)); g.lineTo(X(T1), Y(100)); g.stroke(); g.setLineDash([]);
        line(g, hc.rows, X, Y, COL.hot, 5);
      }
    }, [5.3, 3.4, 0]);
    const bB = board(root, 3.9, 2.25, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (focus === 'ice') {
        const f = iceFinal(ic.md0 * 1000, ic.Td0, ic.mi0 * 1000);
        title(g, 'Where the drink’s heat goes', 'by the end');
        if (ic.mi0 <= 0) { g.font = '21px sans-serif'; g.fillStyle = COL.text; g.fillText('No ice, no heat flow: nothing to do.', 24, 180); return; }
        const outs = [{ label: 'warm ice to 0 °C', value: f.Q1, color: COL.cold }, { label: 'melt it', value: f.Q2, color: COL.inner }, { label: 'warm meltwater', value: (ic.mi0) * C_WATER * f.T, color: COL.heat }];
        const tot = outs.reduce((a, b) => a + b.value, 0);
        const s2 = sankey(g, { x: 14, y: 56, w: w - 28, h: h - 76 }, [{ label: 'drink cools', value: tot, color: COL.hot }], outs, { labelW: 160, bar: 16, gap: 14 });
        sankeyLabels(g, s2, (v) => fmtJ(v), { font: 19, small: 17 });
      } else {
        title(g, 'Where the gas’s heat went', hc.t > 0 ? `${(hc.t / 60).toFixed(0)} min` : '');
        const E = hc.Egas || 1, has = hc.Egas > 0;
        const s2 = sankey(g, { x: 14, y: 56, w: w - 28, h: h - 76 }, [{ label: 'burning gas', value: has ? hc.Egas : 100, color: COL.hot }],
          [{ label: 'into the water', value: has ? hc.Ewater + hc.boiled * L_VAP : 55, color: COL.heat }, { label: 'up the chimney', value: has ? hc.Eflue : 40, color: '#9aa3b2' }, { label: 'pot to kitchen', value: has ? hc.Eloss : 5, color: COL.inner }], { labelW: 170, bar: 16, gap: 14 });
        sankeyLabels(g, s2, (v) => (has ? fmtJ(v) : '') + ` · ${Math.round((v / (has ? E : 100)) * 100)}%`, { font: 19, small: 17 });
      }
    }, [5.3, 1.05, 0]);

    return {
      dropIce, refill,
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lRoom]); reelBoards([bA, bB], -0.6);
        if (s.focus !== focus) { focus = s.focus; gI.visible = focus === 'ice'; gH.visible = focus === 'hob'; const v = VIEWS[focus]; if (!inReel()) stage.setView(v.pos, v.target, 1.0); if (focus === 'ice' && !ic.md0) dropIce(); if (focus === 'hob' && !hc.rows.length) refill(); key = ''; }
        if (s._ice) { s._ice = false; dropIce(); }
        if (s._pot) { s._pot = false; refill(); }

        if (focus === 'ice') {
          const n = 20, h = (dt * ICE.fast) / n;
          for (let k = 0; k < n; k++) {
            if (ic.mi <= 1e-6 || ic.n === 0) break;
            const per = ic.mi / ic.n, side = Math.cbrt(per / ICE.rho), A = ic.n * 6 * side * side;
            const q = Math.max(0, ICE.h * A * (ic.Td - ic.Ti)) * h;
            ic.Td -= q / (ic.md * C_WATER); ic.Qin += q;
            if (ic.Ti < 0) { ic.Ti = Math.min(0, ic.Ti + q / (ic.mi * C_ICE)); }
            else { const dm = Math.min(ic.mi, q / L_FUS); ic.mi -= dm; ic.Td = (ic.md * ic.Td) / (ic.md + dm); ic.md += dm; }
            if (ic.Td < 0) ic.Td = 0;
          }
          ic.t += dt * ICE.fast;
          if (ic.t < 1800 && (!ic.rows.length || ic.t - ic.rows[ic.rows.length - 1][0] > 4)) ic.rows.push([ic.t, ic.Td, ic.mi > 1e-5 ? ic.Ti : null]);
          if (ic.t > 1500) dropIce();
          const H = clamp((ic.md * 1e3) / 480, 0.05, 1) * (GL.H - 0.2), rT = GL.r * 0.85 + (GL.r - GL.r * 0.85) * (H / GL.H);
          drink.scale.set(rT - 0.04, H, rT - 0.04); drink.position.set(GL.x, GL.y0 + 0.12 + H / 2, 0);
          const surf = GL.y0 + 0.12 + H;
          drinkMat.color.copy(tempColor(ic.Td + K0, 268, 318)).multiplyScalar(0.55).lerp(new THREE.Color(0x6b2e14), 0.55);
          cubes.forEach((c, i) => {
            const on = i < ic.n && ic.mi > 1e-5;
            c.visible = on; if (!on) return;
            const side = Math.cbrt(ic.mi / ic.n / ICE.rho) * 25;   // 1 unit = 4 cm
            c.scale.setScalar(Math.max(0.05, side));
            const [px, pz] = pos8[i];
            c.position.set(GL.x + px * 1.1, surf - side * 0.4 + 0.04 * Math.sin(ic.t * 0.05 + c.userData.ph) + (i >= 5 ? side * 0.6 : 0), pz * 0.9);
            c.rotation.set(0.2 * Math.sin(c.userData.ph), c.userData.ph, 0.15);
          });
          const qRate = ic.mi > 1e-5 ? ICE.h * ic.n * 6 * Math.pow(ic.mi / ic.n / ICE.rho, 2 / 3) * (ic.Td - ic.Ti) : 0;
          hFlow.step(dt, qRate * 0.3, () => { const a = rnd() * Math.PI * 2, r = 0.55 + rnd() * 0.25; return [GL.x + r * Math.cos(a), GL.y0 + 0.4 + rnd() * (surf - GL.y0 - 0.6), r * Math.sin(a)]; }, () => [0, 0.5, 0], 0.9);
          // steer heat dots toward the ice
          hFlow.mesh.visible = qRate > 0.5;
          tBulb.material.color.copy(tempColor(ic.Td + K0, 268, 318));
          lDrink.element.innerHTML = `drink: <b>${ic.Td.toFixed(1)} °C</b>`;
          lIce.element.innerHTML = ic.mi > 1e-5 ? `ice: <b>${ic.Ti.toFixed(0)} °C</b> · ${(ic.mi * 1000).toFixed(0)} g left` : ic.mi0 > 0 ? 'ice: <b>all melted</b>' : 'no ice';
          lIce.position.set(GL.x + 1.75, surf + 0.3, 0.4);
          const k = `${ic.rows.length}|${s.drink}|${s.tdrink}|${s.ice}`; if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
        }

        if (focus === 'hob') {
          const n = 10, h = (dt * HOB.fast) / n, P = s.flame * 1000;
          for (let k = 0; k < n; k++) {
            const toPot = P * HOB.eta * h, loss = HOB.UA * (hc.T - HOB.Troom) * h;
            hc.Egas += P * h; hc.Eflue += P * (1 - HOB.eta) * h; hc.Eloss += loss;
            let net = toPot - loss;
            if (hc.T < 100 || net < 0) { hc.T += net / (hc.m * C_WATER); hc.Ewater += net; if (hc.T > 100) { const extra = (hc.T - 100) * hc.m * C_WATER; hc.T = 100; hc.Ewater -= extra; const b = extra / L_VAP; hc.boiled += b; hc.m -= b; } }
            else { const b = net / L_VAP; hc.boiled += b; hc.m = Math.max(0.05, hc.m - b); }
          }
          hc.t += dt * HOB.fast;
          if (!hc.rows.length || hc.t - hc.rows[hc.rows.length - 1][0] > 10) hc.rows.push([hc.t, hc.T]);
          if (hc.t > 2400 || hc.boiled > 0.3) refill();
          const H = clamp(0.33 * hc.m, 0.03, 1.2);          // 18 cm pot: 3.9 cm of water per litre, 1 unit = 12 cm
          water.scale.y = H; water.position.set(-0.8, 1.05 + H / 2, 0);
          waterMat.color.copy(tempColor(hc.T + K0, 290, 373)).lerp(new THREE.Color(0x3b82f6), 0.35);
          const fk = s.flame / 2.5;
          flames.forEach((f, i) => { f.scale.set(1, 0.5 + 1.2 * fk + 0.15 * Math.sin(performance.now() * 0.01 * 0 + hc.t * 0.8 + f.userData.ph), 1); f.position.y = 0.72 + 0.15 * f.scale.y; });
          heatColor(0.2 + 0.4 * fk, baseGlow.color);
          flue.step(dt, 50 * fk, () => { const a = rnd() * Math.PI * 2; return [-0.8 + (potR + 0.08) * Math.cos(a), 1.0, (potR + 0.08) * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.2, 1.3 + rnd() * 0.5, (rnd() - 0.5) * 0.2], 1.3);
          steam.step(dt, hc.T >= 99.9 ? 40 * fk : 0, () => [-0.8 + (rnd() - 0.5) * 1.2, 1.1 + H, (rnd() - 0.5) * 1.2], () => [(rnd() - 0.5) * 0.3, 0.6 + rnd() * 0.3, (rnd() - 0.5) * 0.3], 1.4);
          potLoss.step(dt, (hc.T - HOB.Troom) * 0.3, () => { const a = rnd() * Math.PI - Math.PI / 2; return [-0.8 + potR * Math.cos(a), 1.2 + rnd() * H, potR * Math.sin(a)]; }, () => [0.5, 0.15, 0], 1.0);
          qArrowH.aim([-0.8, 0.62, 1.15], [0, 1, 0], 0.3 + 0.5 * fk);
          lFlame.element.innerHTML = `flame: <b>~1,950 °C</b> · ${s.flame.toFixed(1)} kW`;
          lWater.position.set(-0.8, 1.55 + H, 0.4);
          lWater.element.innerHTML = `water: <b>${hc.T.toFixed(0)} °C</b>${hc.boiled > 0.001 ? ` · ${(hc.boiled * 1000).toFixed(0)} g boiled off` : ''}`;
          const k = `${hc.rows.length}|${s.flame}`; if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
        }
      },
      readout: (s) => {
        if (focus === 'hob') {
          const P = s.flame * 1000, toPot = P * HOB.eta, loss = HOB.UA * (hc.T - HOB.Troom), Tf = HOB.Tflame + K0, Tw = hc.T + K0, Tr = HOB.Troom + K0;
          const tBoil = (s.litres * C_WATER * 75) / Math.max(1, toPot - HOB.UA * (62 - HOB.Troom));
          const sGen = toPot * (1 / Tw - 1 / Tf) + P * (1 - HOB.eta) * (1 / Tr - 1 / Tf) + Math.max(0, loss) * (1 / Tr - 1 / Tw);
          return `<div class="big">1,950 °C → ${hc.T.toFixed(0)} °C → 30 °C</div>
            <div class="row"><span>Heat into the pot, 60% of ${fmtW(P)}</span><b style="color:${COL.heat}">${fmtW(toPot)}</b></div>
            <div class="row"><span>Up the chimney as hot gas</span><b>${fmtW(P * (1 - HOB.eta))}</b></div>
            <div class="row"><span>Pot leaking to the kitchen</span><b>${fmtW(Math.max(0, loss))}</b></div>
            <div class="row"><span>25 → 100 °C takes about</span><b>${(tBoil / 60).toFixed(0)} min</b></div>
            <div class="row"><span>Entropy made, Σ Q (1/T<sub>cold</sub> − 1/T<sub>hot</sub>)</span><b style="color:${COL.entropy}">+${sGen.toFixed(2)} W/K</b></div>
            <small>Each step of the staircase moves heat downhill and makes entropy. The water can’t pass 100 °C: extra heat boils it away, 2,257 J per gram.</small>`;
        }
        const f = iceFinal(s.drink, s.tdrink, s.ice), md = s.drink / 1000, mi = s.ice / 1000, Tf = f.T + K0;
        const dS = md * C_WATER * Math.log(Tf / (s.tdrink + K0)) + mi * C_ICE * Math.log(K0 / (K0 + ICE.T0)) + (f.melted / 1000) * L_FUS / K0 + (f.melted / 1000) * C_WATER * Math.log(Tf / K0);
        return `<div class="big">${s.drink} mL at ${s.tdrink} °C + ${s.ice} g ice → ${f.T.toFixed(1)} °C</div>
          <div class="row"><span>Heat to warm the ice to 0 °C, m c ΔT</span><b style="color:${COL.cold}">${fmtJ(f.Q1)}</b></div>
          <div class="row"><span>Heat to melt it, 334 J per gram</span><b style="color:${COL.inner}">${fmtJ(f.Q2)}</b></div>
          <div class="row"><span>Ice melted by the end</span><b>${f.melted.toFixed(0)} of ${s.ice} g</b></div>
          <div class="row"><span>Drink now</span><b style="color:${COL.hot}">${ic.Td.toFixed(1)} °C</b></div>
          <div class="row"><span>Entropy change, all of it</span><b style="color:${COL.entropy}">+${dS.toFixed(2)} J/K</b></div>
          <small>${f.melted < s.ice - 0.5 ? 'Not enough heat in the drink to melt all the ice: everything ends at 0 °C, ice and water together.' : 'The drink loses entropy, the ice gains more. The total goes up, as the second law demands.'}</small>`;
      },
    };
  },
};
