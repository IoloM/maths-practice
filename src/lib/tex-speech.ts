/**
 * Readable text for screen readers from question text with $…$ maths. KaTeX's MathML is read, but
 * flattened ("x2" for x²), and gives no accessible name where an option is all maths.
 */

const SYMBOLS: Record<string, string> = {
  le: "≤",
  leq: "≤",
  leqslant: "≤",
  ge: "≥",
  geq: "≥",
  geqslant: "≥",
  lt: "<",
  gt: ">",
  ne: "≠",
  neq: "≠",
  approx: "≈",
  equiv: "≡",
  times: "×",
  div: "÷",
  cdot: "·",
  pm: "±",
  mp: "∓",
  infty: "∞",
  to: "→",
  rightarrow: "→",
  Rightarrow: "⇒",
  implies: "⇒",
  Leftrightarrow: "⇔",
  iff: "⇔",
  in: "∈",
  notin: "∉",
  cup: "∪",
  cap: "∩",
  subset: "⊂",
  subseteq: "⊆",
  emptyset: "∅",
  varnothing: "∅",
  therefore: "∴",
  because: "∵",
  ldots: "…",
  dots: "…",
  cdots: "…",
  circ: "°",
  degree: "°",
  prime: "′",
  propto: "∝",
  sim: "~",
  mid: "|",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  epsilon: "ε",
  varepsilon: "ε",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  Sigma: "Σ",
  phi: "φ",
  Phi: "Φ",
  omega: "ω",
  Omega: "Ω",
  tau: "τ",
  int: "∫",
  sum: "Σ",
  partial: "∂",
};
const FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "sec",
  "cosec",
  "csc",
  "cot",
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "ln",
  "log",
  "exp",
  "lim",
  "max",
  "min",
  "det",
]);
const SPACES = new Set([",", ";", ":", "!", " ", "quad", "qquad"]);
const IGNORED = new Set([
  "left",
  "right",
  "big",
  "Big",
  "bigl",
  "bigr",
  "Bigl",
  "Bigr",
  "displaystyle",
  "textstyle",
  "limits",
]);
const BLACKBOARD: Record<string, string> = {
  R: "ℝ",
  Z: "ℤ",
  N: "ℕ",
  Q: "ℚ",
  C: "ℂ",
};
const AS_IS = new Set([
  "text",
  "textrm",
  "textbf",
  "textit",
  "mathrm",
  "mathit",
  "mathbf",
  "boldsymbol",
  "operatorname",
  "mathsf",
]);

const tidy = (s: string) =>
  s
    .replace(/\s+/g, " ")
    .replace(/ ([,;:)])/g, "$1")
    .replace(/\( /g, "(")
    .trim();

/** Speech for one LaTeX expression. */
export function speakTex(tex: string): string {
  let i = 0;
  const peek = () => tex[i];

  /** `{…}` or a single token. */
  const group = (): string => {
    while (peek() === " ") i++;
    if (peek() === "{") {
      let depth = 0;
      const start = i + 1;
      for (; i < tex.length; i++) {
        if (tex[i] === "\\") i++;
        else if (tex[i] === "{") depth++;
        else if (tex[i] === "}" && --depth === 0) break;
      }
      return tex.slice(start, i++);
    }
    if (peek() === "\\") {
      const m = /^\\([A-Za-z]+|.)/.exec(tex.slice(i))!;
      i += m[0].length;
      return m[0];
    }
    return tex[i++] ?? "";
  };

  const out: string[] = [];
  while (i < tex.length) {
    const c = tex[i];
    if (c === "\\") {
      const m = /^\\([A-Za-z]+|.)/.exec(tex.slice(i))!;
      const name = m[1];
      i += m[0].length;
      if (["frac", "dfrac", "tfrac"].includes(name)) {
        const a = speakTex(group()),
          b = speakTex(group());
        out.push(` ${a} over ${b} `);
      } else if (name === "sqrt") {
        let n = "";
        if (peek() === "[") {
          const end = tex.indexOf("]", i);
          n = tex.slice(i + 1, end);
          i = end + 1;
        }
        out.push(
          n
            ? ` root ${speakTex(n)} of ${speakTex(group())} `
            : ` square root of ${speakTex(group())} `,
        );
      } else if (name === "binom") {
        const n = speakTex(group()),
          r = speakTex(group());
        out.push(` ${n} choose ${r} `);
      } else if (name === "mathbb") {
        const g = group();
        out.push(BLACKBOARD[g] ?? g);
      } else if (AS_IS.has(name)) out.push(speakTex(group()));
      else if (name === "bar" || name === "overline")
        out.push(`${speakTex(group())} bar`);
      else if (name === "hat") out.push(`${speakTex(group())} hat`);
      else if (name === "vec" || name === "overrightarrow")
        out.push(` vector ${speakTex(group())} `);
      else if (name === "dot") out.push(`${speakTex(group())} dot`);
      else if (name === "ddot") out.push(`${speakTex(group())} double dot`);
      else if (SPACES.has(name)) out.push(" ");
      else if (IGNORED.has(name)) {
        if (peek() === ".") i++;
      } else if (FUNCTIONS.has(name)) out.push(` ${name} `);
      else if (SYMBOLS[name]) out.push(` ${SYMBOLS[name]} `);
      else if (name.length === 1) out.push(name);
      else out.push(` ${name} `);
    } else if (c === "^") {
      i++;
      const g = group();
      if (g === "2") out.push(" squared ");
      else if (g === "3") out.push(" cubed ");
      else if (g === "\\circ") out.push("°");
      else if (g === "\\prime" || g === "'") out.push("′");
      else out.push(` to the power ${speakTex(g)} `);
    } else if (c === "_") {
      i++;
      out.push(` sub ${speakTex(group())} `);
    } else if (c === "{" || c === "}") i++;
    else if (c === "~") {
      out.push(" ");
      i++;
    } else if (c === "-") {
      out.push(" − ");
      i++;
    } else {
      out.push(c);
      i++;
    }
  }
  return tidy(out.join(""));
}

/** Speech for text with $…$ / $$…$$ maths and **bold** / *italic* markers. */
export function speakText(src: string): string {
  const s = src.replace(/\\\$/g, "\u0000");
  const spoken = s.replace(
    /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g,
    (_, d: string | undefined, t: string | undefined) =>
      ` ${speakTex((d ?? t ?? "").replace(/\u0000/g, "\\$"))} `,
  );
  return tidy(
    spoken
      .replace(/\u0000/g, "$")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1$2"),
  );
}
