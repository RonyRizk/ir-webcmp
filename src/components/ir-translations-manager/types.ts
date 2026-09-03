export interface TranslationLanguage {
  code: string;
  name: string;
  /** The reference language authors write against. Exactly one language carries this flag. */
  isSource?: boolean;
}

/**
 * Backend bookkeeping carried by an entry loaded from Setup, preserved so an
 * edit round-trips through Edit_Setup without silently resetting flags
 * (e.g. turning a system-protected label into a regular deletable one).
 */
export interface TranslationEntryMeta {
  ownerId: number;
  isSystem: boolean;
  isDeleteable: boolean;
  isUpdateable: boolean;
  isVisible: boolean;
  /** Soft-deleted in Setup — Get_Setup_Entries_By_TBL_NAME still returns these rows rather than filtering them out. */
  isDeleted: boolean;
  displayOrder: number;
  notes: string;
  invariantValue: string | null;
  /** ISO timestamp from the last write — preserved so unrelated saves (reorder, delete) don't bump it. */
  entryDate: string;
}

export interface TranslationEntry {
  id: string;
  key: string;
  /** Setup table this row belongs to. Absent for entries created locally that haven't been saved yet. */
  tableName?: string;
  /** Translated value per language code. */
  values: Record<string, string>;
  /** Absent for entries created locally that haven't been saved yet. */
  meta?: TranslationEntryMeta;
}

export interface TranslationTable {
  id: string;
  name: string;
  entries: TranslationEntry[];
}

/**
 * How many setup tables share one entry's description, and which ones — derived
 * from Get_Duplicated_Setup_Entries_Across_Tables, which groups by DESCRIPTION
 * rather than by row.
 */
export interface DuplicateInfo {
  occurrences: number;
  tables: string[];
}

/** Which rows the entries table shows, based on translation completeness or visibility. */
export type EntryStatusFilter = 'all' | 'missing' | 'complete' | 'hidden';

/** Payload shared by the create and edit flows of the entry drawer. */
export interface TranslationEntryDraft {
  /** Present when editing an existing entry, absent when creating one. */
  id?: string;
  key: string;
  values: Record<string, string>;
}
