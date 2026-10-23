/* eslint-disable */
// @ts-nocheck — перенос models.js из прототипа (3D-интерактив) почти без изменений: Three.js r169, 1 ед. ≈ 1 см.
// Отличия от прототипа: THREE импортируется, а не передаётся параметром; состояние портов по умолчанию — детерминированное.
// TODO(API): opts — порты (spd_equipment_ports.oper_status), батареи (ibps.battery_count), топливо, секторы БШД, длина пролёта РРЛ.
import * as THREE from "three"

// ЕСТУ · 3D-модели оборудования (Three.js r169).
// Каждая модель — функция build<Type>(opts) -> THREE.Group.
// Цвета и размеры условные (1 ед. = ~1 см). Фронтенду: подключать через TresJS/Three, данные (порты, статусы) передавать в opts.

export const C = {
  bg: 0x0a0b0e, ground: 0x15181e, rack: 0x343a46, rackEdge: 0x4a515d, metal: 0x8a929e, dark: 0x111318,
  blue: 0x085eff, lblue: 0x5b93ff, green: 0x3ddc84, amber: 0xffc24a, red: 0xff5257, white: 0xd7dbe2,
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.55, metalness: o.m ?? 0.35, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.op, opacity: o.op ?? 1 });
const box = (w, h, d, color, o) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, o));
const led = (color) => new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.4), mat(color, { e: color, ei: 2.2, r: 0.2 }));
const at = (o, x, y, z) => (o.position.set(x, y, z), o);

export function ground(w = 260, d = 220) {
  const g = new THREE.Group();
  g.add(at(box(w, 4, d, C.ground, { r: 0.9, m: 0.05 }), 0, -2, 0));
  const grid = new THREE.GridHelper(Math.max(w, d), 12, 0x2a3140, 0x1d222b); grid.position.y = 0.2; g.add(grid);
  return g;
}

// 19" стойка 42U. units: [{u, h, kind:'switch'|'router'|'patch'|'srv', ports, highlight, out}]
export function buildRack({ units = [], height = 42 } = {}) {
  const U = 4.45, W = 60, D = 80, H = height * U + 10;
  const g = new THREE.Group();
  const shell = box(W, H, D, C.rack, { m: 0.5 }); shell.position.y = H / 2; g.add(shell);
  const front = box(W - 6, H - 8, 0.5, 0x161a20); front.position.set(0, H / 2, D / 2 + 0.3); g.add(front);
  for (const x of [-W / 2 + 3, W / 2 - 3]) g.add(at(box(1.4, H - 6, 1.4, C.lblue, { e: C.lblue, ei: 0.35 }), x, H / 2, D / 2 + 0.8));
  for (const dev of units) {
    const h = (dev.h || 1) * U - 0.6, y = 5 + dev.u * U + h / 2;
    const col = dev.highlight ? 0x2a3446 : (dev.kind === 'patch' ? 0x2a303a : 0x3d4553);
    const unit = box(W - 8, h, D - 6, col, { m: 0.6, e: dev.highlight ? C.blue : 0, ei: dev.highlight ? 0.25 : 0 });
    unit.position.set(0, y, (dev.out || 0) - 2); unit.userData = { kind: dev.kind, name: dev.name };
    g.add(unit);
    const n = dev.ports || 12;
    for (let i = 0; i < n; i++) {
      const st = dev.portState ? dev.portState[i] : ((i * 7) % 10 < 8 ? 'up' : 'off');
      const c = st === 'up' ? C.green : st === 'down' ? C.red : 0x3a3f48;
      const l = led(c); l.position.set(-W / 2 + 8 + i * ((W - 16) / n), y + h * 0.15, (dev.out || 0) - 2 + (D - 6) / 2 + 0.3);
      g.add(l);
    }
  }
  return g;
}

export function buildSwitch(o = {}) {
  const g = new THREE.Group(); g.add(ground());
  const r1 = buildRack({ units: Array.from({ length: 18 }, (_, i) => ({ u: i * 2 + 1, kind: i % 3 ? 'srv' : 'patch', ports: 10 })) }); r1.position.x = -40; g.add(r1);
  const units = Array.from({ length: 16 }, (_, i) => ({ u: i * 2 + 1, kind: 'srv', ports: 10 }));
  units.push({ u: 20, kind: o.router ? 'router' : 'switch', h: o.router ? 2 : 1, ports: o.router ? 8 : 24, highlight: true, out: 40, name: o.name || 'sw2.atr2',
    portState: o.portState || Array.from({ length: 24 }, (_, i) => (i === 6 || i === 11 ? 'down' : i > 17 ? 'off' : 'up')) });
  const r2 = buildRack({ units }); r2.position.x = 40; g.add(r2);
  return g;
}

export function buildChassis({ slots = 16, faulty = [10] } = {}) {
  const g = new THREE.Group(); g.add(ground());
  const W = 90, H = 200, D = 80;
  g.add(at(box(W, H, D, C.rack, { m: 0.5 }), 0, H / 2, 0));
  for (let i = 0; i < slots; i++) {
    const w = (W - 12) / slots - 0.8, x = -W / 2 + 6 + i * ((W - 12) / slots) + w / 2;
    const c = faulty.includes(i) ? C.red : (i % 5 === 0 ? C.lblue : C.green);
    g.add(at(box(w, 100, 2, 0x1a1f27), x, 120, D / 2 + 1));
    g.add(at(led(c), x, 165, D / 2 + 2.2));
  }
  const fibers = [C.lblue, C.amber, 0xa78bfa];
  fibers.forEach((c, i) => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-20 + i * 10, H, 0), new THREE.Vector3(-20 + i * 10, H + 40, 0), new THREE.Vector3(80, H + 40, 20 + i * 6), new THREE.Vector3(110, 60, 20 + i * 6)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 1.2, 8), mat(c, { e: c, ei: 0.8 })));
  });
  return g;
}

export function buildUPS({ batteries = 8 } = {}) {
  const g = new THREE.Group(); g.add(ground());
  g.add(at(box(45, 130, 70, 0x2a2f38, { m: 0.5 }), -50, 65, 0));
  g.add(at(box(30, 20, 1, 0x06080b, { e: C.green, ei: 0.15 }), -50, 105, 35.6));
  g.add(at(led(C.green), -60, 120, 36));
  g.add(at(box(90, 110, 70, C.rack, { m: 0.5 }), 30, 55, 0));
  for (let i = 0; i < batteries; i++) {
    const r = Math.floor(i / 4), c = i % 4;
    g.add(at(box(18, 26, 30, 0x2b3a30, { e: C.green, ei: 0.08 }), -2 + c * 21, 18 + r * 34, 15));
  }
  return g;
}

export function buildGenerator({ fuel = 0.64 } = {}) {
  const g = new THREE.Group(); g.add(ground());
  g.add(at(box(170, 8, 80, 0x2a2e36), -10, 4, 0));
  g.add(at(box(160, 80, 72, 0x2f6f4f, { r: 0.6 }), -10, 48, 0));
  for (let i = 0; i < 14; i++) g.add(at(box(3, 50, 1, 0x163828), -80 + i * 5, 48, 36.5));
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 30, 16), mat(0x4a515d)), 50, 100, -15));
  g.add(at(box(30, 45, 60, 0x3a3424), 95, 22.5, 0));
  const lvl = box(1, 45 * fuel, 50, C.amber, { e: C.amber, ei: 0.4 }); lvl.position.set(110.6, (45 * fuel) / 2, 0); g.add(lvl);
  return g;
}

function lattice(H = 300, base = 20, top = 6, seg = 10) {
  const g = new THREE.Group(), m = mat(C.metal, { m: 0.8, r: 0.35 });
  const corner = (i, f) => { const s = base + (top - base) * f; const sx = i === 0 || i === 3 ? -1 : 1, sz = i < 2 ? -1 : 1; return new THREE.Vector3(sx * s, H * f, sz * s); };
  const rod = (a, b, r) => { const len = a.distanceTo(b); const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), m); mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.lookAt(b); mesh.rotateX(Math.PI / 2); return mesh; };
  for (let i = 0; i < 4; i++) g.add(rod(corner(i, 0), corner(i, 1), 1.1));
  for (let k = 0; k < seg; k++) for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4, f0 = k / seg, f1 = (k + 1) / seg;
    g.add(rod(corner(i, f0), corner(j, f1), 0.4)); g.add(rod(corner(i, f1), corner(j, f1), 0.4));
  }
  const bcn = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 16), mat(C.red, { e: C.red, ei: 3 })); bcn.position.y = H + 6; g.add(bcn);
  return g;
}
function dish(r = 12) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3), mat(C.white, { r: 0.4 }));
  d.material.side = THREE.DoubleSide; d.rotation.z = Math.PI / 2; return d;
}

export function buildRRL({ distance = 260 } = {}) {
  const g = new THREE.Group(); g.add(ground(420, 200));
  const t1 = lattice(260); t1.position.x = -distance / 2; g.add(t1);
  const t2 = lattice(200); t2.position.x = distance / 2; g.add(t2);
  const d1 = dish(14); d1.position.set(-distance / 2 + 14, 220, 0); g.add(d1);
  const d2 = dish(14); d2.position.set(distance / 2 - 14, 165, 0); d2.rotation.z = -Math.PI / 2; g.add(d2);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-distance / 2 + 20, 220, 0), new THREE.Vector3(0, 280, 0), new THREE.Vector3(distance / 2 - 20, 165, 0));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 1.4, 8), mat(C.lblue, { e: C.lblue, ei: 1.5, op: 0.85 })));
  return g;
}

export function buildBaseStation({ sectors = 3, width = 120, range = 140 } = {}) {
  const g = new THREE.Group(); g.add(ground(340, 340));
  g.add(lattice(260));
  const cols = [C.blue, 0x3ddcff, 0xa78bfa, C.green];
  for (let i = 0; i < sectors; i++) {
    const az = (i * 2 * Math.PI) / sectors, w = (width * Math.PI) / 180;
    const geo = new THREE.CircleGeometry(range, 32, az - w / 2, w); geo.rotateX(-Math.PI / 2);
    const s = new THREE.Mesh(geo, mat(cols[i % 4], { op: 0.22, e: cols[i % 4], ei: 0.3 })); s.position.y = 0.5; g.add(s);
    const ant = box(5, 40, 3, C.white); ant.position.set(Math.cos(az) * 10, 230, -Math.sin(az) * 10); ant.rotation.y = az; g.add(ant);
  }
  return g;
}

export function buildVSAT({ leo = false } = {}) {
  const g = new THREE.Group(); g.add(ground());
  g.add(at(box(120, 60, 100, 0x2a2f38), 20, 30, 0));
  if (leo) g.add(at(box(34, 4, 34, 0xe6e9ee), 20, 62, 0));
  else { const d = dish(26); d.position.set(-60, 60, 0); d.rotation.set(0, 0, Math.PI / 2.6); g.add(d); g.add(at(box(4, 50, 4, C.metal), -60, 25, 0)); }
  const sat = new THREE.Group();
  sat.add(box(16, 10, 10, 0xcfd4dc)); sat.add(at(box(40, 1, 14, 0x2f7bff, { e: 0x2f7bff, ei: 0.3 }), -30, 0, 0)); sat.add(at(box(40, 1, 14, 0x2f7bff, { e: 0x2f7bff, ei: 0.3 }), 30, 0, 0));
  sat.position.set(140, 300, -60); g.add(sat);
  const from = leo ? new THREE.Vector3(20, 64, 0) : new THREE.Vector3(-55, 70, 0);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(from, sat.position), 1, 0.8, 6), mat(C.green, { e: C.green, ei: 1.5 })));
  return g;
}

export function buildNode() {
  const g = new THREE.Group(); g.add(ground(320, 280));
  g.add(at(box(150, 90, 100, 0x3a404b), -40, 45, 20));
  for (let i = 0; i < 4; i++) g.add(at(box(20, 6, 1, C.lblue, { e: C.lblue, ei: 1.5 }), -95 + i * 32, 55, 70.6));
  const m = lattice(280); m.position.set(90, 0, -60); g.add(m);
  for (let i = 0; i < 3; i++) { const a = box(5, 36, 3, C.white); const az = (i * 2 * Math.PI) / 3; a.position.set(90 + Math.cos(az) * 9, 250, -60 - Math.sin(az) * 9); a.rotation.y = az; g.add(a); }
  g.add(at(box(30, 50, 24, 0x2a2f38), 70, 25, 60));
  const fiber = new THREE.CatmullRomCurve3([new THREE.Vector3(160, 1, 100), new THREE.Vector3(40, 1, 100), new THREE.Vector3(40, 1, 70)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(fiber, 30, 1.6, 8), mat(C.lblue, { e: C.lblue, ei: 1.6 })));
  return g;
}

export const MODELS = {
  node: { title: 'Узел связи', build: buildNode },
  switch: { title: 'Коммутатор в стойке', build: () => buildSwitch() },
  router: { title: 'Маршрутизатор в стойке', build: () => buildSwitch({ router: true, name: 'gw0.atr1' }) },
  sdh: { title: 'SDH / PDH / DWDM полка', build: () => buildChassis() },
  ups: { title: 'ИБП + батарейный шкаф', build: () => buildUPS() },
  dgu: { title: 'ГЭУ с баком', build: () => buildGenerator() },
  rrl: { title: 'РРЛ / радиомост', build: () => buildRRL() },
  bs: { title: 'БС с секторами (БШД)', build: () => buildBaseStation() },
  vsat: { title: 'VSAT', build: () => buildVSAT() },
  oneweb: { title: 'OneWeb', build: () => buildVSAT({ leo: true }) },
};
