/**
 * Parser for student responses: MathLive LaTeX or typed ASCII → Expr / Statement.
 * Recursive descent over a tokenizer that understands both notations.
 */
import { Q } from '../core/rational';
import { type Expr, type Fn, num, dec, sym, add, mul, neg, div, pow, sqrt, fn, subst, tidy, some } from '../core/expr';

export class ParseError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ParseError';
  }
}

export type RelOp = '=' | '<' | '>' | '<=' | '>=' | '!=';
export type Sep = ',' | ';' | 'or' | 'and' | 'cup' | 'cap';

export type Clause =
  | { kind: 'expr'; e: Expr }
  | { kind: 'rel'; terms: Expr[]; ops: RelOp[] }
  | { kind: 'tuple'; items: Expr[]; open: '(' | '['; close: ')' | ']' }
  | { kind: 'in'; e: Expr; set: Statement }
  | { kind: 'set'; v: string; cond: Statement }
  | { kind: 'vector'; comps: Expr[] }
  | { kind: 'empty' }
  | { kind: 'reals' };

export interface Statement {
  clauses: Clause[];
  seps: Sep[];
  degrees: boolean;
}

type Tok =
  | { t: 'num'; v: string }
  | { t: 'id'; v: string }
  | { t: 'fn'; v: Fn }
  | { t: 'log' }
  | { t: 'frac' }
  | { t: 'sqrt' }
  | { t: 'binom' }
  | { t: 'op'; v: string }
  | { t: 'rel'; v: RelOp }
  | { t: 'sep'; v: Sep }
  | { t: 'open'; v: '(' | '[' | '{' | 'lbrace' }
  | { t: 'close'; v: ')' | ']' | '}' | 'rbrace' }
  | { t: 'bar' }
  | { t: 'deg' }
  | { t: 'inf' }
  | { t: 'in' }
  | { t: 'colon' }
  | { t: 'pm' }
  | { t: 'beginmat' }
  | { t: 'endmat' }
  | { t: 'rowsep' }
  | { t: 'amp' }
  | { t: 'empty' }
  | { t: 'reals' }
  | { t: 'eof' };

const FN_WORDS: Record<string, Fn> = {
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
  sec: 'sec',
  cosec: 'cosec',
  csc: 'cosec',
  cot: 'cot',
  arcsin: 'arcsin',
  arccos: 'arccos',
  arctan: 'arctan',
  asin: 'arcsin',
  acos: 'arccos',
  atan: 'arctan',
  ln: 'ln',
  exp: 'exp',
  abs: 'abs',
};
const GREEK = ['theta', 'alpha', 'beta', 'mu', 'sigma', 'lambda', 'phi', 'rho', 'omega', 'pi'];
const ASCII_WORDS = [...Object.keys(FN_WORDS), ...GREEK, 'sqrt', 'log', 'or', 'and', 'infinity', 'inf'].sort(
  (a, b) => b.length - a.length,
);

const UNICODE: [RegExp, string][] = [
  [/[−–]/g, '-'],
  [/[×·∙]/g, '*'],
  [/÷/g, '/'],
  [/√/g, '\\sqrt '],
  [/π/g, '\\pi '],
  [/θ/g, '\\theta '],
  [/α/g, '\\alpha '],
  [/β/g, '\\beta '],
  [/μ/g, '\\mu '],
  [/σ/g, '\\sigma '],
  [/λ/g, '\\lambda '],
  [/ρ/g, '\\rho '],
  [/[≤⩽]/g, '\\le '],
  [/[≥⩾]/g, '\\ge '],
  [/≠/g, '\\ne '],
  [/∞/g, '\\infty '],
  [/∪/g, '\\cup '],
  [/∩/g, '\\cap '],
  [/±/g, '\\pm '],
  [/°/g, '\\degree '],
  [/∈/g, '\\in '],
  [/∅/g, '\\emptyset '],
  [/²/g, '^2'],
  [/³/g, '^3'],
  [/⁻¹/g, '^{-1}'],
  [/ℝ/g, '\\mathbb{R}'],
];

function tokenize(src: string): Tok[] {
  let s = src;
  for (const [re, r] of UNICODE) s = s.replace(re, r);
  const out = tok(s);
  out.push({ t: 'eof' });
  return out;
}

/** Read one command argument starting at i: {braced} or a single character / command. */
function readArg(s: string, i: number): [string, number] {
  while (i < s.length && /\s/.test(s[i])) i++;
  if (s[i] === '{') {
    let depth = 0,
      j = i;
    for (; j < s.length; j++) {
      if (s[j] === '\\') {
        j++;
        continue;
      }
      if (s[j] === '{') depth++;
      else if (s[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (j >= s.length) throw new ParseError('A { bracket is not closed');
    return [s.slice(i + 1, j), j + 1];
  }
  if (s[i] === '\\') {
    const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
    if (!m) throw new ParseError('Unexpected backslash');
    return [m[0], i + m[0].length];
  }
  if (i >= s.length) throw new ParseError('A fraction or root is incomplete');
  return [s[i], i + 1];
}

function braced(inner: string): Tok[] {
  if (inner.trim() === '') throw new ParseError('There is an empty box in your answer');
  return [{ t: 'open', v: '{' }, ...tok(inner), { t: 'close', v: '}' }];
}

function tok(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const push = (t: Tok) => out.push(t);
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c) || c === '~') {
      i++;
      continue;
    }
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
      if (!m) throw new ParseError('Unexpected backslash');
      const cmd = m[1];
      i += m[0].length;
      switch (cmd) {
        case 'frac':
        case 'dfrac':
        case 'tfrac':
        case 'cfrac':
        case 'binom':
        case 'dbinom':
        case 'tbinom': {
          const [a, i1] = readArg(s, i);
          const [b, i2] = readArg(s, i1);
          i = i2;
          push(cmd.includes('binom') ? { t: 'binom' } : { t: 'frac' });
          out.push(...braced(a), ...braced(b));
          continue;
        }
        case 'sqrt': {
          push({ t: 'sqrt' });
          while (i < s.length && /\s/.test(s[i])) i++;
          if (s[i] === '[') {
            const j = s.indexOf(']', i);
            if (j < 0) throw new ParseError('Root index not closed');
            push({ t: 'open', v: '[' });
            out.push(...tok(s.slice(i + 1, j)));
            push({ t: 'close', v: ']' });
            i = j + 1;
          }
          while (i < s.length && /\s/.test(s[i])) i++;
          if (s[i] === '(') continue; // ASCII-ish sqrt(…) — parser reads the bracket
          const [a, i1] = readArg(s, i);
          i = i1;
          out.push(...braced(a));
          continue;
        }
        case 'log':
          push({ t: 'log' });
          continue;
        case 'pi':
        case 'theta':
        case 'alpha':
        case 'beta':
        case 'mu':
        case 'sigma':
        case 'lambda':
        case 'phi':
        case 'rho':
        case 'omega':
          push({ t: 'id', v: cmd });
          continue;
        case 'varphi':
          push({ t: 'id', v: 'phi' });
          continue;
        case 'vartheta':
          push({ t: 'id', v: 'theta' });
          continue;
        case 'exponentialE':
          push({ t: 'id', v: 'e' });
          continue;
        case 'imaginaryI':
        case 'imath':
          push({ t: 'id', v: 'i' });
          continue;
        case 'jmath':
          push({ t: 'id', v: 'j' });
          continue;
        case 'infty':
          push({ t: 'inf' });
          continue;
        case 'le':
        case 'leq':
        case 'leqslant':
          push({ t: 'rel', v: '<=' });
          continue;
        case 'ge':
        case 'geq':
        case 'geqslant':
          push({ t: 'rel', v: '>=' });
          continue;
        case 'lt':
          push({ t: 'rel', v: '<' });
          continue;
        case 'gt':
          push({ t: 'rel', v: '>' });
          continue;
        case 'ne':
        case 'neq':
          push({ t: 'rel', v: '!=' });
          continue;
        case 'times':
        case 'cdot':
        case 'ast':
          push({ t: 'op', v: '*' });
          continue;
        case 'div':
          push({ t: 'op', v: '/' });
          continue;
        case 'pm':
        case 'mp':
          push({ t: 'pm' });
          continue;
        case 'cup':
          push({ t: 'sep', v: 'cup' });
          continue;
        case 'cap':
          push({ t: 'sep', v: 'cap' });
          continue;
        case 'lor':
        case 'vee':
          push({ t: 'sep', v: 'or' });
          continue;
        case 'land':
        case 'wedge':
          push({ t: 'sep', v: 'and' });
          continue;
        case 'in':
          push({ t: 'in' });
          continue;
        case 'mid':
        case 'colon':
          push({ t: 'colon' });
          continue;
        case 'vert':
        case 'lvert':
        case 'rvert':
        case '|':
          push({ t: 'bar' });
          continue;
        case 'lbrace':
        case '{':
          push({ t: 'open', v: 'lbrace' });
          continue;
        case 'rbrace':
        case '}':
          push({ t: 'close', v: 'rbrace' });
          continue;
        case 'lbrack':
          push({ t: 'open', v: '[' });
          continue;
        case 'rbrack':
          push({ t: 'close', v: ']' });
          continue;
        case 'degree':
        case 'circ':
          push({ t: 'deg' });
          continue;
        case 'emptyset':
        case 'varnothing':
          push({ t: 'empty' });
          continue;
        case '\\':
          push({ t: 'rowsep' });
          continue;
        case 'left':
        case 'right':
        case 'bigl':
        case 'bigr':
        case 'Bigl':
        case 'Bigr':
        case 'big':
        case 'Big':
          if (s[i] === '.') i++;
          continue;
        case ',':
        case ';':
        case ':':
        case '!':
        case ' ':
        case 'quad':
        case 'qquad':
        case 'displaystyle':
        case 'textstyle':
        case 'limits':
          continue;
        case 'placeholder': {
          if (s[i] === '[') i = s.indexOf(']', i) + 1;
          const [a, i1] = readArg(s, i);
          i = i1;
          if (a.trim() === '') throw new ParseError('There is an empty box in your answer');
          out.push(...tok(a));
          continue;
        }
        case 'begin':
        case 'end': {
          const [, i1] = readArg(s, i);
          i = i1;
          push(cmd === 'begin' ? { t: 'beginmat' } : { t: 'endmat' });
          continue;
        }
        case 'operatorname':
        case 'mathrm':
        case 'text':
        case 'textrm':
        case 'textit':
        case 'mathit':
        case 'mathbf':
        case 'boldsymbol':
        case 'bm':
        case 'mathbb':
        case 'vec':
        case 'hat':
        case 'underline':
        case 'mathsf': {
          const [inner, i1] = readArg(s, i);
          i = i1;
          const w = inner.replace(/\\[,;: ]/g, '').trim();
          if (w === '') continue;
          if (cmd === 'mathbb' && w === 'R') {
            push({ t: 'reals' });
            continue;
          }
          const lw = w.toLowerCase();
          if (FN_WORDS[lw]) push({ t: 'fn', v: FN_WORDS[lw] });
          else if (lw === 'or') push({ t: 'sep', v: 'or' });
          else if (lw === 'and') push({ t: 'sep', v: 'and' });
          else if (/^\\?imath$/.test(w)) push({ t: 'id', v: 'i' });
          else if (/^\\?jmath$/.test(w)) push({ t: 'id', v: 'j' });
          else if (/^[a-zA-Z]$/.test(w)) push({ t: 'id', v: w });
          else if ((cmd === 'text' || cmd === 'textrm' || cmd === 'mathrm') && /[a-zA-Z]{2,}/.test(w))
            throw new ParseError(`Remove the words or units ("${w}") — enter the value only`);
          else out.push(...tok(w));
          continue;
        }
        default:
          if (FN_WORDS[cmd]) {
            push({ t: 'fn', v: FN_WORDS[cmd] });
            continue;
          }
          throw new ParseError(`I don't recognise \\${cmd}`);
      }
    }
    if (c === '{') {
      push({ t: 'open', v: '{' });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) throw new ParseError('Bad number');
      let lit = m[1];
      i += lit.length;
      const sci = /^[eE][+-]?\d+/.exec(s.slice(i));
      if (sci && /^[eE]-?\d/.test(s.slice(i)) && /^\d*\.\d+$|^\d+\.\d*$/.test(lit)) {
        lit += sci[0];
        i += sci[0].length;
      }
      if (lit.endsWith('.')) lit = lit.slice(0, -1);
      push({ t: 'num', v: lit });
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      const rest = s.slice(i).toLowerCase();
      const w = ASCII_WORDS.find((w) => rest.startsWith(w));
      if (w) {
        i += w.length;
        if (FN_WORDS[w]) push({ t: 'fn', v: FN_WORDS[w] });
        else if (w === 'sqrt') push({ t: 'sqrt' });
        else if (w === 'log') push({ t: 'log' });
        else if (w === 'or') push({ t: 'sep', v: 'or' });
        else if (w === 'and') push({ t: 'sep', v: 'and' });
        else if (w === 'inf' || w === 'infinity') push({ t: 'inf' });
        else push({ t: 'id', v: w });
        continue;
      }
      push({ t: 'id', v: c });
      i++;
      continue;
    }
    i++;
    switch (c) {
      case '+':
      case '-':
      case '/':
      case '^':
      case '_':
        push({ t: 'op', v: c });
        break;
      case '*':
        if (s[i] === '*') {
          i++;
          push({ t: 'op', v: '^' });
        } else push({ t: 'op', v: '*' });
        break;
      case '!':
        if (s[i] === '=') {
          i++;
          push({ t: 'rel', v: '!=' });
        } else push({ t: 'op', v: '!' });
        break;
      case '=':
        if (s[i] === '<') {
          i++;
          push({ t: 'rel', v: '<=' });
        } else if (s[i] === '>') {
          i++;
          push({ t: 'rel', v: '>=' });
        } else push({ t: 'rel', v: '=' });
        break;
      case '<':
        if (s[i] === '=') {
          i++;
          push({ t: 'rel', v: '<=' });
        } else push({ t: 'rel', v: '<' });
        break;
      case '>':
        if (s[i] === '=') {
          i++;
          push({ t: 'rel', v: '>=' });
        } else push({ t: 'rel', v: '>' });
        break;
      case '(':
      case '[':
        push({ t: 'open', v: c });
        break;
      case ')':
      case ']':
      case '}':
        push({ t: 'close', v: c });
        break;
      case '|':
        push({ t: 'bar' });
        break;
      case ',':
        push({ t: 'sep', v: ',' });
        break;
      case ';':
        push({ t: 'sep', v: ';' });
        break;
      case ':':
        push({ t: 'colon' });
        break;
      case '&':
        push({ t: 'amp' });
        break;
      case "'":
        throw new ParseError("Remove the dash (') from your answer");
      default:
        throw new ParseError(`Unexpected character "${c}"`);
    }
  }
  return out;
}

const PM = '__pm';

class Parser {
  private i = 0;
  private absDepth = 0;
  degrees = false;
  constructor(private readonly toks: Tok[]) {}

  peek(o = 0): Tok {
    return this.toks[Math.min(this.i + o, this.toks.length - 1)];
  }
  next(): Tok {
    return this.toks[this.i++] ?? { t: 'eof' };
  }
  isOp(v: string, o = 0): boolean {
    const t = this.peek(o);
    return t.t === 'op' && t.v === v;
  }
  expectClose(_open: string): void {
    const t = this.next();
    if (t.t !== 'close') throw new ParseError('A bracket is not closed');
  }
  atEnd(): boolean {
    return this.peek().t === 'eof';
  }

  // statement := clause (sep clause)*
  statement(stopAtClose = false): Statement {
    const clauses: Clause[] = [];
    const seps: Sep[] = [];
    clauses.push(this.clause());
    for (;;) {
      const t = this.peek();
      if (t.t === 'sep') {
        this.next();
        seps.push(t.v);
        clauses.push(this.clause());
        continue;
      }
      if (stopAtClose && t.t === 'close') break;
      if (t.t === 'eof') break;
      throw new ParseError('Could not read the whole answer — check brackets and operators');
    }
    return { clauses, seps, degrees: this.degrees };
  }

  clause(): Clause {
    const t = this.peek();
    if (t.t === 'empty') {
      this.next();
      return { kind: 'empty' };
    }
    if (t.t === 'reals') {
      this.next();
      return { kind: 'reals' };
    }
    if (t.t === 'beginmat') return this.matrix();
    if (t.t === 'open' && (t.v === '(' || t.v === '[')) {
      const tup = this.tryTuple();
      if (tup) return tup;
    }
    if (t.t === 'open' && t.v === 'lbrace') {
      const sb = this.trySetBuilder();
      if (sb) return sb;
    }
    const first = this.sum();
    const p = this.peek();
    if (p.t === 'in') {
      this.next();
      const set = this.setExpr();
      return { kind: 'in', e: first, set };
    }
    if (p.t === 'rel') {
      const terms = [first];
      const ops: RelOp[] = [];
      while (this.peek().t === 'rel') {
        ops.push((this.next() as { v: RelOp }).v);
        terms.push(this.sum());
      }
      return { kind: 'rel', terms, ops };
    }
    return { kind: 'expr', e: first };
  }

  private setExpr(): Statement {
    const clauses: Clause[] = [];
    const seps: Sep[] = [];
    const one = (): Clause => {
      const t = this.peek();
      if (t.t === 'open' && (t.v === '(' || t.v === '[')) {
        const tup = this.tryTuple();
        if (tup) return tup;
      }
      if (t.t === 'reals') {
        this.next();
        return { kind: 'reals' };
      }
      if (t.t === 'empty') {
        this.next();
        return { kind: 'empty' };
      }
      if (t.t === 'open' && t.v === 'lbrace') {
        const sb = this.trySetBuilder();
        if (sb) return sb;
      }
      throw new ParseError('Could not read the set after ∈');
    };
    clauses.push(one());
    while (this.peek().t === 'sep' && ['cup', 'cap'].includes((this.peek() as { v: string }).v)) {
      seps.push((this.next() as { v: Sep }).v);
      clauses.push(one());
    }
    return { clauses, seps, degrees: this.degrees };
  }

  private tryTuple(): Clause | null {
    const save = this.i;
    const open = this.next() as { v: '(' | '[' };
    try {
      const items: Expr[] = [this.sum()];
      if (!(this.peek().t === 'sep' && (this.peek() as { v: string }).v === ',')) {
        this.i = save;
        return null;
      }
      while (this.peek().t === 'sep' && (this.peek() as { v: string }).v === ',') {
        this.next();
        items.push(this.sum());
      }
      const c = this.next();
      if (c.t !== 'close' || (c.v !== ')' && c.v !== ']')) throw new ParseError('Coordinates or interval not closed');
      return { kind: 'tuple', items, open: open.v, close: c.v };
    } catch (e) {
      this.i = save;
      if (e instanceof ParseError) return null;
      throw e;
    }
  }

  private trySetBuilder(): Clause | null {
    const save = this.i;
    this.next(); // lbrace
    const v = this.peek();
    if (v.t === 'id' && (this.peek(1).t === 'colon' || this.peek(1).t === 'bar')) {
      this.next();
      this.next();
      const cond = this.statement(true);
      const c = this.next();
      if (c.t !== 'close') throw new ParseError('Set notation not closed with }');
      return { kind: 'set', v: v.v, cond };
    }
    this.i = save;
    return null;
  }

  private matrix(): Clause {
    this.next(); // beginmat
    const comps: Expr[] = [];
    for (;;) {
      if (this.peek().t === 'endmat') {
        this.next();
        break;
      }
      comps.push(this.sum());
      const t = this.peek();
      if (t.t === 'rowsep' || t.t === 'amp') this.next();
      else if (t.t !== 'endmat') throw new ParseError('Could not read the column vector');
    }
    return { kind: 'vector', comps };
  }

  // sum := ['+'|'-'|±] term (('+'|'-'|±) term)*
  sum(): Expr {
    const terms: Expr[] = [];
    if (this.isOp('-')) {
      this.next();
      terms.push(neg(this.term()));
    } else if (this.peek().t === 'pm') {
      this.next();
      terms.push(mul(sym(PM), this.term()));
    } else {
      if (this.isOp('+')) this.next();
      terms.push(this.term());
    }
    while (this.isOp('+') || this.isOp('-') || this.peek().t === 'pm') {
      const op = this.next();
      const u = this.term();
      if (op.t === 'pm') terms.push(mul(sym(PM), u));
      else terms.push(op.t === 'op' && op.v === '-' ? neg(u) : u);
    }
    return terms.length === 1 ? terms[0] : add(...terms);
  }

  // term := signedFactor (('*'|'/'|implicit) factor)*
  term(): Expr {
    let left = this.unary();
    for (;;) {
      if (this.isOp('*')) {
        this.next();
        left = mulFlat(left, this.unary());
      } else if (this.isOp('/')) {
        this.next();
        left = div(left, this.unary());
      } else if (this.startsPrimary()) {
        if (this.peek().t === 'num' && endsWithNumber(left)) throw new ParseError('Two numbers are next to each other — add an operator between them');
        left = mulFlat(left, this.power());
      } else break;
    }
    return left;
  }

  unary(): Expr {
    if (this.isOp('-')) {
      this.next();
      return neg(this.unary());
    }
    if (this.isOp('+')) {
      this.next();
      return this.unary();
    }
    return this.power();
  }

  private startsPrimary(): boolean {
    const t = this.peek();
    switch (t.t) {
      case 'num':
      case 'id':
      case 'fn':
      case 'log':
      case 'frac':
      case 'sqrt':
      case 'binom':
      case 'inf':
        return true;
      case 'open':
        return t.v === '(' || t.v === '[' || t.v === '{';
      case 'bar':
        return this.absDepth === 0;
      default:
        return false;
    }
  }

  // power := postfix ('^' exponent)?
  power(): Expr {
    const base = this.postfix();
    if (this.isOp('^')) {
      this.next();
      if (this.peek().t === 'deg') {
        this.next();
        this.degrees = true;
        return base;
      }
      const ex = this.exponent();
      if (ex === 'deg') {
        this.degrees = true;
        return base;
      }
      return pow(base, ex);
    }
    return base;
  }

  private exponent(): Expr | 'deg' {
    const t = this.peek();
    if (t.t === 'open' && t.v === '{') {
      this.next();
      if (this.peek().t === 'deg') {
        this.next();
        this.expectClose('{');
        return 'deg';
      }
      const e = this.sum();
      this.expectClose('{');
      return e;
    }
    if (this.isOp('-')) {
      this.next();
      return neg(this.exponentAtom());
    }
    if (this.isOp('+')) {
      this.next();
    }
    return this.exponentAtom();
  }

  private exponentAtom(): Expr {
    const t = this.peek();
    if (t.t === 'open' && (t.v === '(' || t.v === '{')) return this.primary();
    if (t.t === 'num' || t.t === 'id' || t.t === 'frac' || t.t === 'sqrt') {
      const b = this.primary();
      if (this.isOp('^')) {
        this.next();
        const e = this.exponent();
        if (e === 'deg') throw new ParseError('Bad degree sign');
        return pow(b, e);
      }
      return b;
    }
    throw new ParseError('Could not read a power');
  }

  postfix(): Expr {
    let e = this.primary();
    for (;;) {
      if (this.isOp('!')) {
        this.next();
        e = { k: 'fact', a: e };
      } else if (this.peek().t === 'deg') {
        this.next();
        this.degrees = true;
      } else if (this.isOp('_') && e.k === 'sym') {
        this.next();
        const t = this.next();
        let sub: string;
        if (t.t === 'open' && t.v === '{') {
          const parts: string[] = [];
          while (this.peek().t !== 'close' && this.peek().t !== 'eof') {
            const u = this.next();
            parts.push('v' in u ? String(u.v) : '');
          }
          this.next();
          sub = parts.join('');
        } else if (t.t === 'num' || t.t === 'id') sub = t.v;
        else throw new ParseError('Bad subscript');
        e = sym(`${e.n}_${sub}`);
      } else break;
    }
    return e;
  }

  group(): Expr {
    const t = this.peek();
    if (t.t === 'open' && t.v === '{') {
      this.next();
      const e = this.sum();
      this.expectClose('{');
      return e;
    }
    // unbraced single-character argument
    const u = this.next();
    if (u.t === 'num') return numLit(u.v);
    if (u.t === 'id') return idExpr(u.v);
    throw new ParseError('Could not read a fraction or root');
  }

  primary(): Expr {
    const t = this.next();
    switch (t.t) {
      case 'num':
        return numLit(t.v);
      case 'id':
        return idExpr(t.v);
      case 'inf':
        return sym('infty');
      case 'open': {
        if (t.v === 'lbrace') throw new ParseError('Unexpected {');
        const save = this.absDepth;
        this.absDepth = 0;
        const e = this.sum();
        this.absDepth = save;
        const c = this.next();
        if (c.t !== 'close') throw new ParseError('A bracket is not closed');
        return e;
      }
      case 'bar': {
        this.absDepth++;
        const e = this.sum();
        this.absDepth--;
        const c = this.next();
        if (c.t !== 'bar') throw new ParseError('Modulus sign | not closed');
        return fn('abs', e);
      }
      case 'frac': {
        const a = this.group();
        const b = this.group();
        return div(a, b);
      }
      case 'sqrt': {
        let n = 2;
        if (this.peek().t === 'open' && (this.peek() as { v: string }).v === '[') {
          this.next();
          const idx = this.sum();
          const c = this.next();
          if (c.t !== 'close') throw new ParseError('Root index not closed');
          if (idx.k !== 'num' || !idx.v.isInt) throw new ParseError('Root index must be a whole number');
          n = idx.v.n;
        }
        const p = this.peek();
        if (p.t === 'open' && p.v === '(') {
          return sqrt(this.primary(), n);
        }
        return sqrt(this.group(), n);
      }
      case 'binom': {
        const a = this.group();
        const b = this.group();
        return { k: 'binom', n: a, r: b };
      }
      case 'fn':
        return this.fnApp(t.v);
      case 'log': {
        let base: Expr = num(10);
        if (this.isOp('_')) {
          this.next();
          const p = this.peek();
          if (p.t === 'open' && p.v === '{') base = this.group();
          else {
            const u = this.next();
            if (u.t === 'num') base = numLit(u.v);
            else if (u.t === 'id') base = idExpr(u.v);
            else throw new ParseError('Bad log base');
          }
        }
        const arg = this.fnArg();
        return { k: 'log', b: base, a: arg };
      }
      case 'eof':
        throw new ParseError('The answer is incomplete');
      default:
        throw new ParseError('Could not read your answer — check the operators');
    }
  }

  private fnApp(f: Fn): Expr {
    let power: Expr | null = null;
    let inverse = false;
    if (this.isOp('^')) {
      this.next();
      const ex = this.exponent();
      if (ex === 'deg') throw new ParseError('Bad degree sign');
      const v = ex.k === 'neg' && ex.a.k === 'num' ? -ex.a.v.value : ex.k === 'num' ? ex.v.value : NaN;
      if (v === -1 && ['sin', 'cos', 'tan'].includes(f)) inverse = true;
      else power = ex;
    }
    const arg = this.fnArg();
    const name: Fn = inverse ? (`arc${f}` as Fn) : f;
    const app = fn(name, arg);
    return power ? pow(app, power) : app;
  }

  /** Argument of sin/ln/log: bracketed, braced, or an implicit monomial like 3x or x^2. */
  private fnArg(): Expr {
    const t = this.peek();
    if (t.t === 'open' && (t.v === '(' || t.v === '[' || t.v === '{')) {
      const e = this.primary();
      // allow ln(x)^2 → (ln x)^2 handled by caller power(); here just the argument
      return e;
    }
    if (t.t === 'bar') return this.primary();
    // implicit monomial: [number] {sym-power} — stops at functions / operators
    const factors: Expr[] = [];
    for (;;) {
      const p = this.peek();
      if (p.t === 'num' && factors.length === 0) {
        this.next();
        let e = numLit(p.v);
        e = this.maybePow(e);
        factors.push(e);
        if (this.peek().t === 'deg') {
          this.next();
          this.degrees = true;
        }
      } else if (p.t === 'id' || p.t === 'frac' || p.t === 'sqrt') {
        let e = this.primary();
        e = this.maybePow(e);
        factors.push(e);
      } else break;
    }
    if (factors.length === 0) throw new ParseError('A function is missing its argument');
    return factors.length === 1 ? factors[0] : mul(...factors);
  }

  private maybePow(e: Expr): Expr {
    if (this.isOp('^')) {
      this.next();
      const ex = this.exponent();
      if (ex === 'deg') {
        this.degrees = true;
        return e;
      }
      return pow(e, ex);
    }
    return e;
  }
}

function endsWithNumber(e: Expr): boolean {
  if (e.k === 'num' || e.k === 'dec') return true;
  if (e.k === 'mul') return endsWithNumber(e.a[e.a.length - 1]);
  if (e.k === 'neg') return endsWithNumber(e.a);
  return false;
}

function mulFlat(a: Expr, b: Expr): Expr {
  if (a.k === 'mul') return { k: 'mul', a: [...a.a, b] };
  return mul(a, b);
}

function numLit(v: string): Expr {
  if (/[.eE]/.test(v)) {
    const x = Number(v);
    if (!Number.isFinite(x)) throw new ParseError('Bad number');
    return dec(x, v);
  }
  const n = Number(v);
  if (!Number.isSafeInteger(n)) return dec(n, v);
  return num(Q.of(n));
}

function idExpr(v: string): Expr {
  return sym(v);
}

// ---------- public API ----------
export function parseStatement(src: string): Statement {
  if (!src || !src.trim()) throw new ParseError('No answer entered');
  const p = new Parser(tokenize(src));
  return p.statement();
}

/** Parse a single expression (no relations, lists). ± is not allowed. */
export function parseExpr(src: string): Expr {
  const st = parseStatement(src);
  if (st.clauses.length !== 1 || st.clauses[0].kind !== 'expr') {
    throw new ParseError('Enter a single expression');
  }
  const e = st.clauses[0].e;
  if (hasPm(e)) throw new ParseError('Enter each value separately instead of using ±');
  return e;
}

export function hasPm(e: Expr): boolean {
  return some(e, (n) => n.k === 'sym' && n.n === PM);
}

/** Expand ± into the two alternatives. */
export function expandPm(e: Expr): Expr[] {
  if (!hasPm(e)) return [e];
  return [tidy(subst(e, PM, num(1))), tidy(subst(e, PM, num(-1)))];
}

/** Does the expression use degrees (° typed)? Re-parse helper. */
export function usesDegrees(src: string): boolean {
  try {
    return parseStatement(src).degrees;
  } catch {
    return false;
  }
}
