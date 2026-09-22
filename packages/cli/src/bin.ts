#!/usr/bin/env node
/**
 * The command line. Parses argv, calls a command, prints its lines, exits
 * with its code. Every decision is in `commands.ts`; this file is plumbing.
 */

import pc from 'picocolors';

import { baseline, blast, check, explain, history, mermaid, model, prComment, report } from './commands.ts';

const USAGE = `ledgerline — the diagram of your database derived from what your code actually does

  ledgerline check [--write] [--database-url URL]   recompute and fail on drift
  ledgerline model [--database-url URL]             write ledgerline.model.json
  ledgerline report [--out FILE]                    write the HTML report
  ledgerline mermaid                                print an erDiagram for the README
  ledgerline baseline                               accept today's findings so the gate can go on today
  ledgerline explain <text>                         the evidence, and the DDL that would close it
  ledgerline blast <table>                          what a change to it reaches
  ledgerline history [table]                        when each table and column arrived
  ledgerline pr                                     the pull-request comment, a sentence first

Options
  --root DIR           the repository root (default: the working directory)
  --database-url URL   read the declared schema from a live database instead of the files
  --no-color           plain output
`;

function paint(line: string): string {
  return line
    .replace(/^(\s*)fail:/, (_, s: string) => `${s}${pc.red('fail:')}`)
    .replace(/^(\s*)warn:/, (_, s: string) => `${s}${pc.yellow('warn:')}`)
    .replace(/^(\s*)info:/, (_, s: string) => `${s}${pc.dim('info:')}`);
}

export async function run(argv: readonly string[]): Promise<number> {
  const args = [...argv];
  const flag = (name: string): boolean => {
    const i = args.indexOf(`--${name}`);
    if (i < 0) return false;
    args.splice(i, 1);
    return true;
  };
  const value = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`);
    if (i < 0) return undefined;
    const v = args[i + 1];
    args.splice(i, 2);
    return v;
  };

  if (flag('help') || flag('h') || args.length === 0) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (flag('version')) {
    process.stdout.write('0.1.0\n');
    return 0;
  }
  const plain = flag('no-color');
  const write = flag('write');
  const root = value('root');
  const databaseUrl = value('database-url') ?? process.env['LEDGERLINE_DATABASE_URL'];
  const out = value('out');
  const command = args.shift();

  const common = { ...(root === undefined ? {} : { root }), ...(databaseUrl === undefined ? {} : { databaseUrl }) };
  let outcome;
  try {
    switch (command) {
      case 'check':
        outcome = await check({ ...common, write });
        break;
      case 'model':
        outcome = await model(common);
        break;
      case 'report':
        outcome = await report({ ...common, ...(out === undefined ? {} : { out }) });
        break;
      case 'mermaid':
        outcome = await mermaid(common);
        break;
      case 'baseline':
        outcome = await baseline(common);
        break;
      case 'explain':
        outcome = args[0] ? await explain(args[0], common) : { code: 1, lines: ['explain needs something to look for: ledgerline explain "orders.user_id"'] };
        break;
      case 'blast':
        outcome = args[0] ? await blast(args[0], common) : { code: 1, lines: ['blast needs a table: ledgerline blast users'] };
        break;
      case 'history':
        outcome = await history(args[0] ?? null, common);
        break;
      case 'pr':
        outcome = await prComment(common);
        break;
      default:
        process.stderr.write(`ledgerline: no command ${JSON.stringify(command)}\n\n${USAGE}`);
        return 64;
    }
  } catch (e) {
    process.stderr.write(`ledgerline: ${e instanceof Error ? e.message : String(e)}\n`);
    return 70;
  }
  const text = outcome.lines.join('\n');
  process.stdout.write((plain ? text : text.split('\n').map(paint).join('\n')) + '\n');
  return outcome.code;
}

const isMain = process.argv[1] !== undefined && (import.meta.url.endsWith(process.argv[1].replace(/^.*?(?=\/)/, '')) || import.meta.url === `file://${process.argv[1]}`);
if (isMain) {
  process.exitCode = await run(process.argv.slice(2));
}
