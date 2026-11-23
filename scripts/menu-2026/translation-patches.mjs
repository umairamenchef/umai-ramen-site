/**
 * UMAÏ Ramen: field-level Sanity patches for the EN / DE / IT / ZH menu translations (Phase 14).
 *
 * Pure planners: no I/O, no network, no Sanity client. apply-translations.mjs reads Sanity, calls these
 * functions, then writes. Their only import is translation-rules.mjs (translatableFields, TRANSLATION_LOCALES).
 *
 * FIELD-LEVEL ONLY. A translation is written as a `set` patch on ONE locale key of an m26 document
 * (`name.en`, `description.zh`, `prices[_key=="v0"].label.it`, ...). Nothing in this module plans a
 * whole-document write (createOrReplace) or a delete. Why: since Phase 12 the owner edits the menu in
 * Studio; rebuilding the m26 documents from menu-2026.json would silently discard every Studio edit made
 * since then (the 12-VERIFICATION DRIFT caveat). A field-level set touches exactly the keys listed in the
 * plan, and every patch carries the `_rev` the plan was computed from, so apply-translations.mjs can guard
 * it with ifRevisionId (a document edited meanwhile makes the whole transaction fail, nothing written).
 *
 *   patchTargets(menu)                                -> [{ docId, sanityPath, path, fr, values }]
 *   readLocaleObject(doc, sanityPath)                 -> the Loc object of a Sanity document, or undefined
 *   planTranslationPatches(menu, docs, opts)          -> { patches, conflicts, frDrift, drafts, missingDocs, counts }
 *   planTranslationRollback(backupDocs, currentDocs)  -> { patches, counts }
 *   stripTranslations(doc)                            -> deep copy without _rev, _updatedAt and en/de/it/zh
 *
 * Sanity paths: category fields `name | description | footnote`, item fields `name | description | subgroup`,
 * a price label `prices[_key=="v<i>"].label` where v<i> is the variant's index in the JSON prices array (the
 * _key sync-menu.mjs gave it).
 */
import { TRANSLATION_LOCALES, translatableFields } from './translation-rules.mjs';

/** Loc fields that sit directly on a document. */
const LOC_FIELDS = ['name', 'description', 'footnote', 'subgroup'];
const LABEL_PATH = /^prices\[_key=="([^"]+)"\]\.label$/;
const DRAFT_PREFIX = 'drafts.';
const VERSION_PREFIX = 'versions.';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonBlank = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Every translatable field of the menu, mapped to the Sanity document and field it lives in, in print order.
 * `values` holds the non-blank en / de / it / zh strings of the field (never the French text); `fr` is the
 * French text exactly as in the JSON (the plan compares it to Sanity's French to detect drift).
 */
export function patchTargets(menu) {
  return translatableFields(menu).map((field) => {
    const values = {};
    for (const locale of TRANSLATION_LOCALES) {
      if (isNonBlank(field.value[locale])) values[locale] = field.value[locale];
    }
    return {
      docId: field.scope === 'category' ? `m26-cat-${field.catKey}` : `m26-item-${field.key}`,
      sanityPath: field.field === 'label' ? `prices[_key=="v${field.index}"].label` : field.field,
      path: field.path,
      fr: field.value.fr,
      values,
    };
  });
}

/** The Loc object (`{ _type, fr, en, ... }`) a Sanity path points to in a document, or undefined. */
export function readLocaleObject(doc, sanityPath) {
  if (!isObj(doc) || typeof sanityPath !== 'string') return undefined;
  const label = LABEL_PATH.exec(sanityPath);
  let value;
  if (label) {
    const variant = Array.isArray(doc.prices) ? doc.prices.find((v) => isObj(v) && v._key === label[1]) : undefined;
    value = variant?.label;
  } else if (LOC_FIELDS.includes(sanityPath)) {
    value = doc[sanityPath];
  }
  return isObj(value) ? value : undefined;
}

/**
 * Plan the field-level `set` patches that write the menu's translations onto the Sanity documents.
 *
 * `docs`: the m26 documents as read from Sanity (raw perspective: published and `drafts.` documents).
 * Per field and locale (only locales with a non-blank value in the menu are considered):
 *   - Sanity's French differs from the JSON French, or the Loc / price variant is missing in the document
 *       -> frDrift { id, path, sanity, json }, nothing set for that field (the French was edited in Studio);
 *   - an identical translation already exists -> skip (idempotent re-run);
 *   - a different non-blank translation exists -> conflicts { id, path, locale, current, wanted }, not set,
 *       unless overwriteExisting (then it is set and still listed);
 *   - absent, blank or not a string -> set `<sanityPath>.<locale>`.
 * A target document missing from `docs` -> missingDocs (published id). An open `drafts.<id>` of a target ->
 * `drafts` (always listed); it is patched too, with its own `_rev`, only when includeDrafts is true.
 * Documents that are not targets (and `versions.` documents) are ignored. Inputs are never mutated.
 */
export function planTranslationPatches(menu, docs, { overwriteExisting = false, includeDrafts = false } = {}) {
  const published = new Map();
  const drafts = new Map();
  for (const doc of Array.isArray(docs) ? docs : []) {
    if (!isObj(doc) || typeof doc._id !== 'string') continue;
    if (doc._id.startsWith(DRAFT_PREFIX)) drafts.set(doc._id.slice(DRAFT_PREFIX.length), doc);
    else if (!doc._id.startsWith(VERSION_PREFIX)) published.set(doc._id, doc);
  }

  const targetsByDoc = new Map(); // docId -> targets, documents in order of first appearance
  for (const target of patchTargets(menu)) {
    if (!targetsByDoc.has(target.docId)) targetsByDoc.set(target.docId, []);
    targetsByDoc.get(target.docId).push(target);
  }

  const plan = { patches: [], conflicts: [], frDrift: [], drafts: [], missingDocs: [], counts: null };
  let setCount = 0;
  let skip = 0;

  const planDocument = (doc, targets) => {
    const set = {};
    for (const target of targets) {
      const locales = TRANSLATION_LOCALES.filter((l) => target.values[l] !== undefined);
      if (locales.length === 0) continue;
      const loc = readLocaleObject(doc, target.sanityPath);
      if (!loc || loc.fr !== target.fr) {
        plan.frDrift.push({ id: doc._id, path: target.sanityPath, sanity: loc?.fr, json: target.fr });
        continue;
      }
      for (const locale of locales) {
        const wanted = target.values[locale];
        const current = loc[locale];
        if (isNonBlank(current)) {
          if (current === wanted) {
            skip += 1;
            continue;
          }
          plan.conflicts.push({ id: doc._id, path: target.sanityPath, locale, current, wanted });
          if (!overwriteExisting) continue;
        }
        set[`${target.sanityPath}.${locale}`] = wanted;
      }
    }
    const n = Object.keys(set).length;
    if (n > 0) {
      plan.patches.push({ id: doc._id, rev: doc._rev, set });
      setCount += n;
    }
  };

  for (const [docId, targets] of targetsByDoc) {
    const doc = published.get(docId);
    if (doc) planDocument(doc, targets);
    else plan.missingDocs.push(docId);
    const draft = drafts.get(docId);
    if (draft) {
      plan.drafts.push(draft._id);
      if (includeDrafts) planDocument(draft, targets);
    }
  }

  plan.counts = {
    docs: targetsByDoc.size,
    patched: plan.patches.length,
    set: setCount,
    skip,
    conflicts: plan.conflicts.length,
    frDrift: plan.frDrift.length,
    drafts: plan.drafts.length,
    missingDocs: plan.missingDocs.length,
  };
  return plan;
}

/** `{ path, loc }` for every Loc of a document: name, description, footnote, subgroup and each labelled variant. */
function locsOf(doc) {
  const out = [];
  for (const field of LOC_FIELDS) if (isObj(doc[field])) out.push({ path: field, loc: doc[field] });
  for (const variant of Array.isArray(doc.prices) ? doc.prices : []) {
    if (isObj(variant) && isObj(variant.label) && typeof variant._key === 'string' && !variant._key.includes('"')) {
      out.push({ path: `prices[_key=="${variant._key}"].label`, loc: variant.label });
    }
  }
  return out;
}

/**
 * Plan the patches that put the en / de / it / zh values of a backup back on the current documents, for every
 * document present in both. Per Loc of the backup document and per locale: the backup holds a string that
 * differs from the current value -> `set` it; the backup holds none but the current document has one ->
 * `unset` it; equal -> nothing. Documents (or Locs) present on one side only are ignored. Every key ends with
 * .en .de .it or .zh: French and every other field are never touched.
 */
export function planTranslationRollback(backupDocs, currentDocs) {
  const current = new Map();
  for (const doc of Array.isArray(currentDocs) ? currentDocs : []) if (isObj(doc) && typeof doc._id === 'string') current.set(doc._id, doc);

  const patches = [];
  let setCount = 0;
  let unsetCount = 0;
  for (const backup of Array.isArray(backupDocs) ? backupDocs : []) {
    const now = isObj(backup) ? current.get(backup._id) : undefined;
    if (!now) continue;
    const set = {};
    const unset = [];
    for (const { path, loc: before } of locsOf(backup)) {
      const after = readLocaleObject(now, path);
      if (!after) continue;
      for (const locale of TRANSLATION_LOCALES) {
        const key = `${path}.${locale}`;
        const wanted = before[locale];
        if (typeof wanted === 'string') {
          if (after[locale] !== wanted) set[key] = wanted;
        } else if (wanted == null && after[locale] != null) {
          unset.push(key);
        }
      }
    }
    const nSet = Object.keys(set).length;
    if (nSet === 0 && unset.length === 0) continue;
    const patch = { id: backup._id };
    if (nSet > 0) patch.set = set;
    if (unset.length > 0) patch.unset = unset;
    patches.push(patch);
    setCount += nSet;
    unsetCount += unset.length;
  }
  return { patches, counts: { docs: patches.length, set: setCount, unset: unsetCount } };
}

/**
 * Deep copy of a document without what a translation write changes: `_rev`, `_updatedAt` and the en / de / it /
 * zh keys of name, description, footnote, subgroup and every prices[].label. Two snapshots of a document taken
 * before and after apply-translations.mjs must be equal once stripped; any difference is a change outside the
 * translations. The input is never mutated.
 */
export function stripTranslations(doc) {
  if (!isObj(doc)) return doc;
  const copy = structuredClone(doc);
  delete copy._rev;
  delete copy._updatedAt;
  const strip = (loc) => {
    if (isObj(loc)) for (const locale of TRANSLATION_LOCALES) delete loc[locale];
  };
  for (const field of LOC_FIELDS) strip(copy[field]);
  for (const variant of Array.isArray(copy.prices) ? copy.prices : []) if (isObj(variant)) strip(variant.label);
  return copy;
}
