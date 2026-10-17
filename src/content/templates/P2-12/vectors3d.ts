/** Pure Year 2, Chapter 12 — vectors in three dimensions: magnitude, direction, parallel vectors, geometry, mechanics. */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, NumericSpec, VectorSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

type V3 = [number, number, number];
const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const ijk = (v: (number | Q)[]) => sumTex([[v[0], '\\mathbf{i}'], [v[1], '\\mathbf{j}'], [v[2], '\\mathbf{k}']]);
const col = (v: (number | Q)[]) => `\\begin{pmatrix} ${v.map((c) => Q.from(c).toLatex()).join(' \\\\ ')} \\end{pmatrix}`;
const vec3 = (v: (number | Q)[]) => ans.vec(v.map((c) => ans.exact(exq(c))));
const vals = (v: VectorSpec) => v.comps.map((c) => (c.type === 'exact' ? evaluate(c.value) : c.value));
const mag2 = (v: number[]) => v.reduce((s, c) => s + c * c, 0);
const surdTex = (n: number) => {
  const [a, b] = surdSimplify(n);
  return b === 1 ? `${a}` : `${a === 1 ? '' : a}\\sqrt{${b}}`;
};
const QUADS: [number, number, number, number][] = [
  [1, 2, 2, 3],
  [2, 3, 6, 7],
  [1, 4, 8, 9],
  [4, 4, 7, 9],
  [2, 6, 9, 11],
  [6, 6, 7, 11],
  [3, 4, 12, 13],
  [2, 10, 11, 15],
];
const R2D = 180 / Math.PI;

// ---------------------------------------------------------------- 12.1–12.2 magnitude, unit vector, angle with an axis
const magnitudeAngle = defineTemplate({
  id: 'p2.12.magnitude-unit-vector-angle-3d',
  family: 'p2.12.magnitude-direction',
  title: '3D vectors: magnitude, unit vector and angle with a coordinate axis',
  spec: ['P10.1', 'P10.2'],
  chapter: 'P2.12',
  sections: ['12.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Find'],
  tags: ['vectors', '3D', 'magnitude', 'unit vector', 'angle'],
  generate(r) {
    const [p, q, s, m] = r.pick(QUADS);
    const v = r.shuffle([p, q, s]).map((c) => c * r.sign()) as V3;
    const axis = r.int(0, 2);
    const ang = Math.acos(v[axis] / m) * R2D;
    const M = ans.exact(exq(m)),
      U = vec3(v.map((c) => Q.of(c, m))),
      A = ans.num(ang, { dp: 1 }, { unit: '^{\\circ}' });
    const axisName = ['x', 'y', 'z'][axis],
      axisVec = ['\\mathbf{i}', '\\mathbf{j}', '\\mathbf{k}'][axis];
    const useCol = r.bool(0.4);
    return {
      stem: md`$\mathbf{a} = ${useCol ? col(v) : ijk(v)}$`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $|\mathbf{a}|$.`, answer: M, scheme: [B1(md`$\sqrt{${v.map((c) => `${c < 0 ? `(${c})` : c}^{2}`).join(' + ')}} = ${m}$`)], hints: ['Use Pythagoras in three dimensions.', md`$|\mathbf{a}| = \sqrt{x^{2} + y^{2} + z^{2}}$`, md`$${v.map((c) => c * c).join(' + ')} = ${m * m}$`], solution: [md`$|\mathbf{a}| = \sqrt{${m * m}} = ${answerTex(M)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find a unit vector in the direction of $\mathbf{a}$.`, answer: U, scheme: [M1(md`$\dfrac{\mathbf{a}}{|\mathbf{a}|}$`), A1(md`$\frac{1}{${m}}(${ijk(v)})$`)], hints: ['A unit vector has magnitude 1.', md`Divide each component by $${m}$.`, 'Keep the components as fractions.'], errors: [err('not-divided', vec3(v), 'Divide by the magnitude to make the length 1.')], solution: [md`$\hat{\mathbf{a}} = \dfrac{1}{${m}}\left(${ijk(v)}\right) = ${answerTex(U)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the angle between $\mathbf{a}$ and the positive $${axisName}$-axis, to 1 decimal place.`, answer: A, scheme: [M1(md`$\cos\theta = \dfrac{${v[axis]}}{${m}}$`), A1(md`$${ang.toFixed(1)}^{\circ}$`)], hints: [md`The angle $\theta_{${axisName}}$ between $\mathbf{a}$ and the $${axisName}$-axis satisfies $\cos\theta_{${axisName}} = \dfrac{a_{${axisName}}}{|\mathbf{a}|}$.`, md`Here the $${axisName}$-component (coefficient of $${axisVec}$) is $${v[axis]}$.`, 'A negative component gives an obtuse angle.'], solution: [md`$\cos\theta = \dfrac{${v[axis]}}{${m}} \Rightarrow \theta = ${answerTex(A)}$`] }),
      ],
      params: { v, axis },
    };
  },
  verify(inst) {
    const { v, axis } = inst.params as { v: V3; axis: number };
    const m = valOf(inst.parts[0].answer as ExactSpec);
    expectClose(m * m, mag2(v), 'magnitude');
    const u = vals(inst.parts[1].answer as VectorSpec);
    expectClose(mag2(u), 1, 'unit');
    expectClose(u[0] * v[1] - u[1] * v[0] + 1, 1, 'parallel', 1e-12);
    const a = (valOf(inst.parts[2].answer as NumericSpec) * Math.PI) / 180;
    expectClose(Math.cos(a), v[axis] / m, 'angle with axis');
  },
});

// ---------------------------------------------------------------- 12.1–12.3 points: distance and dividing a line segment
const distanceRatio = defineTemplate({
  id: 'p2.12.distance-and-ratio-3d',
  family: 'p2.12.position-vectors',
  title: '3D points: vector AB, exact distance, and the point dividing AB in a ratio',
  spec: ['P10.4', 'P10.5'],
  chapter: 'P2.12',
  sections: ['12.1', '12.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['vectors', '3D', 'distance', 'ratio', 'position vectors'],
  generate(r) {
    const A: V3 = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)];
    const B: V3 = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)];
    const AB = B.map((c, i) => c - A[i]) as V3;
    r.require(AB.filter((c) => c !== 0).length >= 2);
    const [m, n] = r.pick([
      [1, 1],
      [1, 2],
      [2, 1],
      [1, 3],
      [3, 1],
      [2, 3],
      [3, 2],
    ]);
    const P = A.map((c, i) => Q.of(c).add(Q.of(m * AB[i], m + n)));
    const V = vec3(AB),
      Dd = ans.exact(ex(surdTex(mag2(AB))), ['exact', 'surd']),
      Pv = vec3(P);
    return {
      stem: md`The points $A$ and $B$ have coordinates $(${A.join(', ')})$ and $(${B.join(', ')})$ respectively.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find $\overrightarrow{AB}$.`, answer: V, scheme: [B1(md`$${ijk(AB)}$`)], hints: [md`$\overrightarrow{AB} = \mathbf{b} - \mathbf{a}$`, 'Subtract the coordinates of A from those of B.', 'Write it in i, j, k form.'], errors: [err('a-minus-b', vec3(AB.map((c) => -c)), 'AB = b − a (end minus start).')], solution: [md`$\overrightarrow{AB} = ${answerTex(V)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the exact distance $AB$.`, answer: Dd, scheme: [M1('3D Pythagoras on their AB'), A1(md`$${surdTex(mag2(AB))}$`)], hints: ['Distance = magnitude of AB.', md`$\sqrt{${AB.map((c) => `${c < 0 ? `(${c})` : c}^{2}`).join(' + ')}}$`, 'Simplify the surd.'], solution: [md`$AB = \sqrt{${mag2(AB)}} = ${answerTex(Dd)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`The point $P$ lies on $AB$ with $AP : PB = ${m} : ${n}$. Find the position vector of $P$.`, answer: Pv, scheme: [M1(md`$\overrightarrow{OP} = \overrightarrow{OA} + \frac{${m}}{${m + n}}\overrightarrow{AB}$`), dM1('Substitutes'), A1(md`$${ijk(P)}$`)], hints: [md`$P$ is $\frac{${m}}{${m + n}}$ of the way from $A$ to $B$.`, md`$\overrightarrow{OP} = \overrightarrow{OA} + \frac{${m}}{${m + n}}\overrightarrow{AB}$`, 'Work component by component; keep fractions exact.'], errors: m === n ? [] : [err('ratio-flipped', vec3(A.map((c, i) => Q.of(c).add(Q.of(n * AB[i], m + n)))), md`$AP : PB = ${m} : ${n}$ means $P$ is $\frac{${m}}{${m + n}}$ of the way from $A$.`, 1)], solution: [md`$\overrightarrow{OP} = ${ijk(A)} + \frac{${m}}{${m + n}}\left(${ijk(AB)}\right) = ${answerTex(Pv)}$`] }),
      ],
      params: { A, B, m, n },
    };
  },
  verify(inst) {
    const { A, B, m, n } = inst.params as { A: V3; B: V3; m: number; n: number };
    const P = vals(inst.parts[2].answer as VectorSpec);
    const AP = Math.sqrt(mag2(P.map((c, i) => c - A[i]))),
      PB = Math.sqrt(mag2(P.map((c, i) => B[i] - c)));
    expectClose(AP * n, PB * m, 'ratio');
    expectClose(AP + PB, valOf(inst.parts[1].answer as ExactSpec), 'collinear');
  },
});

// ---------------------------------------------------------------- 12.2 parallel vectors and linear combinations
const parallel3d = defineTemplate({
  id: 'p2.12.parallel-vectors-3d',
  family: 'p2.12.parallel',
  title: 'Find unknown components so that two 3D vectors are parallel',
  spec: ['P10.3', 'P10.1'],
  chapter: 'P2.12',
  sections: ['12.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Find'],
  tags: ['vectors', '3D', 'parallel', 'scalar multiple'],
  generate(r) {
    const b: V3 = [r.intNZ(-6, 6), r.intNZ(-6, 6), r.intNZ(-6, 6)];
    const lam = r.pick([Q.of(2), Q.of(-2), Q.of(3), Q.of(1, 2), Q.of(-1, 2), Q.of(3, 2), Q.of(-3), Q.of(2, 3)]);
    const a = b.map((c) => lam.mul(c));
    r.require(a.every((c) => c.d === 1));
    const [ia, ib] = r.shuffle([0, 1, 2]).slice(0, 2); // hide a[ia] as p and b[ib] as q
    const aShow = a.map((c, i) => (i === ia ? 'p' : c.toLatex())),
      bShow = b.map((c, i) => (i === ib ? 'q' : String(c)));
    const P = ans.exact(exq(a[ia])),
      Qs = ans.exact(exq(b[ib]));
    const k = [0, 1, 2].find((i) => i !== ia && i !== ib)!;
    return {
      stem: md`$\mathbf{a} = \begin{pmatrix} ${aShow.join(' \\\\ ')} \end{pmatrix}$ and $\mathbf{b} = \begin{pmatrix} ${bShow.join(' \\\\ ')} \end{pmatrix}$, where $p$ and $q$ are constants. The vectors $\mathbf{a}$ and $\mathbf{b}$ are parallel.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the value of $p$.`, answer: P, scheme: [M1(md`$\mathbf{a} = \lambda\mathbf{b}$ with $\lambda = \dfrac{${a[k].toLatex()}}{${b[k]}}$`), A1(md`$p = ${a[ia].toLatex()}$`)], hints: ['Parallel vectors are scalar multiples: a = λb.', md`Use the component where both are known: $\lambda = \dfrac{${a[k].toLatex()}}{${b[k]}} = ${lam.toLatex()}$.`, md`Then $p = \lambda \times ${b[ia]}$.`], solution: [md`$\lambda = ${lam.toLatex()}$, so $p = ${lam.toLatex()} \times ${b[ia]} = ${answerTex(P)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the value of $q$.`, answer: Qs, scheme: [M1(md`$${a[ib].toLatex()} = \lambda q$`), A1(md`$q = ${b[ib]}$`)], hints: ['Use the same λ.', md`$${a[ib].toLatex()} = ${lam.toLatex()}q$`, 'Divide by λ.'], errors: [err('lambda-wrong-way', ans.exact(exq(a[ib].mul(lam))), 'a = λb, so q = (component of a) ÷ λ.')], solution: [md`$q = \dfrac{${a[ib].toLatex()}}{${lam.toLatex()}} = ${answerTex(Qs)}$`] }),
      ],
      params: { a: a.map((c) => c.value), b, ia, ib },
    };
  },
  verify(inst) {
    const { a, b, ia, ib } = inst.params as { a: number[]; b: number[]; ia: number; ib: number };
    const A = [...a],
      B = [...b];
    A[ia] = valOf(inst.parts[0].answer as ExactSpec);
    B[ib] = valOf(inst.parts[1].answer as ExactSpec);
    const cross = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
    expect(cross.every((c) => Math.abs(c) < 1e-9), 'parallel');
  },
});

const combo3d = defineTemplate({
  id: 'p2.12.linear-combination-3d',
  family: 'p2.12.parallel',
  title: 'Find scalars s and t so that sa + tb = c in three dimensions',
  spec: ['P10.3', 'P2.4'],
  chapter: 'P2.12',
  sections: ['12.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Show that'],
  tags: ['vectors', '3D', 'simultaneous equations'],
  generate(r) {
    const a: V3 = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)],
      b: V3 = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)];
    const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    r.require(cross.some((c) => c !== 0));
    const s = r.intNZ(-4, 4),
      t = r.intNZ(-4, 4);
    const c = a.map((x, i) => s * x + t * b[i]) as V3;
    const S = ans.exact(exq(s)),
      T = ans.exact(exq(t));
    return {
      stem: md`$\mathbf{a} = ${ijk(a)}$, $\mathbf{b} = ${ijk(b)}$ and $\mathbf{c} = ${ijk(c)}$. Given that $\mathbf{c} = s\mathbf{a} + t\mathbf{b}$, where $s$ and $t$ are constants,`,
      parts: [
        part({ label: 'a', marks: 4, prompt: md`find the value of $s$,`, answer: S, scheme: [M1('Writes equations for two components'), M1('Solves simultaneously'), A1(md`$s = ${s}$`), dM1('Checks the third component')], hints: ['Compare the i, j and k components separately.', md`$\mathbf{i}$: $${a[0]}s + ${b[0]}t = ${c[0]}$ ...`.replace(/\+ -/g, '- '), 'Solve two of the equations, then check the third.'], solution: [md`$\mathbf{i}: ${sumTex([[a[0], 's'], [b[0], 't']])} = ${c[0]}$, $\mathbf{j}: ${sumTex([[a[1], 's'], [b[1], 't']])} = ${c[1]}$, $\mathbf{k}: ${sumTex([[a[2], 's'], [b[2], 't']])} = ${c[2]}$`, md`$s = ${answerTex(S)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`and the value of $t$.`, answer: T, scheme: [B1(md`$t = ${t}$`)], hints: ['Substitute s back into one of the equations.', 'Choose an equation with a non-zero t coefficient.', 'Check in the remaining equation.'], solution: [md`$t = ${answerTex(T)}$`] }),
      ],
      params: { a, b, c },
    };
  },
  verify(inst) {
    const { a, b, c } = inst.params as { a: V3; b: V3; c: V3 };
    const s = valOf(inst.parts[0].answer as ExactSpec),
      t = valOf(inst.parts[1].answer as ExactSpec);
    a.forEach((x, i) => expectClose(s * x + t * b[i] + 50, c[i] + 50, 'component'));
  },
});

// ---------------------------------------------------------------- 12.3 geometric problems
const triangle3d = defineTemplate({
  id: 'p2.12.triangle-in-3d',
  family: 'p2.12.geometry',
  title: 'A triangle in 3D: side lengths, an angle and the area',
  spec: ['P10.5', 'P5.1'],
  chapter: 'P2.12',
  sections: ['12.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find', 'Show that'],
  tags: ['vectors', '3D', 'cosine rule', 'area', 'geometry'],
  generate(r) {
    const A: V3 = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)],
      B: V3 = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)],
      C: V3 = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)];
    const BA = A.map((c, i) => c - B[i]),
      BC = C.map((c, i) => c - B[i]),
      AC = C.map((c, i) => c - A[i]);
    const cr = [BA[1] * BC[2] - BA[2] * BC[1], BA[2] * BC[0] - BA[0] * BC[2], BA[0] * BC[1] - BA[1] * BC[0]];
    r.require(mag2(cr) > 0 && mag2(BA) <= 120 && mag2(BC) <= 120);
    const c2 = mag2(BA),
      a2 = mag2(BC),
      b2 = mag2(AC);
    const cosB = (a2 + c2 - b2) / (2 * Math.sqrt(a2 * c2));
    const Bdeg = Math.acos(cosB) * R2D;
    const area = 0.5 * Math.sqrt(mag2(cr));
    const ABs = ans.exact(ex(surdTex(c2)), ['exact', 'surd']),
      BCs = ans.exact(ex(surdTex(a2)), ['exact', 'surd']),
      Ang = ans.num(Bdeg, { dp: 1 }, { unit: '^{\\circ}' }),
      Ar = ans.num(area, { sf: 3 }, { alts: [0.5 * Math.sqrt(a2 * c2) * Math.sin((Number(Bdeg.toFixed(1)) * Math.PI) / 180)] });
    return {
      stem: md`The points $A$, $B$ and $C$ have coordinates $(${A.join(', ')})$, $(${B.join(', ')})$ and $(${C.join(', ')})$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find the exact lengths $AB$ and $BC$. (Enter $AB$.)`, answer: ABs, scheme: [M1('3D Pythagoras'), A1(md`$AB = ${surdTex(c2)}$, $BC = ${surdTex(a2)}$`)], hints: [md`$\overrightarrow{AB} = \mathbf{b} - \mathbf{a}$`, 'Length is the magnitude.', 'Simplify the surds.'], solution: [md`$AB = \sqrt{${c2}} = ${answerTex(ABs)}$`, md`$BC = \sqrt{${a2}} = ${surdTex(a2)}$`, md`$AC = \sqrt{${b2}}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Write down the exact length $BC$.`, answer: BCs, scheme: [B1(md`$${surdTex(a2)}$`)], hints: ['Use the same method as for AB.', md`$\overrightarrow{BC} = \mathbf{c} - \mathbf{b}$`, 'Simplify.'], solution: [md`$BC = ${answerTex(BCs)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`Find the angle $ABC$, to 1 decimal place.`, answer: Ang, scheme: [M1(md`Cosine rule: $\cos B = \dfrac{${a2} + ${c2} - ${b2}}{2\sqrt{${a2}}\sqrt{${c2}}}$`), A1(md`$${Bdeg.toFixed(1)}^{\circ}$`)], hints: [md`Find $AC^{2} = ${b2}$ too.`, md`$\cos B = \dfrac{BA^{2} + BC^{2} - AC^{2}}{2 \times BA \times BC}$`, 'Use inverse cos.'], solution: [md`$\cos B = \dfrac{${a2} + ${c2} - ${b2}}{2\sqrt{${a2 * c2}}} = ${fmtSF(cosB, 4)} \Rightarrow B = ${answerTex(Ang)}$`] }),
        part({ label: 'd', marks: 2, prompt: md`Find the area of triangle $ABC$, to 3 significant figures.`, answer: Ar, scheme: [M1(md`$\frac{1}{2} \times AB \times BC \times \sin B$`), A1(md`awrt $${fmtSF(area, 3)}$`)], hints: ['Area = ½ab sin C.', md`Use $AB$, $BC$ and the angle $B$.`, 'Use the unrounded angle if you can.'], solution: [md`Area $= \frac{1}{2}\sqrt{${c2}}\sqrt{${a2}}\sin B = ${answerTex(Ar)}$`] }),
      ],
      params: { A, B, C },
    };
  },
  verify(inst) {
    const { A, B, C } = inst.params as { A: V3; B: V3; C: V3 };
    const BA = A.map((c, i) => c - B[i]),
      BC = C.map((c, i) => c - B[i]);
    const dot = BA.reduce((s, c, i) => s + c * BC[i], 0);
    const ang = Math.acos(dot / Math.sqrt(mag2(BA) * mag2(BC))) * R2D;
    expectClose(valOf(inst.parts[2].answer as NumericSpec), ang, 'angle via scalar product');
    const cr = [BA[1] * BC[2] - BA[2] * BC[1], BA[2] * BC[0] - BA[0] * BC[2], BA[0] * BC[1] - BA[1] * BC[0]];
    expectClose(valOf(inst.parts[3].answer as NumericSpec), 0.5 * Math.sqrt(mag2(cr)), 'area via cross product');
  },
});

// ---------------------------------------------------------------- 12.4 application to mechanics
const forces3d = defineTemplate({
  id: 'p2.12.forces-in-3d',
  family: 'p2.12.mechanics',
  title: 'Forces as 3D vectors: resultant, acceleration and an unknown component',
  spec: ['P10.1', 'P10.5', 'M8.2'],
  chapter: 'P2.12',
  sections: ['12.4'],
  level: 'A2',
  paper: [1, 2, 3],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Find'],
  tags: ['vectors', '3D', 'forces', "Newton's second law", 'mechanics'],
  generate(r) {
    const F1: V3 = [r.int(-6, 8), r.int(-6, 8), r.int(-6, 8)];
    const F2: V3 = [r.int(-6, 8), r.int(-6, 8), r.int(-6, 8)];
    const R = F1.map((c, i) => c + F2[i]) as V3;
    r.require(mag2(R) > 0);
    const m = r.pick([0.5, 2, 4, 5, 8]);
    const acc = Math.sqrt(mag2(R)) / m;
    const Rv = vec3(R),
      A = ans.num(acc, { sf: 3 }, { unit: '\\text{m s}^{-2}' }),
      E = vec3(R.map((c) => -c));
    return {
      stem: md`Two forces, $\mathbf{F}_{1} = (${ijk(F1)})$ N and $\mathbf{F}_{2} = (${ijk(F2)})$ N, act on a particle of mass $${m}$ kg. No other forces act.`,
      parts: [
        part({ label: 'a', marks: 1, prompt: md`Find the resultant force $\mathbf{R}$.`, answer: Rv, scheme: [B1(md`$${ijk(R)}$`)], hints: ['Add the forces component by component.', 'Add the i parts, then j, then k.', 'Keep the signs.'], solution: [md`$\mathbf{R} = ${answerTex(Rv)}$`] }),
        part({ label: 'b', marks: 3, prompt: md`Find the magnitude of the acceleration of the particle.`, answer: A, scheme: [M1(md`$|\mathbf{R}| = \sqrt{${mag2(R)}}$`), M1(md`$\mathbf{F} = m\mathbf{a}$`), A1(md`awrt $${fmtSF(acc, 3)}$ m s$^{-2}$`)], hints: [md`$|\mathbf{R}| = \sqrt{${R.map((c) => `${c < 0 ? `(${c})` : c}^{2}`).join(' + ')}}$`, md`Newton's second law: $|\mathbf{a}| = \dfrac{|\mathbf{R}|}{m}$.`, 'Give 3 s.f.'], errors: [err('times-m', ans.num(Math.sqrt(mag2(R)) * m, { sf: 3 }), 'a = F ÷ m, not F × m.')], solution: [md`$|\mathbf{R}| = \sqrt{${mag2(R)}}$, so $|\mathbf{a}| = \dfrac{\sqrt{${mag2(R)}}}{${m}} = ${answerTex(A)}$`] }),
        part({ label: 'c', marks: 2, prompt: md`A third force $\mathbf{F}_{3}$ is now added so that the particle is in equilibrium. Find $\mathbf{F}_{3}$.`, answer: E, scheme: [M1(md`$\mathbf{F}_{1} + \mathbf{F}_{2} + \mathbf{F}_{3} = \mathbf{0}$`), A1(md`$${ijk(R.map((c) => -c))}$`)], hints: ['In equilibrium the resultant force is zero.', md`$\mathbf{F}_{3} = -\mathbf{R}$`, 'Change every sign.'], errors: [err('same-as-R', vec3(R), 'F₃ must cancel R, so it is −R.')], solution: [md`$\mathbf{F}_{3} = -\mathbf{R} = ${answerTex(E)}$`] }),
      ],
      params: { F1, F2, m },
    };
  },
  verify(inst) {
    const { F1, F2, m } = inst.params as { F1: V3; F2: V3; m: number };
    const R = vals(inst.parts[0].answer as VectorSpec);
    R.forEach((c, i) => expectClose(c + 100, F1[i] + F2[i] + 100, 'resultant'));
    expectClose(valOf(inst.parts[1].answer as NumericSpec) * m, Math.sqrt(mag2(R)), 'F = ma');
    const F3 = vals(inst.parts[2].answer as VectorSpec);
    F3.forEach((c, i) => expectClose(c + R[i] + 1, 1, 'equilibrium'));
  },
});

const templates: Template[] = [magnitudeAngle, distanceRatio, parallel3d, combo3d, triangle3d, forces3d];
export default templates;
