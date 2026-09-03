import { IEntries } from '@/models/property';
import { SvcCategory } from '@/types/enums';
import { getEntryValue } from '@/utils/utils';

/** A `NOTES` value counts as a group-code reference (not a free-text description) when it's shaped like a setup-entry code. */
const GROUP_CODE_PATTERN = /^[a-z0-9_]{2,10}$/i;

/** Friendlier titles for known group codes that don't have their own `svc_category` row to source a `CODE_VALUE_EN` from. */
const KNOWN_GROUP_LABELS: Record<string, string> = { [SvcCategory.Accommodation]: 'Accommodation' };

export interface SvcCategoryGroup {
  code: string;
  label: string;
  categories: IEntries[];
}

/** Whether a `NOTES` value references another category as its parent group, rather than being a free-text description. */
function isGroupCodeReference(notes: string | null | undefined): boolean {
  const trimmed = notes?.trim();
  return !!trimmed && GROUP_CODE_PATTERN.test(trimmed);
}

/** Minimal placeholder entry for a group code referenced by children but with no `svc_category` row of its own (e.g. `Accommodation`). */
function createGroupPlaceholderEntry(code: string): IEntries {
  const label = KNOWN_GROUP_LABELS[code] ?? code;
  return {
    CODE_NAME: code,
    CODE_VALUE_AR: '',
    CODE_VALUE_DE: '',
    CODE_VALUE_EL: '',
    CODE_VALUE_EN: label,
    CODE_VALUE_FR: '',
    CODE_VALUE_HE: '',
    CODE_VALUE_PL: '',
    CODE_VALUE_RU: '',
    CODE_VALUE_UA: '',
    DISPLAY_ORDER: 0,
    ENTRY_DATE: '',
    ENTRY_USER_ID: 0,
    INVARIANT_VALUE: null,
    ISDELETEABLE: false,
    ISDELETED: false,
    ISSYSTEM: false,
    ISUPDATEABLE: false,
    ISVISIBLE: true,
    NOTES: '',
    OWNER_ID: 0,
    TBL_NAME: '_SVC_CATEGORY',
  };
}

/**
 * Top-level `svc_category` entries: those whose `NOTES` does *not* reference another category as a
 * parent group (e.g. Spa's "Treatments, fitness, and wellness programs" is free text, so it stays
 * top-level; Breakfast's `NOTES` of Accommodation` is shaped like a code, so it's a sub-category instead).
 *
 * When a referenced parent group (e.g. `Accommodation`) has no `svc_category` row of its own, a placeholder
 * entry is synthesized in its place — selectable as a generic parent category (e.g.
 * "Accommodation extras") even though its individual sub-categories aren't shown standalone. The
 * placeholder is inserted where its first child appears, keeping source order.
 */
export function getTopLevelSvcCategories(categories: IEntries[]): IEntries[] {
  const byCode = new Map(categories.map(entry => [entry.CODE_NAME, entry]));
  const seenGroupCodes = new Set<string>();
  const result: IEntries[] = [];

  categories.forEach(category => {
    const groupCode = category.NOTES?.trim();
    if (!isGroupCodeReference(groupCode)) {
      result.push(category);
      return;
    }
    if (byCode.has(groupCode) || seenGroupCodes.has(groupCode)) return;
    seenGroupCodes.add(groupCode);
    result.push(createGroupPlaceholderEntry(groupCode));
  });

  return result;
}

/**
 * Groups `svc_category` entries by their `NOTES` field: an entry belongs to a group when its
 * `NOTES` is shaped like a category code (e.g. Breakfast's `NOTES` is `Accommodation`, so it's keyed under
 * group `Accommodation`) rather than free text. The group itself doesn't need its own row in `svc_category`
 * — the set of entries sharing a `NOTES` value is what defines the group; when a row for that code
 * *does* exist, its `CODE_VALUE_*` becomes the group label, otherwise a known fallback (or the raw
 * code) is used.
 *
 * A single pass over `categories` (assumed API/DISPLAY_ORDER-sorted) appends each entry straight
 * into its resolved group, so groups keep source order instead of being re-sorted afterward.
 *
 * Returns a `Map` keyed by group code so a specific group's sub-categories can be looked up
 * directly, e.g. `groupSvcCategoriesByParent(categories).get('Accommodation')`.
 */
export function groupSvcCategoriesByParent(categories: IEntries[], language: string = 'en'): Map<string, SvcCategoryGroup> {
  const byCode = new Map(categories.map(entry => [entry.CODE_NAME, entry]));
  const groups = new Map<string, SvcCategoryGroup>();

  categories.forEach(entry => {
    const groupCode = entry.NOTES?.trim();
    if (!isGroupCodeReference(groupCode)) return;

    const group = groups.get(groupCode);
    if (group) {
      group.categories.push(entry);
      return;
    }

    const groupEntry = byCode.get(groupCode);
    groups.set(groupCode, {
      code: groupCode,
      label: groupEntry ? getEntryValue({ entry: groupEntry, language }) : (KNOWN_GROUP_LABELS[groupCode] ?? groupCode),
      categories: [entry],
    });
  });

  return groups;
}
