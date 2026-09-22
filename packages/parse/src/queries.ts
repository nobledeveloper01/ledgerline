/**
 * SQL the application runs → relationship claims, with evidence.
 *
 * A join is `JOIN b ON a.x = b.y`, `JOIN b USING (x)`, or an equality between
 * two tables' columns in a `WHERE`; a subquery is `a.x IN (SELECT y FROM b)`
 * or `a.x = (SELECT y FROM b …)`. Each becomes one claim carrying the query it
 * came from — with every literal replaced by `?` first, so the evidence is
 * the shape of the query and never a row (ADR-0003 #14).
 *
 * A polymorphic association is recognised by the Rails/Laravel shape and only
 * that shape: in one conjunction, `t.<p>_type = 'Literal'` beside
 * `t.<p>_id = other.col`, with the same prefix `<p>` on both columns. A
 * status column beside an ordinary join is not a discriminator, and the
 * prefix rule is what keeps it from being read as one.
 *
 * Columns are resolved through the query's own aliases; an unqualified
 * column is resolved against the declared schema when one is given, and
 * skipped — never guessed — when it is ambiguous.
 */

import type { Claims, ColumnRef, DeclaredSchema, PolymorphicClaim, RelationshipClaim, TableRef } from '@ledgerline/model';

import { pg, type Node } from './pg.ts';

const DEFAULT_SCHEMA = 'public';

export interface QuerySource {
  /** What a person would open: a file path, a log name. */
  readonly source: string;
  /** The line the statement starts on, when the source has lines. */
  readonly line?: number;
}

export interface QueryClaims extends Claims {
  /** Statements the parser refused; a count, so a log full of another dialect is reported and not hidden. */
  readonly unparsed: number;
  /** Statements parsed, whether or not they yielded a claim. */
  readonly parsed: number;
}

/**
 * Every literal becomes `?` before the text is kept anywhere. Strings,
 * numbers, and dollar-quoted blocks; identifiers and keywords stay.
 */
export function maskLiterals(sql: string): string {
  return sql
    .replace(/\$[a-zA-Z_]*\$[\s\S]*?\$[a-zA-Z_]*\$/g, '?')
    .replace(/'(?:[^']|'')*'/g, '?')
    .replace(/\b\d+(?:\.\d+)?\b/g, '?')
    .replace(/\s+/g, ' ')
    .trim();
}

function str(node: unknown): string {
  const n = node as { String?: { sval?: string } } | undefined;
  return n?.String?.sval ?? '';
}

interface Scope {
  /** alias or bare table name → the table, or null for a derived table (subselect, CTE, function). */
  readonly names: Map<string, TableRef | null>;
  readonly parent: Scope | null;
}

function lookup(scope: Scope | null, name: string): TableRef | null | undefined {
  for (let s = scope; s; s = s.parent) {
    if (s.names.has(name)) return s.names.get(name);
  }
  return undefined;
}

interface Resolved {
  readonly table: TableRef;
  readonly column: string;
}

class Walker {
  readonly relationships: RelationshipClaim[] = [];
  readonly polymorphic: PolymorphicClaim[] = [];
  private readonly schema: DeclaredSchema | null;
  private readonly evidence: { source: string; line?: number; text: string };

  constructor(schema: DeclaredSchema | null, evidence: { source: string; line?: number; text: string }) {
    this.schema = schema;
    this.evidence = evidence;
  }

  private columnsOf(t: TableRef): readonly string[] | null {
    const found = this.schema?.tables.find((x) => x.schema === t.schema && x.name === t.name);
    return found ? found.columns.map((c) => c.name) : null;
  }

  private resolve(scope: Scope, fields: string[]): Resolved | null {
    if (fields.length === 3) {
      const [schema, name, column] = fields as [string, string, string];
      return { table: { schema, name }, column };
    }
    if (fields.length === 2) {
      const [q, column] = fields as [string, string];
      const t = lookup(scope, q);
      if (t === undefined) return { table: { schema: DEFAULT_SCHEMA, name: q }, column }; // an unaliased table named directly
      return t === null ? null : { table: t, column };
    }
    if (fields.length === 1) {
      const column = fields[0]!;
      // Unqualified: the one table in scope that has it, from the schema; else the only table in scope; else give up.
      const tables = [...scope.names.values()].filter((t): t is TableRef => t !== null);
      if (this.schema) {
        const having = tables.filter((t) => this.columnsOf(t)?.includes(column));
        if (having.length === 1) return { table: having[0]!, column };
        if (having.length > 1) return null;
      }
      if (tables.length === 1 && scope.names.size === 1) return { table: tables[0]!, column };
      return null;
    }
    return null;
  }

  private ref(r: Resolved): ColumnRef {
    return { schema: r.table.schema, name: r.table.name, column: r.column };
  }

  private claim(a: Resolved, b: Resolved): void {
    if (a.table.schema === b.table.schema && a.table.name === b.table.name && a.column === b.column) return; // x = x
    this.relationships.push({ from: [this.ref(a)], to: [this.ref(b)], directed: false, evidence: { kind: 'query', ...this.evidence } });
  }

  /** Registers the FROM items into the scope, descending into joins; returns nothing, the scope is mutated. */
  private fromItem(scope: Scope, item: Node): void {
    if (item['RangeVar']) {
      const rv = item['RangeVar'] as { schemaname?: string; relname: string; alias?: { aliasname: string } };
      const t: TableRef = { schema: rv.schemaname ?? DEFAULT_SCHEMA, name: rv.relname };
      // A CTE or derived table with this name shadows a table of the same name.
      const known = rv.schemaname ? undefined : lookup(scope, rv.relname);
      scope.names.set(rv.alias?.aliasname ?? rv.relname, known === null ? null : t);
    } else if (item['JoinExpr']) {
      const j = item['JoinExpr'] as { larg: Node; rarg: Node; quals?: Node; usingClause?: unknown[] };
      this.fromItem(scope, j.larg);
      this.fromItem(scope, j.rarg);
      if (j.quals) this.conjuncts(scope, j.quals);
      if (j.usingClause && j.usingClause.length > 0) this.using(scope, j.larg, j.rarg, j.usingClause.map(str));
    } else if (item['RangeSubselect']) {
      const rs = item['RangeSubselect'] as { subquery: Node; alias?: { aliasname: string } };
      if (rs.alias) scope.names.set(rs.alias.aliasname, null);
      this.select(scope, rs.subquery);
    } else if (item['RangeFunction']) {
      const rf = item['RangeFunction'] as { alias?: { aliasname: string } };
      if (rf.alias) scope.names.set(rf.alias.aliasname, null);
    }
  }

  /** The tables under a FROM item, nearest last. */
  private tablesUnder(scope: Scope, item: Node): TableRef[] {
    if (item['RangeVar']) {
      const rv = item['RangeVar'] as { relname: string; alias?: { aliasname: string } };
      const t = scope.names.get(rv.alias?.aliasname ?? rv.relname);
      return t ? [t] : [];
    }
    if (item['JoinExpr']) {
      const j = item['JoinExpr'] as { larg: Node; rarg: Node };
      return [...this.tablesUnder(scope, j.larg), ...this.tablesUnder(scope, j.rarg)];
    }
    return [];
  }

  /**
   * `USING (c)` joins the one table on each side that has `c`. With a schema
   * that table is found; without one the nearest table on each side is taken,
   * which is what a reader assumes and is right almost always.
   */
  private using(scope: Scope, larg: Node, rarg: Node, columns: string[]): void {
    const pick = (side: Node, c: string): TableRef | null => {
      const tables = this.tablesUnder(scope, side);
      if (this.schema) {
        const having = tables.filter((t) => this.columnsOf(t)?.includes(c));
        if (having.length >= 1) return having[having.length - 1]!;
        if (tables.some((t) => this.columnsOf(t) !== null)) return null; // known tables, none has it: not a join the schema explains
      }
      return tables[tables.length - 1] ?? null;
    };
    for (const c of columns) {
      const l = pick(larg, c);
      const r = pick(rarg, c);
      if (l && r) this.claim({ table: l, column: c }, { table: r, column: c });
    }
  }

  /** AND-conjuncts of a predicate, flattened; OR and NOT are not descended, because a relationship inside an OR is not one the query relies on. */
  private conjuncts(scope: Scope, expr: Node): void {
    const parts: Node[] = [];
    const flatten = (n: Node): void => {
      const b = n['BoolExpr'] as { boolop: string; args: Node[] } | undefined;
      if (b && b.boolop === 'AND_EXPR') b.args.forEach(flatten);
      else parts.push(n);
    };
    flatten(expr);
    for (const p of parts) {
      const e = p['A_Expr'] as { kind: string; name: unknown[]; lexpr?: Node; rexpr?: Node } | undefined;
      if (e && e.kind === 'AEXPR_OP' && str(e.name[0]) === '=' && e.lexpr && e.rexpr) {
        const l = this.column(scope, e.lexpr);
        const r = this.column(scope, e.rexpr);
        if (l && r) {
          this.columnEq.push({ a: l, b: r });
          this.claim(l, r);
          continue;
        }
        const lit = this.literal(e.lexpr) ?? this.literal(e.rexpr);
        const col = l ?? r;
        if (lit !== null && col) this.literalEq.push({ col, value: lit });
        if (e.rexpr['SubLink'] && l) {
          // a.x = (SELECT y FROM b …)
          this.scalarSub(scope, l, (e.rexpr['SubLink'] as { subselect: Node }).subselect);
        }
        continue;
      }
      const sub = p['SubLink'] as { subLinkType: string; testexpr?: Node; subselect: Node } | undefined;
      if (sub) this.sublink(scope, sub);
    }
  }

  private readonly literalEq: { col: Resolved; value: string }[] = [];
  private readonly columnEq: { a: Resolved; b: Resolved }[] = [];

  /** The polymorphic shape, over the whole statement: t.<p>_type = 'X' beside t.<p>_id = other.col, same prefix. */
  private polymorphicPass(): void {
    for (const lit of this.literalEq) {
      const m = /^(.*)_type$/.exec(lit.col.column);
      if (!m) continue;
      const prefix = m[1]!;
      for (const eq of this.columnEq) {
        for (const [me, other] of [[eq.a, eq.b], [eq.b, eq.a]] as const) {
          if (me.table.schema === lit.col.table.schema && me.table.name === lit.col.table.name && me.column === `${prefix}_id`) {
            this.polymorphic.push({
              from: [this.ref(me)],
              discriminator: this.ref(lit.col),
              targets: { [lit.value]: { schema: other.table.schema, name: other.table.name } },
              evidence: { kind: 'query', ...this.evidence },
            });
            // The plain equality was also recorded as an ordinary claim; remove it — it is the polymorphic edge.
            const i = this.relationships.findIndex((c) => c.from[0]?.column === me.column && c.from[0]?.name === me.table.name && c.evidence.text === this.evidence.text);
            if (i >= 0) this.relationships.splice(i, 1);
          }
        }
      }
    }
  }

  private column(scope: Scope, n: Node): Resolved | null {
    const c = n['ColumnRef'] as { fields: unknown[] } | undefined;
    if (!c) return null;
    const fields = c.fields.map(str).filter((f) => f.length > 0);
    if (fields.length === 0 || fields.length !== c.fields.length) return null; // a star, or something not a name
    return this.resolve(scope, fields);
  }

  private literal(n: Node): string | null {
    const c = n['A_Const'] as { sval?: { sval: string } } | undefined;
    return c?.sval?.sval ?? null;
  }

  /** `a.x IN (SELECT y FROM b …)` / `= ANY (SELECT …)`. */
  private sublink(scope: Scope, s: { subLinkType: string; testexpr?: Node; subselect: Node }): void {
    if (!s.testexpr) {
      this.select(scope, s.subselect); // EXISTS (…): the inner query's own joins still count
      return;
    }
    const outer = this.column(scope, s.testexpr);
    if (!outer) return;
    this.scalarSub(scope, outer, s.subselect);
  }

  private scalarSub(scope: Scope, outer: Resolved, subselect: Node): void {
    const sel = subselect['SelectStmt'] as { targetList?: Node[]; fromClause?: Node[] } | undefined;
    if (!sel) return;
    const inner: Scope = { names: new Map(), parent: scope };
    for (const f of sel.fromClause ?? []) this.fromItem(inner, f);
    this.select(scope, subselect); // its own joins and where
    const target = sel.targetList?.[0]?.['ResTarget'] as { val?: Node } | undefined;
    const col = target?.val ? this.column(inner, target.val) : null;
    if (col) this.claim(outer, col);
  }

  select(parent: Scope, stmt: Node): void {
    const sel = stmt['SelectStmt'] as { withClause?: { ctes: Node[] }; fromClause?: Node[]; whereClause?: Node; larg?: Node; rarg?: Node; targetList?: Node[] } | undefined;
    if (!sel) return;
    const scope: Scope = { names: new Map(), parent };
    for (const cte of sel.withClause?.ctes ?? []) {
      const c = cte['CommonTableExpr'] as { ctename: string; ctequery: Node };
      scope.names.set(c.ctename, null);
      this.select(scope, c.ctequery);
    }
    if (sel.larg && sel.rarg) {
      // UNION / INTERSECT / EXCEPT
      this.select(scope, sel.larg);
      this.select(scope, sel.rarg);
      return;
    }
    for (const f of sel.fromClause ?? []) this.fromItem(scope, f);
    if (sel.whereClause) this.conjuncts(scope, sel.whereClause);
    for (const t of sel.targetList ?? []) {
      const v = (t['ResTarget'] as { val?: Node } | undefined)?.val;
      if (v?.['SubLink']) this.sublink(scope, v['SubLink'] as { subLinkType: string; testexpr?: Node; subselect: Node });
    }
  }

  statement(stmt: Node): void {
    this.walk(stmt);
    this.polymorphicPass();
  }

  private walk(stmt: Node): void {
    if (stmt['SelectStmt']) this.select({ names: new Map(), parent: null }, stmt);
    else if (stmt['InsertStmt']) {
      const ins = stmt['InsertStmt'] as { selectStmt?: Node };
      if (ins.selectStmt) this.select({ names: new Map(), parent: null }, ins.selectStmt);
    } else if (stmt['UpdateStmt'] || stmt['DeleteStmt']) {
      const u = (stmt['UpdateStmt'] ?? stmt['DeleteStmt']) as { relation: Node; fromClause?: Node[]; usingClause?: Node[]; whereClause?: Node };
      const scope: Scope = { names: new Map(), parent: null };
      this.fromItem(scope, { RangeVar: u.relation });
      for (const f of [...(u.fromClause ?? []), ...(u.usingClause ?? [])]) this.fromItem(scope, f);
      if (u.whereClause) this.conjuncts(scope, u.whereClause);
    }
  }
}

/** Placeholders other drivers use, rewritten to the `$n` PostgreSQL parses: `?`, `:name`, `%s`, `%(name)s`, `${x}`. */
export function normalisePlaceholders(sql: string): string {
  let n = 0;
  return sql
    .replace(/\$\{[^}]*\}/g, () => `$${++n}`)
    .replace(/%\([\w.]+\)s/g, () => `$${++n}`)
    .replace(/(?<![\w%])%[sd]\b/g, () => `$${++n}`)
    .replace(/(?<![\w:]):[a-zA-Z_]\w*\b(?!\s*::)/g, () => `$${++n}`)
    .replace(/\?(?!\?)/g, () => `$${++n}`);
}

/**
 * Claims from one SQL text — one statement or many. Statements the grammar
 * refuses are counted, not raised: a query log is full of things that are
 * not PostgreSQL, and one bad line must not hide the rest.
 */
export type QueryDialect = 'postgres' | 'mysql';

/**
 * MySQL's query syntax that PostgreSQL's parser refuses, rewritten: backtick
 * identifiers, and `LIMIT n, m` — which is `LIMIT m OFFSET n`. Everything
 * else about a join is the same SQL in both, which is why one walker reads
 * both (ADR-0004).
 */
export function mysqlQueryToPostgres(sql: string): string {
  return sql
    .replace(/`([^`]*)`/g, (_, name: string) => `"${name.replace(/"/g, '""')}"`)
    .replace(/\blimit\s+(\d+)\s*,\s*(\d+)/gi, (_, a: string, b: string) => `LIMIT ${b} OFFSET ${a}`);
}

export async function claimsFromSql(sql: string, at: QuerySource, schema: DeclaredSchema | null = null, dialect: QueryDialect = 'postgres'): Promise<QueryClaims> {
  const p = await pg();
  const relationships: RelationshipClaim[] = [];
  const polymorphic: PolymorphicClaim[] = [];
  let parsed = 0;
  let unparsed = 0;
  const text = normalisePlaceholders(dialect === 'mysql' ? mysqlQueryToPostgres(sql) : sql);
  let stmts: readonly { stmt: Node; stmt_location?: number }[];
  try {
    stmts = (await p.parse(text)).stmts;
  } catch {
    // Try statement by statement, so one bad one costs only itself.
    stmts = [];
    let offset = 0;
    for (const piece of text.split(/;(?=(?:[^']*'[^']*')*[^']*$)/)) {
      const trimmed = piece.trim();
      if (trimmed.length === 0) {
        offset += piece.length + 1;
        continue;
      }
      try {
        const r = await p.parse(trimmed);
        for (const s of r.stmts) stmts = [...stmts, { stmt: s.stmt, stmt_location: offset + (s.stmt_location ?? 0) }];
      } catch {
        unparsed++;
      }
      offset += piece.length + 1;
    }
  }
  for (const s of stmts) {
    parsed++;
    const start = s.stmt_location ?? 0;
    // The location is just past the previous `;`, before any newline or comment; count up to the first token.
    const lead = /^(?:\s|--[^\n]*|\/\*[\s\S]*?\*\/)*/.exec(text.slice(start))?.[0].length ?? 0;
    const line = at.line === undefined ? undefined : at.line + (text.slice(0, start + lead).match(/\n/g)?.length ?? 0);
    const ev: { source: string; line?: number; text: string } = { source: at.source, text: maskLiterals(statementText(text, start)) };
    if (line !== undefined) ev.line = line;
    const w = new Walker(schema, ev);
    w.statement(s.stmt);
    relationships.push(...w.relationships);
    polymorphic.push(...w.polymorphic);
  }
  return { relationships, polymorphic, parsed, unparsed };
}

function statementText(text: string, start: number): string {
  // The evidence is the statement, not the comment above it.
  const rest = text.slice(start).replace(/^(?:\s|--[^\n]*|\/\*[\s\S]*?\*\/)*/, '');
  const end = rest.search(/;(?=(?:[^']*'[^']*')*[^']*$)/);
  const one = end === -1 ? rest : rest.slice(0, end);
  return one.length > 300 ? `${one.slice(0, 297)}…` : one;
}
