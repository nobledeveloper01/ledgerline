/**
 * `ledgerline.model.json` — the model on disk, committed beside the code.
 *
 * Canonical: sorted keys, stable ids, two-space indent, one trailing newline,
 * so a diff of the file is a diff of the model and nothing else. Versioned,
 * so a file written by an older tool is refused with a sentence rather than
 * misread.
 */

import { readFileSync, writeFileSync } from 'node:fs';

import type { Model } from '@ledgerline/model';

export const MODEL_FILE = 'ledgerline.model.json';
export const FORMAT_VERSION = 1;

interface OnDisk {
  readonly format: number;
  readonly model: Model;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canonical(o[k])]));
  }
  return value;
}

export function serializeModel(model: Model): string {
  const disk: OnDisk = { format: FORMAT_VERSION, model };
  return JSON.stringify(canonical(disk), null, 2) + '\n';
}

export function writeModel(path: string, model: Model): void {
  writeFileSync(path, serializeModel(model));
}

export function readModel(path: string): Model {
  const disk = JSON.parse(readFileSync(path, 'utf8')) as Partial<OnDisk>;
  if (disk.format !== FORMAT_VERSION) {
    throw new Error(`${path}: format ${String(disk.format)} is not ${FORMAT_VERSION}; regenerate it with ledgerline model`);
  }
  if (!disk.model) throw new Error(`${path}: no model in the file`);
  return disk.model;
}
