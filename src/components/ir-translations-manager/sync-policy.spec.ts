import type { EditSetupParams } from '@/services/setup';
import type { DuplicateSyncPlan } from './duplicate-sync';
import { getSyncPrompt, narrowSyncPlan } from './sync-policy';
import type { TranslationEntry } from './types';
import { buildDuplicateMap } from './utils';

describe('duplicate scan', () => {
  it('counts rows in _EMAIL_LABELS and _FD_LABELS as duplicates even though no screen reads them', () => {
    const map = buildDuplicateMap([
      {
        DESCRIPTION: 'Arrival',
        OCCURRENCES: 3,
        ENTRIES: [
          { TBL_NAME: '_ARRIVAL_TIME', CODE_NAME: 'Lcz_Arrival' },
          { TBL_NAME: '_EMAIL_LABELS', CODE_NAME: 'Lcz_EmailArrival' },
          { TBL_NAME: '_FD_LABELS', CODE_NAME: 'Lcz_FdArrival' },
        ],
      },
    ]);

    expect(map.get('_ARRIVAL_TIME::Lcz_Arrival')?.siblings).toEqual([
      { tableName: '_EMAIL_LABELS', key: 'Lcz_EmailArrival' },
      { tableName: '_FD_LABELS', key: 'Lcz_FdArrival' },
    ]);
    expect(map.get('_EMAIL_LABELS::Lcz_EmailArrival')?.tables).toEqual(['_ARRIVAL_TIME', '_FD_LABELS']);
  });
});

describe('sync prompt', () => {
  it('asks a yes/no question when the edited row lives in a guarded table and has duplicates', () => {
    expect(getSyncPrompt('_EMAIL_LABELS', [{ tableName: '_ARRIVAL_TIME' }, { tableName: '_FD_LABELS' }])).toEqual({ kind: 'confirm' });
  });

  it('offers a checkbox per guarded table holding a duplicate of a regular row', () => {
    expect(getSyncPrompt('_ARRIVAL_TIME', [{ tableName: '_HK_FRONT' }, { tableName: '_FD_LABELS' }, { tableName: '_EMAIL_LABELS' }, { tableName: '_FD_LABELS' }])).toEqual({
      kind: 'choose',
      tables: ['_EMAIL_LABELS', '_FD_LABELS'],
    });
  });

  it('does not ask when no guarded table is involved', () => {
    expect(getSyncPrompt('_ARRIVAL_TIME', [{ tableName: '_HK_FRONT' }])).toEqual({ kind: 'none' });
  });

  it('does not ask when a guarded row has nothing to sync', () => {
    expect(getSyncPrompt('_FD_LABELS', [])).toEqual({ kind: 'none' });
  });
});

/** A plan touching one row per table, each write tagged with its table so the pairing can be checked. */
function planFor(...tables: string[]): DuplicateSyncPlan {
  return {
    entries: tables.map(tableName => ({ id: `${tableName}::Lcz_X`, key: 'Lcz_X', tableName, values: { en: 'X' } }) as TranslationEntry),
    params: tables.map(TBL_NAME => ({ TBL_NAME, CODE_NAME: 'Lcz_X' }) as EditSetupParams),
  };
}

describe('narrowing the sync plan to the answer', () => {
  it('keeps unguarded duplicates and only the guarded tables that were ticked', () => {
    const narrowed = narrowSyncPlan(planFor('_HK_FRONT', '_FD_LABELS', '_EMAIL_LABELS'), { kind: 'tables', tables: ['_FD_LABELS'] });

    expect(narrowed.entries.map(entry => entry.tableName)).toEqual(['_HK_FRONT', '_FD_LABELS']);
    expect(narrowed.params.map(param => param.TBL_NAME)).toEqual(['_HK_FRONT', '_FD_LABELS']);
  });

  it('writes no duplicates when the user declines syncing a guarded row', () => {
    expect(narrowSyncPlan(planFor('_HK_FRONT', '_EMAIL_LABELS'), { kind: 'none' })).toEqual({ entries: [], params: [] });
  });
});
