/**
 * Schema archaeology (ADR-0003 #7).
 *
 * Walks the migration files in order and records, per table, when it was
 * created, when each column arrived or left, and when a constraint was added
 * or dropped — from the files, not from the database, because the database
 * has no memory of when. The "when" is the migration's name, which is what a
 * person looks for; timestamps in those names are theirs to read.
 */

import type { DeclaredSchema } from '@ledgerline/model';
import { SchemaBuilder } from '@ledgerline/parse';

import { listMigrations, type MigrationFile } from './migrations.ts';

export type EventKind = 'table_created' | 'table_dropped' | 'column_added' | 'column_dropped' | 'column_retyped' | 'key_added' | 'key_dropped' | 'unique_added' | 'fk_added' | 'fk_dropped';

export interface HistoryEvent {
  readonly migration: string;
  readonly kind: EventKind;
  readonly table: string;
  readonly detail: string;
}

const key = (t: { schema: string; name: string }): string => `${t.schema}.${t.name}`;

function snapshot(s: DeclaredSchema): Map<string, { columns: Map<string, string>; pk: string; uniques: string; fks: Set<string> }> {
  const out = new Map<string, { columns: Map<string, string>; pk: string; uniques: string; fks: Set<string> }>();
  for (const t of s.tables) {
    out.set(key(t), {
      columns: new Map(t.columns.map((c) => [c.name, `${c.type}${c.nullable ? '' : ' not null'}`])),
      pk: t.primaryKey.join('+'),
      uniques: t.uniques.map((u) => u.join('+')).sort().join(','),
      fks: new Set(),
    });
  }
  for (const f of s.foreignKeys) {
    const t = f.from[0] ? key(f.from[0]) : '';
    out.get(t)?.fks.add(`${f.name}: ${f.from.map((c) => c.column).join('+')} → ${f.to[0] ? key(f.to[0]) : '?'}.${f.to.map((c) => c.column).join('+')}`);
  }
  return out;
}

/** Every change each migration made, in order. */
export async function historyOf(files: readonly MigrationFile[]): Promise<HistoryEvent[]> {
  const builder = new SchemaBuilder();
  let before = snapshot({ tables: [], foreignKeys: [] });
  const events: HistoryEvent[] = [];
  for (const f of files) {
    await builder.apply(f.sql, f.name);
    const after = snapshot(builder.build());
    for (const [t, state] of after) {
      const was = before.get(t);
      if (!was) {
        events.push({ migration: f.name, kind: 'table_created', table: t, detail: `${state.columns.size} columns${state.pk ? `, key ${state.pk}` : ', no primary key'}` });
        for (const fk of state.fks) events.push({ migration: f.name, kind: 'fk_added', table: t, detail: fk });
        continue;
      }
      for (const [c, type] of state.columns) {
        const old = was.columns.get(c);
        if (old === undefined) events.push({ migration: f.name, kind: 'column_added', table: t, detail: `${c} ${type}` });
        else if (old !== type) events.push({ migration: f.name, kind: 'column_retyped', table: t, detail: `${c}: ${old} → ${type}` });
      }
      for (const c of was.columns.keys()) if (!state.columns.has(c)) events.push({ migration: f.name, kind: 'column_dropped', table: t, detail: c });
      if (state.pk !== was.pk) events.push({ migration: f.name, kind: state.pk ? 'key_added' : 'key_dropped', table: t, detail: state.pk || was.pk });
      if (state.uniques !== was.uniques && state.uniques.length > was.uniques.length) events.push({ migration: f.name, kind: 'unique_added', table: t, detail: state.uniques });
      for (const fk of state.fks) if (!was.fks.has(fk)) events.push({ migration: f.name, kind: 'fk_added', table: t, detail: fk });
      for (const fk of was.fks) if (!state.fks.has(fk)) events.push({ migration: f.name, kind: 'fk_dropped', table: t, detail: fk });
    }
    for (const t of before.keys()) if (!after.has(t)) events.push({ migration: f.name, kind: 'table_dropped', table: t, detail: '' });
    before = after;
  }
  return events;
}

export async function historyOfDirectory(dir: string): Promise<HistoryEvent[]> {
  return historyOf(listMigrations(dir));
}
