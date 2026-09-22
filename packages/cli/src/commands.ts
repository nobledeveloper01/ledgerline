/**
 * The commands, as functions that take a working directory and return an exit
 * code and lines. Nothing here writes to stdout; `bin.ts` does that, so every
 * command is testable without capturing a stream, and the GitHub Action can
 * call the same function the terminal does (ADR-0003 #11: everything the
 * Action does is also one CLI command).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  againstBaseline,
  BASELINE_VERSION,
  blastRadius,
  changeFindings,
  diff,
  explain as explainFinding,
  fails,
  findingKey,
  findings as modelFindings,
  isEmptyDiff,
  makeBaseline,
  tableKey,
  usage as usageReport,
  type Baseline,
  type Finding,
  type Model,
} from '@ledgerline/model';
import { badgeLine, mermaidFor, renderHtml } from '@ledgerline/render';
import { historyOfDirectory, readModel, serializeModel, writeModel } from '@ledgerline/sources';

import { buildModel, type BuildOptions } from './build.ts';
import { resolveConfig, type Resolved } from './config.ts';

export interface Outcome {
  readonly code: number;
  readonly lines: readonly string[];
}

export interface CommonOptions extends BuildOptions {
  readonly root?: string;
  readonly config?: Resolved;
}

function settings(options: CommonOptions): Resolved {
  return options.config ?? resolveConfig(options.root ?? process.cwd());
}

const SEVERITY_ORDER = { fail: 0, warn: 1, info: 2 } as const;

export function sortFindings(list: readonly Finding[]): Finding[] {
  return [...list].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.sentence.localeCompare(b.sentence));
}

function readBaseline(path: string): Baseline | null {
  if (!existsSync(path)) return null;
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Baseline;
  // The version lives in the model package; comparing to a literal here is a
  // second place the number lives, and the two would drift.
  if (parsed.version !== BASELINE_VERSION) throw new Error(`${path}: baseline format ${String(parsed.version)} is not ${BASELINE_VERSION}`);
  return parsed;
}

function readSummary(report: { from: string; sources: number; statementsParsed: number; statementsUnparsed: number }): string {
  const parts = [`schema from ${report.from}`, `${report.statementsParsed} statement${report.statementsParsed === 1 ? '' : 's'} in ${report.sources} source${report.sources === 1 ? '' : 's'}`];
  if (report.statementsUnparsed > 0) parts.push(`${report.statementsUnparsed} not parsed`);
  return parts.join(' · ');
}

/**
 * `ledgerline check` — the reason the product exists.
 *
 * Recomputes the model, prints one sentence per finding, and exits non-zero
 * on anything that fails. With a baseline, only findings outside it fail
 * (#12). With `--write`, the model file is written rather than compared, so
 * the first run on a repository is not a failure about a file that does not
 * exist yet.
 */
export async function check(options: CommonOptions & { write?: boolean; baseline?: boolean } = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  const lines: string[] = [readSummary(built)];
  const all = sortFindings(modelFindings(built.model, config.policy));

  const baselinePath = join(config.root, config.baseline);
  const baseline = readBaseline(baselinePath);
  const considered = baseline ? againstBaseline(all, baseline) : null;
  const active = considered ? considered.fresh : all;

  const modelPath = join(config.root, config.model);
  if (options.write) {
    writeModel(modelPath, built.model);
    lines.push(`wrote ${config.model}`);
  } else if (existsSync(modelPath)) {
    const previous = readModel(modelPath);
    const d = diff(previous, built.model);
    if (!isEmptyDiff(d)) {
      lines.push(`${config.model} is out of date: ${describeDiff(d)} — run ledgerline model`);
      for (const f of sortFindings(changeFindings(d, config.policy))) lines.push(`  ${f.severity}: ${f.sentence}`);
    }
  }

  for (const f of active) {
    lines.push(`${f.severity}: ${f.sentence}${f.where.length > 0 ? `\n    ${f.where.slice(0, 3).join('\n    ')}` : ''}`);
    // With a baseline in play, a reviewer who has decided this one is debt
    // should be able to accept *it* — pasting one line — rather than running
    // `ledgerline baseline`, which would accept everything else too.
    if (baseline !== null && f.severity === 'fail') lines.push(`    to accept just this one, add to ${config.baseline}: ${JSON.stringify(findingKey(f))}`);
  }
  if (considered) {
    if (considered.accepted.length > 0) lines.push(`${considered.accepted.length} finding${considered.accepted.length === 1 ? '' : 's'} accepted by ${config.baseline}`);
    if (considered.fixed.length > 0) lines.push(`${considered.fixed.length} baseline entr${considered.fixed.length === 1 ? 'y is' : 'ies are'} fixed — run ledgerline baseline to shrink it`);
  }
  if (active.length === 0) lines.push('No findings. Every relationship the queries rely on is declared.');
  const stale = !options.write && existsSync(modelPath) && !isEmptyDiff(diff(readModel(modelPath), built.model));
  return { code: fails(active) || stale ? 1 : 0, lines };
}

function describeDiff(d: ReturnType<typeof diff>): string {
  const bits = [
    d.tablesAdded.length && `${d.tablesAdded.length} table${d.tablesAdded.length === 1 ? '' : 's'} added`,
    d.tablesRemoved.length && `${d.tablesRemoved.length} removed`,
    d.columnsChanged.length && `${d.columnsChanged.length} column${d.columnsChanged.length === 1 ? '' : 's'} changed`,
    d.edgesAdded.length && `${d.edgesAdded.length} relationship${d.edgesAdded.length === 1 ? '' : 's'} added`,
    d.edgesRemoved.length && `${d.edgesRemoved.length} removed`,
    d.edgesChanged.length && `${d.edgesChanged.length} changed state`,
  ].filter((x): x is string => typeof x === 'string');
  return bits.join(', ') || 'no change';
}

/** `ledgerline model` — write the model file. */
export async function model(options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  writeModel(join(config.root, config.model), built.model);
  return { code: 0, lines: [readSummary(built), `wrote ${config.model}: ${built.model.tables.length} tables, ${built.model.edges.length} relationships`] };
}

/** `ledgerline report` — write the HTML. */
export async function report(options: CommonOptions & { out?: string } = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  const out = options.out ?? config.report;
  // With a query log configured, the window is a claim worth drawing: what it
  // did not touch is faded (ADR-0003 #2). Without one there is no window, so
  // nothing is faded — the repository's own SQL is not a usage sample.
  const usage =
    config.logs.length > 0 ? { touched: expandStars(built.model, built.mentions), window: config.logs.join(', ') } : undefined;
  const html = await renderHtml(built.model, {
    title: 'Ledgerline',
    findings: sortFindings(modelFindings(built.model, config.policy)),
    ...(usage === undefined ? {} : { usage }),
  });
  writeFileSync(join(config.root, out), html);
  return { code: 0, lines: [readSummary(built), `wrote ${out} (${Math.round(html.length / 1024)} kB)`] };
}

/** `ledgerline mermaid` — the README's diagram and the badge line. */
export async function mermaid(options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  return { code: 0, lines: [mermaidFor(built.model), `<!-- ${badgeLine(built.model)} -->`] };
}

/** `ledgerline baseline` — accept today's findings so the gate can go on today. */
export async function baseline(options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  const all = modelFindings(built.model, config.policy);
  const b = makeBaseline(all, new Date().toISOString().slice(0, 10));
  writeFileSync(join(config.root, config.baseline), JSON.stringify(b, null, 2) + '\n');
  return { code: 0, lines: [readSummary(built), `wrote ${config.baseline}: ${b.accepted.length} finding${b.accepted.length === 1 ? '' : 's'} accepted. New ones will fail; these will not.`] };
}

/** `ledgerline explain <substring>` — the evidence chain and the DDL that would close it. */
export async function explain(pattern: string, options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  const all = sortFindings(modelFindings(built.model, config.policy));
  const matches = all.filter((f) => f.sentence.toLowerCase().includes(pattern.toLowerCase()) || f.code === pattern);
  if (matches.length === 0) return { code: 1, lines: [`No finding matches ${JSON.stringify(pattern)}. There ${all.length === 1 ? 'is 1 finding' : `are ${all.length} findings`}.`] };
  const lines: string[] = [];
  for (const f of matches) {
    const e = explainFinding(built.model, f);
    lines.push(`${f.severity}: ${f.sentence}`);
    if (e.cardinality) lines.push(`  ${e.cardinality}`);
    lines.push(`  Evidence (${e.evidence.length}):`);
    for (const v of e.evidence) lines.push(`    ${v.kind} · ${v.at}\n      ${v.text}`);
    if (e.closingDdl.length > 0) {
      lines.push('  This would close it. Put it in a migration; Ledgerline does not run it:');
      for (const d of e.closingDdl) lines.push(d.split('\n').map((l) => `    ${l}`).join('\n'));
    }
  }
  return { code: 0, lines };
}

/** `ledgerline blast <table>` — what a change to it reaches. */
export async function blast(table: string, options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  const ref = table.includes('.') ? { schema: table.split('.')[0]!, name: table.split('.').slice(1).join('.') } : { schema: 'public', name: table };
  const known = built.model.tables.some((t) => tableKey(t) === tableKey(ref)) || built.model.undeclaredTables.some((t) => tableKey(t) === tableKey(ref));
  if (!known) return { code: 1, lines: [`No table ${tableKey(ref)}. The schema has ${built.model.tables.length}.`] };
  const b = blastRadius(built.model, ref);
  const describe = (e: { from: readonly { column: string }[]; to: readonly { column: string }[]; id: string; state: string }): string => `${e.id} (${e.state.replaceAll('_', ' ')})`;
  return {
    code: 0,
    lines: [
      `${tableKey(ref)}: ${b.direct.length} direct relationship${b.direct.length === 1 ? '' : 's'}, ${b.indirect.length} one hop further`,
      ...b.direct.map((e) => `  direct   ${describe(e)}`),
      ...b.indirect.map((e) => `  one hop  ${describe(e)}`),
      b.places.length > 0 ? `Places to look (${b.places.length}):` : 'No query touched any of it.',
      ...b.places.map((p) => `  ${p}`),
    ],
  };
}

/**
 * Expands the stars a query reader could not: `public.users.*` means every
 * column of `public.users`, and the schema is known here even though it was
 * not known where the star was seen.
 */
export function expandStars(model: Model, mentions: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const m of mentions) {
    if (!m.endsWith('.*')) {
      out.add(m);
      continue;
    }
    const key = m.slice(0, -2);
    out.add(key);
    const table = model.tables.find((t) => tableKey(t) === key);
    for (const c of table?.columns ?? []) out.add(`${key}.${c.name}`);
  }
  return out;
}

/**
 * `ledgerline usage [--log FILE]` — ADR-0003 #2.
 *
 * What the window touched, and therefore what it did not. Every sentence here
 * names the window, because *no query read this column* is only ever true of
 * a window: the nightly job that reads it may not have run, and this command
 * has no way to know. It never says drop anything.
 */
export async function usage(options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  const window = config.logs.length > 0 ? config.logs.join(', ') : `the queries in ${config.queries.join(', ')}`;
  const seen = expandStars(built.model, built.mentions);
  const report = usageReport(built.model, seen, window);
  const lines = [
    `Read from ${window}: ${built.statementsParsed} statement${built.statementsParsed === 1 ? '' : 's'} across ${built.sources} source${built.sources === 1 ? '' : 's'}.`,
  ];
  if (built.statementsParsed === 0) {
    return { code: 0, lines: [...lines, 'Nothing was read, so nothing can be said about what is unused.'] };
  }
  lines.push(
    report.unusedTables.length === 0
      ? 'Every table was touched in this window.'
      : `${report.unusedTables.length} table${report.unusedTables.length === 1 ? '' : 's'} no query touched in this window:`,
    ...report.unusedTables.map((t) => `  ${tableKey(t)}`),
    report.unusedColumns.length === 0
      ? 'Every column of every touched table was named in this window.'
      : `${report.unusedColumns.length} column${report.unusedColumns.length === 1 ? '' : 's'} no query named in this window:`,
    ...report.unusedColumns.map((c) => `  ${c.schema}.${c.name}.${c.column}`),
    '',
    'This is a fact about the window, not advice. A column nothing read here may',
    'be read by a job that did not run, a report nobody ran, or a human at a psql',
    'prompt. Widen the window before you believe it.',
  );
  return { code: 0, lines };
}

/** `ledgerline history [table]` — when each table and column arrived, from the migration files. */
export async function history(table: string | null, options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const dirs = config.migrations.map((d) => join(config.root, d)).filter((d) => existsSync(d));
  if (dirs.length === 0) return { code: 1, lines: ['No migrations directory. History is read from the files, and there are none.'] };
  const events = (await Promise.all(dirs.map(historyOfDirectory))).flat();
  const wanted = table === null ? events : events.filter((e) => e.table === (table.includes('.') ? table : `public.${table}`));
  if (wanted.length === 0) return { code: 1, lines: [table === null ? 'No migration changed anything.' : `No migration mentions ${table}.`] };
  const lines: string[] = [];
  let last = '';
  for (const e of wanted) {
    if (e.migration !== last) {
      lines.push(e.migration);
      last = e.migration;
    }
    lines.push(`  ${e.kind.replaceAll('_', ' ').padEnd(15)} ${e.table}${e.detail ? `  ${e.detail}` : ''}`);
  }
  return { code: 0, lines };
}

/**
 * `ledgerline pr` — the pull-request comment: a sentence first (#11).
 *
 * The reviewer on a phone reads the first line; the diagram and the detail
 * follow for the reviewer at a desk. Compares the committed model file
 * against the recomputed one, which is what the base branch and the head of
 * a pull request are.
 */
export async function prComment(options: CommonOptions = {}): Promise<Outcome> {
  const config = settings(options);
  const built = await buildModel(config, options);
  const modelPath = join(config.root, config.model);
  const previous: Model | null = existsSync(modelPath) ? readModel(modelPath) : null;
  const all = sortFindings(modelFindings(built.model, config.policy));
  const baselineFile = readBaseline(join(config.root, config.baseline));
  const active = baselineFile ? againstBaseline(all, baselineFile).fresh : all;
  const failing = active.filter((f) => f.severity === 'fail');

  const headline =
    failing.length > 0
      ? `**${failing.length} relationship${failing.length === 1 ? '' : 's'} the code relies on ${failing.length === 1 ? 'is' : 'are'} not declared.**`
      : active.length > 0
        ? `**No failures. ${active.length} thing${active.length === 1 ? '' : 's'} worth a look.**`
        : '**The schema declares every relationship the queries rely on.**';

  const lines = [headline, ''];
  for (const f of active.slice(0, 10)) lines.push(`- ${f.severity === 'fail' ? '**fail**' : f.severity}: ${f.sentence}`);
  if (active.length > 10) lines.push(`- …and ${active.length - 10} more`);

  if (previous) {
    const d = diff(previous, built.model);
    lines.push('', '<details><summary>What this change did to the schema</summary>', '');
    lines.push(isEmptyDiff(d) ? 'Nothing.' : describeDiff(d));
    for (const t of d.tablesAdded) lines.push(`- added table \`${tableKey(t)}\``);
    for (const t of d.tablesRemoved) lines.push(`- removed table \`${tableKey(t)}\``);
    for (const c of d.columnsChanged) lines.push(`- ${c.before === null ? 'added' : c.after === null ? 'removed' : 'changed'} \`${tableKey(c.table)}.${c.column}\`${c.before && c.after ? ` (${c.before.type} → ${c.after.type})` : ''}`);
    for (const e of d.edgesChanged) lines.push(`- \`${e.edge.id}\` was ${e.before.replaceAll('_', ' ')}, is now ${e.after.replaceAll('_', ' ')}`);
    lines.push('', '</details>');
  }
  lines.push('', `<sub>${badgeLine(built.model)} · ${readSummary(built)}</sub>`);
  return { code: failing.length > 0 ? 1 : 0, lines };
}

export { serializeModel };
