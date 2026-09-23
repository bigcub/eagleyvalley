import {
  inPoly,
  nearest,
  type Feature,
  type P,
  type Segment,
} from '../core/geo';
import {
  KERB,
  isCarriageway,
  roadSpec,
  type RoadSpec,
  type Side,
} from './road-spec';

// Carriageway network built from OSM centrelines.
//
// Ways are split into edges wherever they share a node. Where two edges meet
// nearly straight they simply join. Where three or more meet, or two meet at a
// sharp angle, each edge is trimmed back and the gap is filled by a junction
// polygon with filleted kerb corners. Junction nodes joined by an edge too
// short for both junctions merge into one cluster, and that edge disappears
// inside the junction. Kerbs, pavements and markings are paths along edge
// sides and around corners; the same paths answer ground queries, so the
// drawn surfaces and the walking height agree.

type V = [number, number];
/** A path point with its outward (away from carriageway) unit normal. */
type Pt = { p: P; out: V };
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];
const len = (a: V) => Math.hypot(a[0], a[1]);
const unit = (a: V): V => mul(a, 1 / (len(a) || 1));
/** Right-hand normal in world x/z (south of an eastward direction). */
const perp = (d: V): V => [-d[1], d[0]];

export type Edge = {
  id: number;
  f: Feature;
  spec: RoadSpec;
  pts: P[];
  cum: number[];
  length: number;
  segs: Segment[];
  /** Trimmed distance from each end, metres along the centreline. */
  trim: [number, number];
  /** Normal to use exactly at each end, so straight joins share a seam. */
  endNormal: [V | undefined, V | undefined];
  /** Inside a merged junction: not drawn as road, not an arm. */
  internal: boolean;
};
type Arm = {
  edge: Edge;
  atStart: boolean;
  /** The arm's own node; clusters have several. */
  node: P;
  dir: V;
  hw: number;
  angle: number;
};
export type KerbPath = {
  pts: P[];
  /** Unit vectors pointing away from the carriageway, one per point. */
  out: V[];
  kerb: boolean;
  pavement: number;
  yellow: boolean[];
  /** Edge of a service road (courts, car parks, private lanes). */
  service?: boolean;
};
export type Junction = {
  centre: P;
  arms: Arm[];
  polygon: P[];
  bounds: [number, number, number, number];
  /** Arm cross-sections where the junction meets each trimmed edge. */
  seams: [P, P][];
};
type Corner = {
  a: Arm;
  b: Arm;
  straight: boolean;
  phi: number;
  t0: number;
  u0: number;
  radius: number;
};

export function sideSpec(e: Edge, side: 1 | -1): Side {
  return side === 1 ? e.spec.right : e.spec.left;
}
function yellowAt(s: Side, p: P) {
  return typeof s.yellow === 'function' ? s.yellow(...p) : s.yellow;
}
const STRAIGHT = (160 * Math.PI) / 180;

export function buildRoadNetwork(
  roads: Feature[],
  roadY: (x: number, z: number, r: ReturnType<typeof nearest>) => number,
) {
  // ---- Topology ----
  const ways = roads.filter(isCarriageway);
  const key = (p: P) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const uses = new Map<string, number>();
  for (const f of ways)
    f.points.forEach((p, i) => {
      const k = key(p);
      const end = i === 0 || i === f.points.length - 1;
      uses.set(k, (uses.get(k) ?? 0) + (end ? 2 : 1));
    });
  const isNode = (p: P) => (uses.get(key(p)) ?? 0) >= 2;

  const edges: Edge[] = [];
  for (const f of ways) {
    const spec = roadSpec(f);
    let run: P[] = [f.points[0]];
    for (let i = 1; i < f.points.length; i++) {
      run.push(f.points[i]);
      if (i === f.points.length - 1 || isNode(f.points[i])) {
        if (run.length > 1) edges.push(makeEdge(edges.length, f, spec, run));
        run = [f.points[i]];
      }
    }
  }
  const nodes = new Map<string, Arm[]>();
  for (const e of edges)
    for (const atStart of [true, false]) {
      const node = atStart ? e.pts[0] : e.pts[e.pts.length - 1];
      const probe = pointAt(
        e,
        atStart
          ? Math.min(3, e.length / 2)
          : e.length - Math.min(3, e.length / 2),
      );
      const dir = unit(sub(probe.p, node));
      const k = key(node);
      nodes.set(k, [
        ...(nodes.get(k) ?? []),
        {
          edge: e,
          atStart,
          node,
          dir,
          hw: e.spec.width(...node) / 2,
          angle: Math.atan2(dir[1], dir[0]),
        },
      ]);
    }

  const setback = (arm: Arm) => arm.edge.trim[arm.atStart ? 0 : 1];
  const armSide = (arm: Arm, s: 1 | -1) => (arm.atStart ? s : (-s as 1 | -1));

  // Straight two-way joins share one normal at the seam; everything else with
  // two or more arms is a junction.
  const junctionKeys: string[] = [];
  for (const [k, arms] of nodes) {
    if (arms.length < 2) continue;
    if (arms.length === 2) {
      const turn = Math.abs(Math.PI - angleBetween(arms[0].dir, arms[1].dir));
      if (turn < (30 * Math.PI) / 180) {
        const through = unit(sub(arms[1].dir, arms[0].dir));
        const n = perp(through);
        for (const arm of arms) {
          const along = arm.atStart ? arm.dir : mul(arm.dir, -1);
          arm.edge.endNormal[arm.atStart ? 0 : 1] = mul(
            n,
            dot(along, through) >= 0 ? 1 : -1,
          );
        }
        continue;
      }
    }
    junctionKeys.push(k);
  }

  // ---- Clusters: merge junctions joined by edges too short for both ----
  const parent = new Map(junctionKeys.map((k) => [k, k]));
  const find = (k: string): string =>
    parent.get(k) === k ? k : find(parent.get(k)!);
  const firstPass = new Map<Arm, number>();
  for (const k of junctionKeys)
    for (const [arm, need] of layout(nodes.get(k)!, nodes.get(k)![0].node)
      .needs)
      firstPass.set(arm, need);
  for (const e of edges) {
    const a = key(e.pts[0]),
      b = key(e.pts[e.pts.length - 1]);
    if (!parent.has(a) || !parent.has(b) || a === b) continue;
    const arms = [...nodes.get(a)!, ...nodes.get(b)!].filter(
      (arm) => arm.edge === e,
    );
    const need = arms.reduce((s, arm) => s + (firstPass.get(arm) ?? 0), 0);
    // Only genuinely short links merge; longer ones share their length.
    if (e.length < 9 && need > e.length * 0.9) {
      parent.set(find(a), find(b));
      e.internal = true;
    }
  }
  const clusters = new Map<string, string[]>();
  for (const k of junctionKeys)
    clusters.set(find(k), [...(clusters.get(find(k)) ?? []), k]);

  // ---- Junction layout ----
  const plans: { centre: P; arms: Arm[]; corners: Corner[] }[] = [];
  for (const members of clusters.values()) {
    const arms = members
      .flatMap((k) => nodes.get(k)!)
      .filter((arm) => !arm.edge.internal);
    if (arms.length < 2) continue;
    const pts = members.map((k) => nodes.get(k)![0].node);
    const centre: P = [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
    const { needs, corners } = layout(arms, centre);
    for (const [arm, need] of needs)
      arm.edge.trim[arm.atStart ? 0 : 1] = Math.min(need, 25);
    plans.push({ centre, arms, corners });
  }
  // Edges between two junctions share their length.
  for (const e of edges) {
    const total = e.trim[0] + e.trim[1];
    if (!e.internal && total > e.length * 0.9) {
      const k = (e.length * 0.9) / total;
      e.trim = [e.trim[0] * k, e.trim[1] * k];
    }
  }

  /** Sort arms round a centre and size each corner's fillet and setbacks. */
  function layout(arms: Arm[], centre: P) {
    for (const arm of arms) {
      const probe = add(arm.node, mul(arm.dir, 4));
      arm.angle = Math.atan2(probe[1] - centre[1], probe[0] - centre[0]);
    }
    arms.sort((p, q) => p.angle - q.angle);
    const corners: Corner[] = arms.map((a, i) => {
      const b = arms[(i + 1) % arms.length];
      let phi = Math.atan2(b.dir[1], b.dir[0]) - Math.atan2(a.dir[1], a.dir[0]);
      while (phi <= 0) phi += Math.PI * 2;
      while (phi > Math.PI * 2) phi -= Math.PI * 2;
      const straight = arms.length === 1 || phi > STRAIGHT;
      // a's right edge line and b's left edge line face each other.
      const pa = add(a.node, mul(perp(a.dir), a.hw)),
        pb = add(b.node, mul(perp(b.dir), -b.hw));
      const [t0, u0] = straight ? [0, 0] : intersect(pa, a.dir, pb, b.dir);
      // Acute corners get a tighter radius so the fillet stays within 2m.
      const radius = straight
        ? 0
        : Math.min(
            Math.max(a.edge.spec.cornerRadius, b.edge.spec.cornerRadius),
            2 * Math.tan(phi / 2),
          );
      return { a, b, straight, phi, t0, u0, radius };
    });
    const tangent = (c: Corner) =>
      c.straight ? 0 : c.radius / Math.tan(c.phi / 2);
    // Tapered roads: re-measure each arm's width where its fillets begin and
    // solve the corners again, so arcs meet the real kerb lines.
    for (const c of corners) {
      if (c.straight) continue;
      for (const [arm, t] of [
        [c.a, c.t0 + tangent(c)],
        [c.b, c.u0 + tangent(c)],
      ] as [Arm, number][]) {
        const e = arm.edge;
        const at = pointAt(e, arm.atStart ? t : e.length - t).p;
        arm.hw = Math.min(arm.hw, e.spec.width(...at) / 2);
      }
    }
    for (const c of corners) {
      if (c.straight) continue;
      const pa = add(c.a.node, mul(perp(c.a.dir), c.a.hw)),
        pb = add(c.b.node, mul(perp(c.b.dir), -c.b.hw));
      [c.t0, c.u0] = intersect(pa, c.a.dir, pb, c.b.dir);
    }
    const needs = new Map<Arm, number>();
    for (const arm of arms) {
      let need = 1;
      for (const c of corners) {
        if (c.a === arm) need = Math.max(need, c.t0 + tangent(c) + 0.3);
        if (c.b === arm) need = Math.max(need, c.u0 + tangent(c) + 0.3);
      }
      needs.set(arm, need);
    }
    return { needs, corners };
  }

  /** Point on an arm's edge line, `t` metres from its node. */
  function armPoint(arm: Arm, sign: 1 | -1, t: number): P {
    const e = arm.edge,
      s = arm.atStart ? t : e.length - t;
    const at = pointAt(e, s),
      n = normalAt(e, s),
      k = ((arm.atStart ? 1 : -1) * sign * e.spec.width(...at.p)) / 2;
    return [at.p[0] + n[0] * k, at.p[1] + n[1] * k];
  }
  /** Outward normal at an arm's seam on the given side. */
  function armOut(arm: Arm, sign: 1 | -1): V {
    const e = arm.edge,
      s = setback(arm);
    return mul(
      normalAt(e, arm.atStart ? s : e.length - s),
      (arm.atStart ? 1 : -1) * sign,
    );
  }
  /** Points along an arm edge line, each with its outward normal. */
  function armRun(arm: Arm, sign: 1 | -1, t0: number, t1: number): Pt[] {
    const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / 0.5));
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = t0 + ((t1 - t0) * i) / n,
        e = arm.edge;
      const nrm = normalAt(e, arm.atStart ? t : e.length - t);
      return {
        p: armPoint(arm, sign, t),
        out: mul(nrm, (arm.atStart ? 1 : -1) * sign),
      };
    });
  }

  // ---- Junction polygons and corner kerb paths ----
  const junctions: Junction[] = [];
  const kerbPaths: KerbPath[] = [];
  for (const { centre, arms, corners } of plans) {
    const polygon: P[] = [];
    const seams: [P, P][] = arms.map((arm) => [
      armPoint(arm, -1, setback(arm)),
      armPoint(arm, 1, setback(arm)),
    ]);
    corners.forEach((c, i) => {
      const j = (i + 1) % arms.length;
      polygon.push(...seams[i]);
      const sa = setback(c.a),
        sb = setback(c.b);
      let path: Pt[];
      const room = Math.min(sa - c.t0, sb - c.u0) - 0.1;
      if (c.straight) {
        // Straight joins follow both real edge lines in to their nodes.
        path = [...armRun(c.a, 1, sa, 0), ...armRun(c.b, -1, 0, sb)];
      } else if (room <= 0.05 || c.radius < 0.05) {
        // No room for a fillet: meet at the kerb lines' intersection if it
        // lies inside both seams, otherwise cut straight across.
        path =
          c.t0 >= 0 && c.u0 >= 0 && c.t0 <= sa && c.u0 <= sb
            ? [...armRun(c.a, 1, sa, c.t0), ...armRun(c.b, -1, c.u0, sb)]
            : [
                { p: seams[i][1], out: armOut(c.a, 1) },
                { p: seams[j][0], out: armOut(c.b, -1) },
              ];
      } else {
        // Shrink the fillet if trimming left too little room for it.
        const radius = Math.min(c.radius, room * Math.tan(c.phi / 2));
        const tan = radius / Math.tan(c.phi / 2);
        const pa = add(c.a.node, mul(perp(c.a.dir), c.a.hw));
        const x = add(pa, mul(c.a.dir, c.t0));
        const ta = add(x, mul(c.a.dir, tan)),
          tb = add(x, mul(c.b.dir, tan));
        const bis = unit(add(c.a.dir, c.b.dir));
        const centreArc = add(x, mul(bis, radius / Math.sin(c.phi / 2)));
        const a0 = Math.atan2(ta[1] - centreArc[1], ta[0] - centreArc[0]);
        let sweep = Math.atan2(tb[1] - centreArc[1], tb[0] - centreArc[0]) - a0;
        while (sweep > Math.PI) sweep -= Math.PI * 2;
        while (sweep < -Math.PI) sweep += Math.PI * 2;
        const n = Math.max(2, Math.ceil((Math.abs(sweep) * radius) / 0.35));
        // Arc normals point to the fillet centre, away from the road.
        const arc: Pt[] = Array.from({ length: n + 1 }, (_, k) => {
          const ang = a0 + (sweep * k) / n;
          return {
            p: [
              centreArc[0] + Math.cos(ang) * radius,
              centreArc[1] + Math.sin(ang) * radius,
            ],
            out: [-Math.cos(ang), -Math.sin(ang)],
          };
        });
        path = [
          ...armRun(c.a, 1, sa, Math.max(0, c.t0 + tan)),
          ...arc,
          ...armRun(c.b, -1, Math.max(0, c.u0 + tan), sb),
        ];
      }
      path = smooth(dedupe(path));
      polygon.push(...path.slice(1, -1).map((q) => q.p));
      // Corner kerb exists if either adjoining side has one; the pavement only
      // continues round the corner when both sides have one.
      const sideA = sideSpec(c.a.edge, armSide(c.a, 1)),
        sideB = sideSpec(c.b.edge, armSide(c.b, -1));
      const from = path[0].p,
        to = path[path.length - 1].p;
      const okA = !sideA.where || sideA.where(...from),
        okB = !sideB.where || sideB.where(...to);
      kerbPaths.push(
        cornerPath(
          path,
          (sideA.kerb && okA) || (sideB.kerb && okB),
          sideA.pavement && sideB.pavement && okA && okB
            ? Math.min(sideA.pavement, sideB.pavement)
            : 0,
          !!(yellowAt(sideA, from) && yellowAt(sideB, to)),
          c.a.edge.f.tags.highway === 'service' &&
            c.b.edge.f.tags.highway === 'service',
        ),
      );
    });
    const xs = polygon.map((p) => p[0]),
      zs = polygon.map((p) => p[1]);
    junctions.push({
      centre,
      arms,
      polygon,
      seams,
      bounds: [
        Math.min(...xs),
        Math.max(...xs),
        Math.min(...zs),
        Math.max(...zs),
      ],
    });
  }

  // ---- Edge side kerb paths ----
  function sideLine(e: Edge, side: 1 | -1) {
    return stations(e, e.trim[0], e.length - e.trim[1]).map((s) => {
      const at = pointAt(e, s);
      const n = mul(normalAt(e, s), side);
      return {
        p: add(at.p, mul(n, e.spec.width(...at.p) / 2)) as P,
        out: n,
      };
    });
  }
  for (const e of edges) {
    if (e.internal) continue;
    for (const side of [-1, 1] as const) {
      const s = sideSpec(e, side);
      // Split where the side's `where` predicate changes.
      let run: { p: P; out: V }[] = [];
      let inside: boolean | undefined;
      const flush = () => {
        if (run.length > 1)
          kerbPaths.push({
            pts: run.map((r) => r.p),
            out: run.map((r) => r.out),
            kerb: s.kerb && !!inside,
            pavement: inside ? s.pavement : 0,
            yellow: run.map((r) => !!yellowAt(s, r.p)),
            service: e.f.tags.highway === 'service',
          });
        run = [];
      };
      for (const q of sideLine(e, side)) {
        const now = !s.where || s.where(...q.p);
        if (inside !== undefined && now !== inside) {
          run.push(q);
          flush();
        }
        inside = now;
        run.push(q);
      }
      flush();
    }
  }

  // ---- Spatial index and queries ----
  // Cells hold individual segments so a lookup only tests nearby geometry.
  const CELL = 8;
  type Cell = {
    roads: { e: Edge; i: number }[];
    junctions: Junction[];
    kerbs: { k: KerbPath; i: number; reach: number }[];
  };
  const grid = new Map<number, Cell>();
  const cellId = (i: number, j: number) => i * 100003 + j;
  const cellOf = (x: number, z: number) =>
    grid.get(cellId(Math.floor(x / CELL), Math.floor(z / CELL)));
  function cover(
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    fn: (c: Cell) => void,
  ) {
    for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++)
      for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
        const k = cellId(i, j);
        let c = grid.get(k);
        if (!c) grid.set(k, (c = { roads: [], junctions: [], kerbs: [] }));
        fn(c);
      }
  }
  const box = (a: P, b: P, r: number) =>
    [
      Math.min(a[0], b[0]) - r,
      Math.max(a[0], b[0]) + r,
      Math.min(a[1], b[1]) - r,
      Math.max(a[1], b[1]) + r,
    ] as const;
  for (const e of edges)
    if (!e.internal)
      e.segs.forEach((s, i) => {
        const r = Math.max(e.spec.width(...s.a), e.spec.width(...s.b)) / 2;
        cover(...box(s.a, s.b, r + 0.5), (c) => c.roads.push({ e, i }));
      });
  for (const j of junctions)
    cover(j.bounds[0], j.bounds[1], j.bounds[2], j.bounds[3], (c) =>
      c.junctions.push(j),
    );
  for (const k of kerbPaths) {
    const reach = k.pavement + (k.kerb ? KERB.width : 0);
    for (let i = 1; i < k.pts.length; i++)
      cover(...box(k.pts[i - 1], k.pts[i], reach + 2.2), (c) =>
        c.kerbs.push({ k, i, reach }),
      );
  }
  const paved: { p: P[]; b: number[] }[] = [];
  // Dropped kerbs at crossings: the kerb falls to 20mm over a ramp.
  const drops: { x: number; z: number; r: number }[] = [];
  const RAMP = 1;
  /** Kerb height at a point on a kerb line, lowered near dropped crossings. */
  function kerbLift(x: number, z: number) {
    let f = 1;
    for (const d of drops) {
      const t = (Math.hypot(x - d.x, z - d.z) - d.r) / RAMP;
      if (t < 1) f = Math.min(f, Math.max(0, t));
    }
    return 0.02 + (KERB.height - 0.02) * f * f * (3 - 2 * f);
  }

  // Allocation-free projection onto segment a-b; results in PT/PX/PZ/PD.
  let PT = 0,
    PX = 0,
    PZ = 0,
    PD = 0;
  function project(x: number, z: number, a: P, b: P) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    let t = ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    PT = t;
    PX = a[0] + dx * t;
    PZ = a[1] + dz * t;
    PD = Math.hypot(x - PX, z - PZ);
  }
  /** Signed distance beyond the kerb line on the outward side of a kerb segment. */
  function outward(k: KerbPath, i: number, x: number, z: number) {
    const o0 = k.out[i - 1],
      o1 = k.out[i];
    const ox = o0[0] * (1 - PT) + o1[0] * PT,
      oz = o0[1] * (1 - PT) + o1[1] * PT;
    return (x - PX) * ox + (z - PZ) * oz;
  }

  function edgeY(e: Edge, x: number, z: number) {
    return roadY(x, z, nearest(x, z, e.segs));
  }
  /** Carriageway height, blending arms inside junctions so seams match. */
  function junctionY(j: Junction, x: number, z: number) {
    let sum = 0,
      weight = 0;
    j.arms.forEach((arm, i) => {
      project(x, z, ...j.seams[i]);
      const w = 1 / (PD * PD + 1e-4);
      sum += w * edgeY(arm.edge, x, z);
      weight += w;
    });
    return sum / weight;
  }
  /** Carriageway surface height, or undefined off the carriageway. */
  function carriageway(x: number, z: number) {
    const c = cellOf(x, z);
    if (!c) return undefined;
    for (const j of c.junctions)
      if (
        x >= j.bounds[0] &&
        x <= j.bounds[1] &&
        z >= j.bounds[2] &&
        z <= j.bounds[3] &&
        inPoly(x, z, j.polygon)
      )
        return junctionY(j, x, z);
    for (const { e, i } of c.roads) {
      const s = e.segs[i];
      project(x, z, s.a, s.b);
      if (PD > e.spec.width(PX, PZ) / 2) continue;
      const along = e.cum[i] + PT * (e.cum[i + 1] - e.cum[i]);
      if (along < e.trim[0] - 0.01 || along > e.length - e.trim[1] + 0.01)
        continue;
      return roadY(x, z, { d: PD, x: PX, z: PZ, t: PT, s });
    }
    return undefined;
  }
  /** Carriageway height at a kerb line, sampled just inside it. */
  function kerbBaseY(p: P, out: V): number | undefined {
    const qx = p[0] - out[0] * 0.05,
      qz = p[1] - out[1] * 0.05;
    const y = carriageway(qx, qz);
    if (y !== undefined) return y;
    let best = Infinity,
      near: number | undefined;
    for (const { e, i } of cellOf(qx, qz)?.roads ?? []) {
      const s = e.segs[i];
      project(qx, qz, s.a, s.b);
      if (PD < best) {
        best = PD;
        near = roadY(qx, qz, { d: PD, x: PX, z: PZ, t: PT, s });
      }
    }
    return near;
  }
  /** Pavement or kerb-top height, or undefined off the pavement. */
  function pavement(x: number, z: number) {
    const c = cellOf(x, z);
    if (!c) return undefined;
    for (const { k, i, reach } of c.kerbs) {
      if (!reach) continue;
      project(x, z, k.pts[i - 1], k.pts[i]);
      if (PD > reach || outward(k, i, x, z) < -0.02) continue;
      const px = PX,
        pz = PZ,
        t = PT;
      const out = unit(add(mul(k.out[i - 1], 1 - t), mul(k.out[i], t)));
      const y = kerbBaseY([px, pz], out);
      if (y !== undefined) return y + kerbLift(px, pz);
    }
    for (const { p, b } of paved)
      if (x >= b[0] && x <= b[1] && z >= b[2] && z <= b[3] && inPoly(x, z, p)) {
        let best = Infinity,
          hit: { p: P; out: V } | undefined;
        for (const { k, i } of c.kerbs) {
          if (!k.kerb) continue;
          project(x, z, k.pts[i - 1], k.pts[i]);
          if (PD < best) {
            best = PD;
            hit = { p: [PX, PZ], out: k.out[i] };
          }
        }
        const y = hit && kerbBaseY(hit.p, hit.out);
        return y === undefined ? undefined : y + kerbLift(...hit!.p);
      }
    return undefined;
  }
  /** True within `margin` of a pavement's outer edge: for dropping OSM
   * footways that duplicate a modelled pavement. */
  function nearPavement(x: number, z: number, margin: number) {
    for (const { k, i } of cellOf(x, z)?.kerbs ?? []) {
      if (!k.pavement) continue;
      project(x, z, k.pts[i - 1], k.pts[i]);
      if (
        PD <= k.pavement + KERB.width + margin &&
        outward(k, i, x, z) >= -0.02
      )
        return true;
    }
    return false;
  }
  /**
   * Grass height near the road. On the carriageway or pavement the grass sits
   * just below the surface; beyond the outer edge it grades back to natural
   * ground over 2m. `t` is 0 at the edge and 1 where natural ground resumes.
   */
  function verge(x: number, z: number) {
    const c = cellOf(x, z);
    if (!c) return undefined;
    // Grass stays 0.35m under roads and pavements: surfaces are linear between
    // vertices while their height function is not. Near a pavement's outer
    // edge it rises to a shelf 0.1m down, so grass meets the edge evenly.
    const road = carriageway(x, z);
    if (road !== undefined) return { y: road - 0.35, t: 0 };
    for (const { k, i, reach } of c.kerbs) {
      if (!reach) continue;
      project(x, z, k.pts[i - 1], k.pts[i]);
      if (PD > reach || outward(k, i, x, z) < -0.02) continue;
      const inset = reach - PD;
      const out = unit(add(mul(k.out[i - 1], 1 - PT), mul(k.out[i], PT)));
      const lift = kerbLift(PX, PZ);
      const base = kerbBaseY([PX, PZ], out);
      if (base === undefined) continue;
      return { y: base + lift - (inset < 0.6 ? 0.1 : 0.35), t: 0 };
    }
    const onPaved = pavement(x, z);
    if (onPaved !== undefined) return { y: onPaved - 0.1, t: 0 };
    // Beyond the edge: a 0.4m shelf, then back to natural ground over 2m.
    let bestBeyond = 2.4,
      bestY: number | undefined;
    for (const { k, i, reach } of c.kerbs) {
      project(x, z, k.pts[i - 1], k.pts[i]);
      const beyond = PD - reach;
      if (beyond >= bestBeyond || outward(k, i, x, z) < 0) continue;
      const out = unit(add(mul(k.out[i - 1], 1 - PT), mul(k.out[i], PT)));
      const lift = k.kerb ? kerbLift(PX, PZ) - 0.1 : -0.15;
      const base = kerbBaseY([PX, PZ], out);
      if (base === undefined) continue;
      bestBeyond = beyond;
      bestY = base + lift;
    }
    // Extra paved areas grade out the same way from their boundary.
    for (const { p, b } of paved) {
      if (x < b[0] - 2.4 || x > b[1] + 2.4 || z < b[2] - 2.4 || z > b[3] + 2.4)
        continue;
      const cx = (b[0] + b[1]) / 2,
        cz = (b[2] + b[3]) / 2;
      for (let i = 0; i < p.length; i++) {
        project(x, z, p[i], p[(i + 1) % p.length]);
        if (PD >= bestBeyond) continue;
        const ex = PX,
          ez = PZ,
          beyond = PD,
          d = Math.hypot(cx - ex, cz - ez) || 1;
        const y = pavement(
          ex + ((cx - ex) / d) * 0.1,
          ez + ((cz - ez) / d) * 0.1,
        );
        if (y === undefined) continue;
        bestBeyond = beyond;
        bestY = y - 0.1;
      }
    }
    if (bestY === undefined) return undefined;
    const t = Math.min(1, Math.max(0, (bestBeyond - 0.4) / 2));
    return { y: bestY, t: t * t * (3 - 2 * t) };
  }

  return {
    edges,
    junctions,
    kerbPaths,
    verge,
    nearPavement,
    kerbLift,
    /** Lower the kerb to a flush crossing within `r` metres of a point. */
    addDroppedKerb(x: number, z: number, r = 1.2) {
      drops.push({ x, z, r });
    },
    /** Register an extra raised paved area, e.g. an island or forecourt. */
    addPaved(p: P[]) {
      const xs = p.map((q) => q[0]),
        zs = p.map((q) => q[1]);
      paved.push({
        p,
        b: [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)],
      });
    },
    edgeY,
    junctionY,
    carriageway,
    pavement,
    kerbBaseY,
  };
}

// ---- Edge geometry ----

function makeEdge(id: number, f: Feature, spec: RoadSpec, pts: P[]): Edge {
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(
      cum[i - 1] +
        Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]),
    );
  return {
    id,
    f,
    spec,
    pts,
    cum,
    length: cum[cum.length - 1],
    segs: pts.slice(1).map((b, i) => ({ a: pts[i], b, f })),
    trim: [0, 0],
    endNormal: [undefined, undefined],
    internal: false,
  };
}
export function pointAt(e: Edge, s: number): { p: P; dir: V; i: number } {
  s = Math.max(0, Math.min(e.length, s));
  let i = 1;
  while (i < e.pts.length - 1 && e.cum[i] < s) i++;
  const a = e.pts[i - 1],
    b = e.pts[i];
  const t = (s - e.cum[i - 1]) / (e.cum[i] - e.cum[i - 1] || 1);
  return {
    p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    dir: unit(sub(b, a)),
    i,
  };
}
/** Unit right-hand normal at arc length s; mitred at vertices, fixed at ends. */
export function normalAt(e: Edge, s: number): V {
  if (s <= 1e-6 && e.endNormal[0]) return e.endNormal[0];
  if (s >= e.length - 1e-6 && e.endNormal[1]) return e.endNormal[1];
  const at = pointAt(e, s);
  const i = at.i;
  if (Math.abs(s - e.cum[i]) < 1e-6 && i < e.pts.length - 1) {
    const next = unit(sub(e.pts[i + 1], e.pts[i]));
    return unit(perp(unit(add(at.dir, next))));
  }
  if (Math.abs(s - e.cum[i - 1]) < 1e-6 && i > 1) {
    const prev = unit(sub(e.pts[i - 1], e.pts[i - 2]));
    return unit(perp(unit(add(prev, at.dir))));
  }
  return perp(at.dir);
}
/** Sample positions along [s0, s1]: every vertex plus regular steps. */
export function stations(e: Edge, s0: number, s1: number) {
  const out = [s0];
  const step = e.spec.step;
  let next = s0 + step;
  for (let i = 1; i < e.pts.length - 1; i++) {
    const c = e.cum[i];
    if (c <= s0 || c >= s1) continue;
    while (next < c - step * 0.3) {
      out.push(next);
      next += step;
    }
    out.push(c);
    next = c + step;
  }
  while (next < s1 - step * 0.3) {
    out.push(next);
    next += step;
  }
  out.push(s1);
  return out;
}

function angleBetween(a: V, b: V) {
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
}
/** Solve pa + da*t = pb + db*u. */
function intersect(pa: V, da: V, pb: V, db: V): [number, number] {
  const det = -da[0] * db[1] + db[0] * da[1];
  if (Math.abs(det) < 1e-9) return [0, 0];
  const r = sub(pb, pa);
  return [
    (-r[0] * db[1] + db[0] * r[1]) / det,
    (da[0] * r[1] - da[1] * r[0]) / det,
  ];
}
/** Drop points where a path doubles back on itself (joins of approximations). */
function smooth(pts: Pt[]) {
  const out = [...pts];
  for (let i = 1; i < out.length - 1;) {
    const a = sub(out[i].p, out[i - 1].p),
      b = sub(out[i + 1].p, out[i].p);
    if (dot(unit(a), unit(b)) < -0.2) out.splice(i, 1);
    else i++;
  }
  return out;
}
function dedupe(pts: Pt[]) {
  return pts.filter(
    (q, i) =>
      i === 0 ||
      Math.hypot(q.p[0] - pts[i - 1].p[0], q.p[1] - pts[i - 1].p[1]) > 0.02,
  );
}
function cornerPath(
  pts: Pt[],
  kerb: boolean,
  pavement: number,
  yellow: boolean,
  service: boolean,
): KerbPath {
  return {
    service,
    pts: pts.map((q) => q.p),
    out: pts.map((q) => unit(q.out)),
    kerb,
    pavement,
    yellow: pts.map(() => yellow),
  };
}
export type RoadNetwork = ReturnType<typeof buildRoadNetwork>;
