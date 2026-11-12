import type { DuplicateSyncPlan } from './duplicate-sync';

/**
 * Tables whose rows are read outside this codebase (email templates, fiscal documents).
 * They take part in duplicate detection, but a language edit only crosses into or out
 * of them once the user has agreed to it.
 */
export const SYNC_GUARDED_TABLES: readonly string[] = ['_EMAIL_LABELS', '_FD_LABELS'];

export const SYNC_GUARDED_TABLE_SET: ReadonlySet<string> = new Set(SYNC_GUARDED_TABLES);

/** What, if anything, to ask before a language edit is copied to the row's duplicates. */
export type SyncPrompt =
  /** Nothing guarded is involved — duplicates are synced without asking. */
  | { kind: 'none' }
  /** The edited row lives in a guarded table — sync to every duplicate, or to none. */
  | { kind: 'confirm' }
  /** A regular row with duplicates in guarded `tables` — one checkbox each; unguarded duplicates are always synced. */
  | { kind: 'choose'; tables: string[] };

/**
 * `targets` are the duplicates that would actually change. Anything else in the
 * edited row's own table is irrelevant here — duplicates never include it.
 */
export function getSyncPrompt(editedTable: string | undefined, targets: { tableName?: string }[]): SyncPrompt {
  if (targets.length > 0 && SYNC_GUARDED_TABLE_SET.has(editedTable)) {
    return { kind: 'confirm' };
  }
  const guarded = [...new Set(targets.map(target => target.tableName).filter(name => SYNC_GUARDED_TABLE_SET.has(name)))].sort();
  if (guarded.length > 0) {
    return { kind: 'choose', tables: guarded };
  }
  return { kind: 'none' };
}

/** The user's reply to a `SyncPrompt`. */
export type SyncAnswer =
  /** Sync every duplicate — also what a `none` prompt implies. */
  | { kind: 'all' }
  /** Sync nothing — only the edited row is written. */
  | { kind: 'none' }
  /** Sync every unguarded duplicate, plus those in the guarded `tables` that were ticked. */
  | { kind: 'tables'; tables: string[] };

/** Drops the writes the answer rules out, keeping `params` paired index-for-index with `entries`. */
export function narrowSyncPlan(plan: DuplicateSyncPlan, answer: SyncAnswer): DuplicateSyncPlan {
  const keep = (tableName: string | undefined) => {
    if (answer.kind === 'tables') {
      return !SYNC_GUARDED_TABLE_SET.has(tableName) || answer.tables.includes(tableName);
    }
    return answer.kind === 'all';
  };
  const kept = plan.entries.map(entry => keep(entry.tableName));
  return { entries: plan.entries.filter((_, index) => kept[index]), params: plan.params.filter((_, index) => kept[index]) };
}
