/**
 * Clean-room MIT-licensed recursive-descent spreadsheet Formula AST parser & evaluator.
 * Supports A1 (`A1`, `$B$2`) and R1C1 (`R1C1`, `R[1]C[-1]`) addressing, ranges (`A1:B4`),
 * arithmetic/comparison operators, `SUM`/`AVERAGE`/`MIN`/`MAX`/`IF`/`COUNT`, and cycle detection.
 */

export interface CellCoord {
  readonly row: number; // 0-based
  readonly col: number; // 0-based
}

export type FormulaAstNode =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'cell'; readonly coord: CellCoord }
  | { readonly kind: 'range'; readonly start: CellCoord; readonly end: CellCoord }
  | { readonly kind: 'unary'; readonly op: '+' | '-'; readonly arg: FormulaAstNode }
  | {
      readonly kind: 'binary';
      readonly op: '+' | '-' | '*' | '/' | '^' | '=' | '<>' | '<' | '<=' | '>' | '>=';
      readonly left: FormulaAstNode;
      readonly right: FormulaAstNode;
    }
  | { readonly kind: 'call'; readonly name: string; readonly args: ReadonlyArray<FormulaAstNode> };

export type CellScalar = number | string | boolean;

export interface EvaluatedCell {
  readonly address: string;
  readonly raw: string;
  readonly value: CellScalar;
  readonly error?: '#CYCLE!' | '#DIV/0!' | '#ERROR!' | '#VALUE!';
  readonly dependencies: ReadonlyArray<string>;
}

export function colIndexToLetters(colIndex: number): string {
  let n = Math.max(0, Math.floor(colIndex)) + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function lettersToColIndex(letters: string): number {
  let col = 0;
  const upper = letters.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const code = upper.charCodeAt(i);
    if (code < 65 || code > 90) return -1;
    col = col * 26 + (code - 64);
  }
  return col - 1;
}

export function formatA1Address(coord: CellCoord): string {
  return `${colIndexToLetters(coord.col)}${coord.row + 1}`;
}

export function formatR1C1Address(coord: CellCoord): string {
  return `R${coord.row + 1}C${coord.col + 1}`;
}

export function parseA1Address(raw: string): CellCoord | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(raw.trim());
  if (!m) return null;
  const col = lettersToColIndex(m[1]!);
  const row = Number(m[2]) - 1;
  if (col < 0 || row < 0 || !Number.isFinite(row)) return null;
  return { row, col };
}

export function parseR1C1Address(raw: string, origin: CellCoord): CellCoord | null {
  const m = /^R(?:\[(-?\d+)\]|(\d+))?C(?:\[(-?\d+)\]|(\d+))?$/i.exec(raw.trim());
  if (!m) return null;
  const row =
    m[1] !== undefined
      ? origin.row + Number(m[1])
      : m[2] !== undefined
        ? Number(m[2]) - 1
        : origin.row;
  const col =
    m[3] !== undefined
      ? origin.col + Number(m[3])
      : m[4] !== undefined
        ? Number(m[4]) - 1
        : origin.col;
  if (row < 0 || col < 0 || !Number.isFinite(row) || !Number.isFinite(col)) return null;
  return { row, col };
}

export function parseCellReference(raw: string, origin: CellCoord): CellCoord | null {
  return parseA1Address(raw) ?? parseR1C1Address(raw, origin);
}

type Token =
  | { readonly type: 'num'; readonly value: number }
  | { readonly type: 'str'; readonly value: string }
  | { readonly type: 'ident'; readonly value: string }
  | { readonly type: 'op'; readonly value: string }
  | { readonly type: 'lparen' }
  | { readonly type: 'rparen' }
  | { readonly type: 'comma' }
  | { readonly type: 'colon' };

function tokenizeFormula(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: 'colon' });
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        str += input[i]!;
        i++;
      }
      if (i >= input.length) throw new Error('Unterminated string literal');
      i++;
      tokens.push({ type: 'str', value: str });
      continue;
    }
    const twoChar = input.slice(i, i + 2);
    if (twoChar === '<=' || twoChar === '>=' || twoChar === '<>' || twoChar === '!=') {
      tokens.push({ type: 'op', value: twoChar === '!=' ? '<>' : twoChar });
      i += 2;
      continue;
    }
    if ('+-*/^=<>'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(input[i + 1] ?? ''))) {
      let numStr = '';
      while (i < input.length && /[\d.]/.test(input[i]!)) {
        numStr += input[i]!;
        i++;
      }
      const n = Number(numStr);
      if (!Number.isFinite(n)) throw new Error(`Invalid number ${numStr}`);
      tokens.push({ type: 'num', value: n });
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let id = '';
      while (i < input.length) {
        const cur = input[i]!;
        if (cur === '[') {
          const closeIdx = input.indexOf(']', i);
          if (closeIdx === -1) throw new Error('Unclosed R1C1 bracket');
          id += input.slice(i, closeIdx + 1);
          i = closeIdx + 1;
          continue;
        }
        if (/[A-Za-z0-9_$]/.test(cur)) {
          id += cur;
          i++;
          continue;
        }
        break;
      }
      tokens.push({ type: 'ident', value: id });
      continue;
    }
    throw new Error(`Unexpected character "${ch}"`);
  }
  return tokens;
}

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: ReadonlyArray<Token>,
    private readonly origin: CellCoord,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token | undefined {
    const t = this.tokens[this.pos];
    this.pos++;
    return t;
  }

  parse(): FormulaAstNode {
    const expr = this.parseComparison();
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected trailing tokens');
    }
    return expr;
  }

  private parseComparison(): FormulaAstNode {
    let left = this.parseAdditive();
    while (true) {
      const t = this.peek();
      if (
        t?.type === 'op' &&
        (t.value === '=' ||
          t.value === '<>' ||
          t.value === '<' ||
          t.value === '<=' ||
          t.value === '>' ||
          t.value === '>=')
      ) {
        this.consume();
        const right = this.parseAdditive();
        left = { kind: 'binary', op: t.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseAdditive(): FormulaAstNode {
    let left = this.parseMultiplicative();
    while (true) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
        this.consume();
        const right = this.parseMultiplicative();
        left = { kind: 'binary', op: t.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseMultiplicative(): FormulaAstNode {
    let left = this.parsePower();
    while (true) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '*' || t.value === '/')) {
        this.consume();
        const right = this.parsePower();
        left = { kind: 'binary', op: t.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parsePower(): FormulaAstNode {
    const left = this.parseUnary();
    const t = this.peek();
    if (t?.type === 'op' && t.value === '^') {
      this.consume();
      const right = this.parsePower();
      return { kind: 'binary', op: '^', left, right };
    }
    return left;
  }

  private parseUnary(): FormulaAstNode {
    const t = this.peek();
    if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
      this.consume();
      return { kind: 'unary', op: t.value, arg: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): FormulaAstNode {
    const t = this.consume();
    if (!t) throw new Error('Unexpected end of formula');

    if (t.type === 'num') return { kind: 'number', value: t.value };
    if (t.type === 'str') return { kind: 'string', value: t.value };
    if (t.type === 'lparen') {
      const inner = this.parseComparison();
      const close = this.consume();
      if (close?.type !== 'rparen') throw new Error('Expected )');
      return inner;
    }
    if (t.type === 'ident') {
      if (this.peek()?.type === 'lparen') {
        this.consume();
        const args: FormulaAstNode[] = [];
        if (this.peek()?.type !== 'rparen') {
          while (true) {
            args.push(this.parseComparison());
            if (this.peek()?.type === 'comma') {
              this.consume();
              continue;
            }
            break;
          }
        }
        const close = this.consume();
        if (close?.type !== 'rparen') throw new Error('Expected ) after function args');
        return { kind: 'call', name: t.value.toUpperCase(), args };
      }
      const upper = t.value.toUpperCase();
      if (upper === 'TRUE') return { kind: 'boolean', value: true };
      if (upper === 'FALSE') return { kind: 'boolean', value: false };

      const startCoord = parseCellReference(t.value, this.origin);
      if (!startCoord) throw new Error(`Unknown identifier ${t.value}`);

      if (this.peek()?.type === 'colon') {
        this.consume();
        const endTok = this.consume();
        if (endTok?.type !== 'ident') throw new Error('Expected range end reference');
        const endCoord = parseCellReference(endTok.value, this.origin);
        if (!endCoord) throw new Error(`Invalid range end ${endTok.value}`);
        return { kind: 'range', start: startCoord, end: endCoord };
      }

      return { kind: 'cell', coord: startCoord };
    }
    throw new Error('Unexpected token in formula');
  }
}

export function parseFormula(formulaText: string, origin: CellCoord = { row: 0, col: 0 }): FormulaAstNode {
  const body = formulaText.startsWith('=') ? formulaText.slice(1) : formulaText;
  const tokens = tokenizeFormula(body);
  return new Parser(tokens, origin).parse();
}

export function collectAstDependencies(node: FormulaAstNode): string[] {
  const deps = new Set<string>();
  const walk = (n: FormulaAstNode): void => {
    switch (n.kind) {
      case 'cell':
        deps.add(formatA1Address(n.coord));
        break;
      case 'range': {
        const minR = Math.min(n.start.row, n.end.row);
        const maxR = Math.max(n.start.row, n.end.row);
        const minC = Math.min(n.start.col, n.end.col);
        const maxC = Math.max(n.start.col, n.end.col);
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            deps.add(formatA1Address({ row: r, col: c }));
          }
        }
        break;
      }
      case 'unary':
        walk(n.arg);
        break;
      case 'binary':
        walk(n.left);
        walk(n.right);
        break;
      case 'call':
        n.args.forEach(walk);
        break;
      default:
        break;
    }
  };
  walk(node);
  return Array.from(deps);
}

class EvalErrorSignal extends Error {
  constructor(readonly code: '#CYCLE!' | '#DIV/0!' | '#ERROR!' | '#VALUE!') {
    super(code);
  }
}

function toNumeric(val: CellScalar): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val.trim() === '') return 0;
  const parsed = Number(val);
  if (!Number.isFinite(parsed)) throw new EvalErrorSignal('#VALUE!');
  return parsed;
}

function isNumericValue(val: CellScalar): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

export function evaluateSheet(
  rawCells: Readonly<Record<string, string>>,
): Readonly<Record<string, EvaluatedCell>> {
  const normalized = new Map<string, string>();
  for (const [k, v] of Object.entries(rawCells)) {
    const coord = parseA1Address(k);
    if (coord) {
      normalized.set(formatA1Address(coord), v);
    }
  }

  const cache = new Map<string, EvaluatedCell>();
  const visiting = new Set<string>();

  const evalCell = (addr: string): EvaluatedCell => {
    const cached = cache.get(addr);
    if (cached) return cached;

    if (visiting.has(addr)) {
      throw new EvalErrorSignal('#CYCLE!');
    }

    const raw = normalized.get(addr) ?? '';
    if (!raw.startsWith('=')) {
      const trimmed = raw.trim();
      const num = trimmed !== '' ? Number(trimmed) : Number.NaN;
      const value: CellScalar =
        trimmed === 'TRUE'
          ? true
          : trimmed === 'FALSE'
            ? false
            : trimmed !== '' && Number.isFinite(num)
              ? num
              : raw;
      const done: EvaluatedCell = { address: addr, raw, value, dependencies: [] };
      cache.set(addr, done);
      return done;
    }

    visiting.add(addr);
    try {
      const origin = parseA1Address(addr) ?? { row: 0, col: 0 };
      let ast: FormulaAstNode;
      try {
        ast = parseFormula(raw, origin);
      } catch {
        const errRes: EvaluatedCell = {
          address: addr,
          raw,
          value: '#ERROR!',
          error: '#ERROR!',
          dependencies: [],
        };
        cache.set(addr, errRes);
        return errRes;
      }

      const dependencies = collectAstDependencies(ast);

      const flattenArgs = (args: ReadonlyArray<FormulaAstNode>): CellScalar[] => {
        const out: CellScalar[] = [];
        for (const arg of args) {
          if (arg.kind === 'range') {
            const minR = Math.min(arg.start.row, arg.end.row);
            const maxR = Math.max(arg.start.row, arg.end.row);
            const minC = Math.min(arg.start.col, arg.end.col);
            const maxC = Math.max(arg.start.col, arg.end.col);
            for (let r = minR; r <= maxR; r++) {
              for (let c = minC; c <= maxC; c++) {
                const ref = formatA1Address({ row: r, col: c });
                const evaluated = evalCell(ref);
                if (evaluated.error) throw new EvalErrorSignal(evaluated.error);
                out.push(evaluated.value);
              }
            }
          } else {
            out.push(evalNode(arg));
          }
        }
        return out;
      };

      const evalNode = (node: FormulaAstNode): CellScalar => {
        switch (node.kind) {
          case 'number':
          case 'string':
          case 'boolean':
            return node.value;
          case 'cell': {
            const ref = formatA1Address(node.coord);
            const evaluated = evalCell(ref);
            if (evaluated.error) throw new EvalErrorSignal(evaluated.error);
            return evaluated.value;
          }
          case 'range':
            throw new EvalErrorSignal('#VALUE!');
          case 'unary': {
            const n = toNumeric(evalNode(node.arg));
            return node.op === '-' ? -n : n;
          }
          case 'binary': {
            const l = evalNode(node.left);
            const r = evalNode(node.right);
            if (node.op === '=') return l === r;
            if (node.op === '<>') return l !== r;
            const nl = toNumeric(l);
            const nr = toNumeric(r);
            switch (node.op) {
              case '+':
                return nl + nr;
              case '-':
                return nl - nr;
              case '*':
                return nl * nr;
              case '/':
                if (nr === 0) throw new EvalErrorSignal('#DIV/0!');
                return nl / nr;
              case '^':
                return nl ** nr;
              case '<':
                return nl < nr;
              case '<=':
                return nl <= nr;
              case '>':
                return nl > nr;
              case '>=':
                return nl >= nr;
            }
            break;
          }
          case 'call': {
            const name = node.name;
            if (name === 'IF') {
              const cond = node.args[0] ? evalNode(node.args[0]) : false;
              const branch = cond ? node.args[1] : node.args[2];
              return branch ? evalNode(branch) : false;
            }
            if (name === 'ABS') {
              const first = node.args[0] ? toNumeric(evalNode(node.args[0])) : 0;
              return Math.abs(first);
            }
            if (name === 'ROUND') {
              const val = node.args[0] ? toNumeric(evalNode(node.args[0])) : 0;
              const digits = node.args[1] ? Math.trunc(toNumeric(evalNode(node.args[1]))) : 0;
              const factor = 10 ** digits;
              return Math.round(val * factor) / factor;
            }
            if (name === 'CONCAT') {
              return flattenArgs(node.args)
                .map((v) => String(v))
                .join('');
            }
            const flat = flattenArgs(node.args);
            const nums = flat.filter(isNumericValue);
            if (name === 'SUM') return nums.reduce((a, b) => a + b, 0);
            if (name === 'COUNT') return nums.length;
            if (name === 'AVERAGE') {
              if (nums.length === 0) throw new EvalErrorSignal('#DIV/0!');
              return nums.reduce((a, b) => a + b, 0) / nums.length;
            }
            if (name === 'MIN') return nums.length === 0 ? 0 : Math.min(...nums);
            if (name === 'MAX') return nums.length === 0 ? 0 : Math.max(...nums);
            throw new EvalErrorSignal('#ERROR!');
          }
        }
        throw new EvalErrorSignal('#ERROR!');
      };

      const value = evalNode(ast);
      const ok: EvaluatedCell = { address: addr, raw, value, dependencies };
      cache.set(addr, ok);
      return ok;
    } catch (err) {
      const code =
        err instanceof EvalErrorSignal ? err.code : ('#ERROR!' as const);
      const failed: EvaluatedCell = {
        address: addr,
        raw,
        value: code,
        error: code,
        dependencies: [],
      };
      cache.set(addr, failed);
      return failed;
    } finally {
      visiting.delete(addr);
    }
  };

  const result: Record<string, EvaluatedCell> = {};
  for (const addr of normalized.keys()) {
    result[addr] = evalCell(addr);
  }
  return result;
}
