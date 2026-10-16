/** Pure Year 1, Chapter 11 — vectors in two dimensions. */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ExprSpec, ListSpec, NumericSpec, VectorSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const ij = (x: number | Q, y: number | Q) => sumTex([[x, '\\mathbf{i}'], [y, '\\mathbf{j}']]);
const vecSpec = (x: number | Q, y: number | Q) => ans.vec([ans.exact(num(Q.from(x))), ans.exact(num(Q.from(y)))]);
const vals = (v: VectorSpec) => v.comps.map((c) => (c.type === 'exact' ? evaluate(c.value) : c.value));
const surd = (n: number) => {
  const [s, r] = surdSimplify(n);
  return r === 1 ? `${s}` : `${s === 1 ? '' : s}\\sqrt{${r}}`;
};

const combination = defineTemplate({
  id: 'p1.11.vector-combination',
  family: 'p1.11.vector-arithmetic',
  title: 'Linear combinations of vectors in i, j form',
  spec: ['P10.1', 'P10.3'],
  chapter: 'P1.11',
  sections: ['11.1', '11.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 2,
  time: 2,
  commands: ['Find'],
  tags: ['vectors', 'scalar multiplication', 'addition'],
  generate(r) {
    const a = [r.intNZ(-8, 8), r.intNZ(-8, 8)],
      b = [r.intNZ(-8, 8), r.intNZ(-8, 8)];
    const p = r.intNZ(-4, 4),
      q = r.intNZ(-4, 4);
    const res = [p * a[0] + q * b[0], p * a[1] + q * b[1]];
    const V = vecSpec(res[0], res[1]);
    const comb = sumTex([[p, '\\mathbf{a}'], [q, '\\mathbf{b}']]);
    const col = (v: number[]) => `\\begin{pmatrix} ${v[0]} \\\\ ${v[1]} \\end{pmatrix}`;
    const useCol = r.bool();
    return {
      parts: [part({ marks: 2, prompt: md`Given $\mathbf{a} = ${useCol ? col(a) : ij(a[0], a[1])}$ and $\mathbf{b} = ${useCol ? col(b) : ij(b[0], b[1])}$, find $${comb}$.`, answer: V, scheme: [M1('Multiplies and adds components'), A1(md`$${answerTex(V)}$`)], hints: ['Work with the i and j components separately.', md`Multiply each component of $\mathbf{a}$ by $${p}$ and of $\mathbf{b}$ by $${q}$.`, 'Add the i components, then the j components.'], solution: [md`$${comb} = ${p}(${ij(a[0], a[1])}) ${q < 0 ? '-' : '+'} ${Math.abs(q)}(${ij(b[0], b[1])}) = ${answerTex(V)}$`] })],
      params: { a, b, p, q },
    };
  },
  verify(inst) {
    const { a, b, p, q } = inst.params as { a: number[]; b: number[]; p: number; q: number };
    const v = vals(inst.parts[0].answer as VectorSpec);
    expectClose(v[0], p * a[0] + q * b[0], 'i');
    expectClose(v[1], p * a[1] + q * b[1], 'j');
  },
});

const magDir = defineTemplate({
  id: 'p1.11.magnitude-and-direction',
  family: 'p1.11.magnitude-direction',
  title: 'Magnitude and direction of a vector',
  spec: ['P10.2'],
  chapter: 'P1.11',
  sections: ['11.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 4,
  commands: ['Find'],
  tags: ['vectors', 'magnitude', 'direction', 'angle'],
  generate(r) {
    const x = r.intNZ(-9, 9),
      y = r.intNZ(-9, 9);
    const m2 = x * x + y * y;
    const M = ans.exact(ex(surd(m2)), ['exact', 'surd']);
    const ang = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    const Ang = ans.num(ang, { sf: 3 }, { unit: '^{\\circ}' });
    return {
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the exact magnitude of $\mathbf{v} = ${ij(x, y)}$.`, answer: M, scheme: [M1(md`$\sqrt{${x}^{2} + ${y}^{2}}$`), A1(md`$${answerTex(M)}$`)], hints: ['|v| = √(x² + y²)', md`$\sqrt{${x * x} + ${y * y}}$`, 'Simplify the surd.'], solution: [md`$|\mathbf{v}| = \sqrt{${x * x} + ${y * y}} = \sqrt{${m2}} = ${answerTex(M)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the angle that $\mathbf{v}$ makes with the positive $\mathbf{i}$ direction, measured anticlockwise, in degrees between $0^{\circ}$ and $360^{\circ}$.`, answer: Ang, scheme: [M1('Uses tan with a sketch to choose the quadrant'), A1(md`$${answerTex(Ang)}$`)], hints: ['Sketch the vector to see its quadrant.', md`Reference angle: $\tan^{-1}\left|\frac{${y}}{${x}}\right| = ${fmtSF((Math.atan(Math.abs(y / x)) * 180) / Math.PI, 4)}^{\circ}$`, 'Adjust for the quadrant.'], errors: [err('reference-only', ans.num((Math.atan(Math.abs(y / x)) * 180) / Math.PI, { sf: 3 }), 'That is only the reference (acute) angle — use the quadrant to adjust it.', 1)], solution: [md`Reference angle $${fmtSF((Math.atan(Math.abs(y / x)) * 180) / Math.PI, 4)}^{\circ}$; the vector is in quadrant ${ang < 90 ? 1 : ang < 180 ? 2 : ang < 270 ? 3 : 4}, so the angle is $${answerTex(Ang)}$`] }),
      ],
      params: { x, y },
    };
  },
  verify(inst) {
    const { x, y } = inst.params as Record<string, number>;
    const m = evaluate((inst.parts[0].answer as ExactSpec).value);
    const a = ((inst.parts[1].answer as NumericSpec).value * Math.PI) / 180;
    expectClose(m * Math.cos(a), x, 'x from polar');
    expectClose(m * Math.sin(a), y, 'y from polar');
  },
});

const unit = defineTemplate({
  id: 'p1.11.unit-vector',
  family: 'p1.11.magnitude-direction',
  title: 'Unit vector in a given direction',
  spec: ['P10.2'],
  chapter: 'P1.11',
  sections: ['11.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 3,
  commands: ['Find'],
  tags: ['vectors', 'unit vector'],
  generate(r) {
    const [x, y, h] = r.pick([
      [3, 4, 5],
      [5, 12, 13],
      [8, 15, 17],
      [6, 8, 10],
      [7, 24, 25],
      [9, 12, 15],
      [12, 5, 13],
      [4, 3, 5],
      [20, 21, 29],
    ]).map((v, i) => (i < 2 ? v * r.sign() : v));
    const V = vecSpec(Q.of(x, h), Q.of(y, h));
    const k = r.int(2, 6);
    const W = vecSpec(Q.of(k * x, h), Q.of(k * y, h));
    return {
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find a unit vector in the direction of $${ij(x, y)}$.`, answer: V, scheme: [M1(md`Magnitude $\sqrt{${x}^{2} + ${y}^{2}} = ${h}$`), A1(md`$\frac{1}{${h}}(${ij(x, y)})$`)], hints: ['A unit vector has magnitude 1.', 'Divide the vector by its magnitude.', md`$|\mathbf{v}| = ${h}$`], errors: [err('not-divided', vecSpec(x, y), 'Divide by the magnitude so the length is 1.')], solution: [md`$|\mathbf{v}| = ${h}$, so the unit vector is $\frac{1}{${h}}(${ij(x, y)}) = ${answerTex(V)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Find the vector of magnitude $${k}$ in the same direction.`, answer: W, scheme: [B1(md`$${answerTex(W)}$`)], hints: ['Multiply the unit vector by the required magnitude.', md`$${k} \times$ unit vector`, 'Keep fractions exact.'], solution: [md`$${k} \times \frac{1}{${h}}(${ij(x, y)}) = ${answerTex(W)}$`] }),
      ],
      params: { x, y, k },
    };
  },
  verify(inst) {
    const { x, y, k } = inst.params as Record<string, number>;
    const u = vals(inst.parts[0].answer as VectorSpec);
    expectClose(Math.hypot(u[0], u[1]), 1, 'unit length');
    expectClose(u[0] * y - u[1] * x, 0, 'parallel', 1e-12);
    const w = vals(inst.parts[1].answer as VectorSpec);
    expectClose(Math.hypot(w[0], w[1]), k, 'magnitude k');
  },
});

const fromPolar = defineTemplate({
  id: 'p1.11.components-from-magnitude-direction',
  family: 'p1.11.magnitude-direction',
  title: 'Components from magnitude and direction',
  spec: ['P10.2', 'P10.5'],
  chapter: 'P1.11',
  sections: ['11.3', '11.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['vectors', 'components', 'bearings'],
  generate(r) {
    const mag = r.int(5, 40);
    const ang = r.int(10, 350);
    r.require(ang % 90 !== 0);
    const x = mag * Math.cos((ang * Math.PI) / 180),
      y = mag * Math.sin((ang * Math.PI) / 180);
    const V = ans.vec([ans.num(x, { sf: 3 }), ans.num(y, { sf: 3 })]);
    const ctx = r.pick(['A force', 'A velocity', 'A displacement']);
    const unitTex = ctx === 'A force' ? 'N' : ctx === 'A velocity' ? 'm s⁻¹' : 'km';
    return {
      parts: [part({ marks: 3, prompt: md`${ctx} has magnitude $${mag}$ ${unitTex} and acts at an angle of $${ang}^{\circ}$ anticlockwise from the positive $\mathbf{i}$ direction. Write it in the form $(a\mathbf{i} + b\mathbf{j})$, giving $a$ and $b$ to 3 significant figures.`, answer: V, scheme: [M1(md`$${mag}\cos ${ang}^{\circ}$ and $${mag}\sin ${ang}^{\circ}$`), A1('One component correct'), A1(md`$${answerTex(V)}$`)], hints: ['Resolve into horizontal and vertical components.', md`$a = ${mag}\cos ${ang}^{\circ}$, $b = ${mag}\sin ${ang}^{\circ}$`, 'Watch the signs for angles beyond 90°.'], errors: [err('swapped', ans.vec([ans.num(y, { sf: 3 }), ans.num(x, { sf: 3 })]), 'The i-component uses cos and the j-component uses sin (angle from i).', 1)], solution: [md`$a = ${mag}\cos ${ang}^{\circ} = ${fmtSF(x, 4)}$, $b = ${mag}\sin ${ang}^{\circ} = ${fmtSF(y, 4)}$`, md`$${answerTex(V)}$`] })],
      params: { mag, ang },
    };
  },
  verify(inst) {
    const { mag } = inst.params as Record<string, number>;
    const v = vals(inst.parts[0].answer as VectorSpec);
    expectClose(Math.hypot(v[0], v[1]), mag, 'magnitude');
  },
});

const parallel = defineTemplate({
  id: 'p1.11.parallel-vectors',
  family: 'p1.11.parallel',
  title: 'Find a constant so that vectors are parallel',
  spec: ['P10.3'],
  chapter: 'P1.11',
  sections: ['11.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['vectors', 'parallel'],
  generate(r) {
    const a = [r.intNZ(-6, 6), r.intNZ(-6, 6)],
      b = [r.intNZ(-6, 6), r.intNZ(-6, 6)];
    r.require(a[0] * b[1] - a[1] * b[0] !== 0);
    const c = [r.intNZ(-5, 5), r.intNZ(-5, 5)];
    // a + λb parallel to c: (a0 + λb0)c1 − (a1 + λb1)c0 = 0
    const den = b[0] * c[1] - b[1] * c[0];
    r.require(den !== 0);
    const lam = Q.of(a[1] * c[0] - a[0] * c[1], den);
    r.require(lam.d <= 6);
    const L = ans.list([ans.exact(num(lam))], { v: '\\lambda' });
    return {
      stem: md`$\mathbf{a} = ${ij(a[0], a[1])}$, $\mathbf{b} = ${ij(b[0], b[1])}$ and $\mathbf{c} = ${ij(c[0], c[1])}$.`,
      parts: [part({ marks: 3, prompt: md`Given that $\mathbf{a} + \lambda\mathbf{b}$ is parallel to $\mathbf{c}$, find the value of $\lambda$.`, answer: L, scheme: [M1(md`$\mathbf{a} + \lambda\mathbf{b} = (${a[0]} ${b[0] < 0 ? '-' : '+'} ${Math.abs(b[0])}\lambda)\mathbf{i} + (${a[1]} ${b[1] < 0 ? '-' : '+'} ${Math.abs(b[1])}\lambda)\mathbf{j}$`), M1('Ratio of components equals that of c'), A1(md`$\lambda = ${lam.toLatex()}$`)], hints: ['Parallel vectors are scalar multiples of each other.', 'So the ratio of the i and j components must be the same.', md`$\dfrac{${a[0]} + ${b[0]}\lambda}{${c[0]}} = \dfrac{${a[1]} + ${b[1]}\lambda}{${c[1]}}$`], solution: [md`$\dfrac{${a[0]} + ${b[0]}\lambda}{${c[0]}} = \dfrac{${a[1]} + ${b[1]}\lambda}{${c[1]}} \Rightarrow \lambda = ${lam.toLatex()}$`] })],
      params: { a, b, c },
    };
  },
  verify(inst) {
    const { a, b, c } = inst.params as { a: number[]; b: number[]; c: number[] };
    const lam = evaluate(((inst.parts[0].answer as ListSpec).items[0] as ExactSpec).value);
    const v = [a[0] + lam * b[0], a[1] + lam * b[1]];
    expectClose(v[0] * c[1] - v[1] * c[0], 0, 'parallel', 1e-9);
  },
});

const geometry = defineTemplate({
  id: 'p1.11.vector-geometry',
  family: 'p1.11.geometry',
  title: 'Express vectors in a geometric figure in terms of a and b',
  spec: ['P10.5', 'P10.3'],
  chapter: 'P1.11',
  sections: ['11.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find', 'Express'],
  tags: ['vectors', 'geometry', 'ratio'],
  generate(r) {
    const [m, n] = r.pick([
      [1, 1],
      [1, 2],
      [2, 1],
      [1, 3],
      [3, 1],
      [2, 3],
      [3, 2],
      [1, 4],
      [4, 1],
      [3, 4],
      [4, 3],
      [2, 5],
      [5, 2],
      [3, 5],
      [5, 3],
    ]);
    const shape = r.pick(['triangle', 'parallelogram', 'trapezium'] as const);
    const k = shape === 'trapezium' ? r.pick([2, 3, 4]) : 1;
    // P on AB with AP:PB = m:n. OA = a, OB = b (triangle) or OA = a, OC = b with B = a + b (parallelogram)
    const B = shape === 'triangle' ? [0, 1] : [1, k]; // coefficients of a and b for OB
    const AB = [B[0] - 1, B[1]];
    const t = Q.of(m, m + n),
      tf = Q.of(n, m + n);
    const OP = [t.mul(AB[0]).add(1), t.mul(AB[1])];
    const OPf = [tf.mul(AB[0]).add(1), tf.mul(AB[1])];
    const plain = (c: Q[] | number[]) => sumTex([[c[0], 'a'], [c[1], 'b']]);
    const bold = (c: Q[] | number[]) => sumTex([[c[0], '\\mathbf{a}'], [c[1], '\\mathbf{b}']]);
    const E: ExprSpec = ans.expr(ex(plain(OP)), ['a', 'b']);
    const ABtex = bold(AB);
    const A2 = ans.expr(ex(plain(AB)), ['a', 'b']);
    return {
      stem: shape === 'trapezium' ? md`$OABC$ is a trapezium with $AB$ parallel to $OC$ and $AB = ${k}OC$. $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OC} = \mathbf{b}$. The point $P$ lies on $AB$ with $AP : PB = ${m} : ${n}$.` : shape === 'triangle' ? md`In triangle $OAB$, $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OB} = \mathbf{b}$. The point $P$ lies on $AB$ with $AP : PB = ${m} : ${n}$.` : md`$OABC$ is a parallelogram with $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OC} = \mathbf{b}$. The point $P$ lies on $AB$ with $AP : PB = ${m} : ${n}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $\overrightarrow{AB}$ in terms of $\mathbf{a}$ and $\mathbf{b}$. (Type a and b for the vectors.)`, answer: A2, scheme: [B1(md`$${ABtex}$`)], hints: [md`$\overrightarrow{AB} = \overrightarrow{AO} + \overrightarrow{OB}$`, shape === 'triangle' ? md`$\overrightarrow{OB} = \mathbf{b}$` : shape === 'trapezium' ? md`$\overrightarrow{AB}$ is ${k} times $\overrightarrow{OC}$.` : md`In a parallelogram $\overrightarrow{AB} = \overrightarrow{OC}$.`, md`$\overrightarrow{AO} = -\mathbf{a}$`], solution: [md`$\overrightarrow{AB} = ${ABtex}$`, md`(Typed with plain letters: $${answerTex(A2)}$.)`] }),
        part({ label: 'b', marks: 3, prompt: md`Find $\overrightarrow{OP}$ in terms of $\mathbf{a}$ and $\mathbf{b}$, simplifying your answer.`, answer: E, scheme: [M1(md`$\overrightarrow{OP} = \overrightarrow{OA} + \frac{${m}}{${m + n}}\overrightarrow{AB}$`), A1('Correct unsimplified'), A1(md`$${bold(OP)}$`)], hints: [md`$P$ is $\frac{${m}}{${m + n}}$ of the way from $A$ to $B$.`, md`$\overrightarrow{OP} = \overrightarrow{OA} + \frac{${m}}{${m + n}}\overrightarrow{AB}$`, 'Collect the a and b terms.'], errors: [err('ratio-flipped', ans.expr(ex(plain(OPf)), ['a', 'b']), md`$AP : PB = ${m} : ${n}$ means $P$ is $\frac{${m}}{${m + n}}$ of the way from $A$, not $\frac{${n}}{${m + n}}$.`, 1)], solution: [md`$\overrightarrow{OP} = \mathbf{a} + \frac{${m}}{${m + n}}(${ABtex})$`, md`$= ${bold(OP)}$`, md`(Typed with plain letters: $${answerTex(E)}$.)`] }),
      ],
      params: { m, n, shape, k },
    };
  },
  verify(inst) {
    const { m, n, shape, k } = inst.params as { m: number; n: number; shape: string; k: number };
    // concrete check with a = (1, 0), b = (0.3, 1.7)
    const a = [1, 0],
      b = [0.3, 1.7];
    const B = shape === 'triangle' ? b : [a[0] + k * b[0], a[1] + k * b[1]];
    const P = [a[0] + (m / (m + n)) * (B[0] - a[0]), a[1] + (m / (m + n)) * (B[1] - a[1])];
    const e = (inst.parts[1].answer as ExprSpec).value;
    const ca = evaluate(e, { a: 1, b: 0 }),
      cb = evaluate(e, { a: 0, b: 1 });
    expectClose(ca * a[0] + cb * b[0], P[0], 'x');
    expectClose(ca * a[1] + cb * b[1], P[1], 'y');
  },
});

const parallelogram = defineTemplate({
  id: 'p1.11.fourth-vertex-parallelogram',
  family: 'p1.11.position-vectors',
  title: 'Fourth vertex of a parallelogram from position vectors',
  spec: ['P10.4', 'P10.5'],
  chapter: 'P1.11',
  sections: ['11.4', '11.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Find'],
  tags: ['vectors', 'position vectors', 'parallelogram'],
  generate(r) {
    const A = [r.int(-6, 6), r.int(-6, 6)],
      B = [r.int(-6, 6), r.int(-6, 6)],
      C = [r.int(-6, 6), r.int(-6, 6)];
    r.require((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) !== 0);
    const D = [A[0] + C[0] - B[0], A[1] + C[1] - B[1]];
    const V = vecSpec(D[0], D[1]);
    return {
      parts: [part({ marks: 3, prompt: md`$ABCD$ is a parallelogram. The points $A$, $B$ and $C$ have position vectors $${ij(A[0], A[1])}$, $${ij(B[0], B[1])}$ and $${ij(C[0], C[1])}$. Find the position vector of $D$.`, answer: V, scheme: [M1(md`$\overrightarrow{AD} = \overrightarrow{BC}$`), M1(md`$\overrightarrow{OD} = \overrightarrow{OA} + \overrightarrow{BC}$`), A1(md`$${answerTex(V)}$`)], hints: ['In parallelogram ABCD, AD is equal to BC.', md`$\overrightarrow{BC} = \mathbf{c} - \mathbf{b}$`, md`$\overrightarrow{OD} = \mathbf{a} + (\mathbf{c} - \mathbf{b})$`], errors: [err('wrong-order', vecSpec(A[0] + B[0] - C[0], A[1] + B[1] - C[1]), 'The vertices go round in order A, B, C, D: AD = BC.', 1)], solution: [md`$\overrightarrow{BC} = ${ij(C[0] - B[0], C[1] - B[1])}$`, md`$\overrightarrow{OD} = ${ij(A[0], A[1])} + ${ij(C[0] - B[0], C[1] - B[1])} = ${answerTex(V)}$`] })],
      params: { A, B, C },
    };
  },
  verify(inst) {
    const { A, B, C } = inst.params as { A: number[]; B: number[]; C: number[] };
    const D = vals(inst.parts[0].answer as VectorSpec);
    // diagonals bisect each other
    expectClose((A[0] + C[0]) / 2, (B[0] + D[0]) / 2, 'diag x');
    expectClose((A[1] + C[1]) / 2, (B[1] + D[1]) / 2, 'diag y');
  },
});

const distance = defineTemplate({
  id: 'p1.11.distance-position-vectors',
  family: 'p1.11.position-vectors',
  title: 'Distance between two points from position vectors',
  spec: ['P10.4'],
  chapter: 'P1.11',
  sections: ['11.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['Find'],
  tags: ['vectors', 'distance', 'surds'],
  generate(r) {
    const A = [r.int(-8, 8), r.int(-8, 8)],
      B = [r.int(-8, 8), r.int(-8, 8)];
    r.require(A[0] !== B[0] || A[1] !== B[1]);
    const AB = [B[0] - A[0], B[1] - A[1]];
    const V = vecSpec(AB[0], AB[1]);
    const D = ans.exact(ex(surd(AB[0] ** 2 + AB[1] ** 2)), ['exact', 'surd']);
    return {
      stem: md`Points $A$ and $B$ have position vectors $${ij(A[0], A[1])}$ and $${ij(B[0], B[1])}$.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $\overrightarrow{AB}$.`, answer: V, scheme: [B1(md`$${answerTex(V)}$`)], hints: [md`$\overrightarrow{AB} = \mathbf{b} - \mathbf{a}$`, 'Subtract components.', 'Order matters: B minus A.'], errors: [err('a-minus-b', vecSpec(-AB[0], -AB[1]), 'AB = b − a, not a − b.')], solution: [md`$\overrightarrow{AB} = ${answerTex(V)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the exact distance $AB$.`, answer: D, scheme: [M1('Pythagoras on the components'), A1(md`$${answerTex(D)}$`)], hints: ['The distance is the magnitude of AB.', md`$\sqrt{${AB[0]}^{2} + ${AB[1]}^{2}}$`, 'Simplify the surd.'], solution: [md`$AB = \sqrt{${AB[0] ** 2} + ${AB[1] ** 2}} = ${answerTex(D)}$`] }),
      ],
      params: { A, B },
    };
  },
  verify(inst) {
    const { A, B } = inst.params as { A: number[]; B: number[] };
    expectClose(evaluate((inst.parts[1].answer as ExactSpec).value), Math.hypot(B[0] - A[0], B[1] - A[1]), 'distance');
  },
});

const boat = defineTemplate({
  id: 'p1.11.vectors-in-context-motion',
  family: 'p1.11.context',
  title: 'Vectors in context: position of a boat at time t',
  spec: ['P10.5', 'P10.4'],
  chapter: 'P1.11',
  sections: ['11.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 7,
  commands: ['Find'],
  tags: ['vectors', 'modelling', 'velocity', 'position'],
  generate(r) {
    const p0 = [r.int(-10, 10), r.int(-10, 10)],
      v = [r.intNZ(-6, 6), r.intNZ(-6, 6)];
    const t = r.int(2, 6);
    const P = [p0[0] + v[0] * t, p0[1] + v[1] * t];
    const target = r.int(-20, 20);
    // when is the boat due north/east? x-coordinate equals target x
    const tx = (target - p0[0]) / v[0];
    r.require(tx > 0 && tx < 15);
    const V = vecSpec(P[0], P[1]);
    const T = ans.num(tx, { sf: 3 }, { unit: '\\text{h}' });
    return {
      stem: md`A boat starts at the point with position vector $(${ij(p0[0], p0[1])})$ km and moves with constant velocity $(${ij(v[0], v[1])})$ km h$^{-1}$. A lighthouse is at the point with position vector $(${ij(target, p0[1] + 30)})$ km.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the position vector of the boat after $${t}$ hours.`, answer: V, scheme: [M1(md`$\mathbf{r} = \mathbf{r}_0 + t\mathbf{v}$`), A1(md`$${answerTex(V)}$`)], hints: ['Position = start + time × velocity.', md`$(${ij(p0[0], p0[1])}) + ${t}(${ij(v[0], v[1])})$`, 'Add the components.'], solution: [md`$\mathbf{r} = (${ij(p0[0], p0[1])}) + ${t}(${ij(v[0], v[1])}) = ${answerTex(V)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the time at which the boat is due ${p0[1] + v[1] * tx < p0[1] + 30 ? 'south' : 'north'} of the lighthouse.`, answer: T, scheme: [M1('Same i-component as the lighthouse'), M1(md`$${p0[0]} + ${v[0]}t = ${target}$`), A1(md`$t = ${answerTex(T)}$`)], hints: ['Due north/south means the same i (east–west) component.', md`Set $${p0[0]} + ${v[0]}t = ${target}$.`, 'Solve for t.'], solution: [md`$${p0[0]} + ${v[0]}t = ${target} \Rightarrow t = ${answerTex(T)}$`] }),
      ],
      params: { p0, v, target },
    };
  },
  verify(inst) {
    const { p0, v, target } = inst.params as { p0: number[]; v: number[]; target: number };
    const t = (inst.parts[1].answer as NumericSpec).value;
    expectClose(p0[0] + v[0] * t, target, 'east component matches');
  },
});

void fmtNum;
void dM1;
void expect;

const templates: Template[] = [combination, magDir, unit, fromPolar, parallel, geometry, parallelogram, distance, boat];
export default templates;
