'use server';

/**
 * Server Actions for /ig-studio — auth-gated, write to ig-studio JSON stores.
 * Never imported from client components (only called as server actions).
 */

import { writeFileSync, renameSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

import { requireStudioAuth } from '@/lib/ig-studio/auth';
import {
  isValidPhotoId,
  readClassification,
  readCaptions,
  CLASSIFICATION_PATH,
  CAPTIONS_PATH,
  type IgEntry,
} from '@/lib/ig-studio/data';
import { runIgStudio } from '@/lib/ig-studio/run';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tmpJson(prefix: string, data: unknown): string {
  const p = resolve(tmpdir(), `${prefix}-${randomBytes(6).toString('hex')}.json`);
  writeFileSync(p, JSON.stringify(data, null, 2));
  return p;
}

/**
 * Atomically write a JSON store: write to a temp file in the SAME directory,
 * then renameSync over the target. Prevents data loss / cross-process partial reads.
 */
function writeJsonAtomic(target: string, data: unknown): void {
  const tmp = target + '.tmp-' + randomBytes(6).toString('hex');
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, target);
}

function revalidateStudio(id: string) {
  revalidatePath('/ig-studio');
  revalidatePath('/ig-studio/' + id);
}

/**
 * Serialize read-modify-write of the JSON stores. Each save reads the whole array,
 * mutates one entry, and writes it back; without a lock two concurrent saves (double
 * tap on "Enregistrer & suivant", two tabs) can clobber each other (lost update).
 * An in-process promise chain serializes the critical sections.
 */
let _writeChain: Promise<unknown> = Promise.resolve();
function withWriteLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = _writeChain.then(fn, fn);
  _writeChain = run.then(() => {}, () => {});
  return run as Promise<T>;
}

// ─── Field sanitizers (defence-in-depth: never trust the client payload) ───────
const clamp01 = (v: unknown): number =>
  Number.isFinite(v as number) ? Math.min(1, Math.max(0, v as number)) : 0.5;

const sanitizePrice = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.min(9999, Math.max(0, n));
};

const capStr = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.slice(0, max) : '';

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

// ─── saveOverride ─────────────────────────────────────────────────────────────

export type OverrideFields = {
  dishSlug: string;
  dishName: string;
  price: number | null;
  baseline: string;
  overlayMode: string;
  /** Normalized logo center x in [0,1] — replaces legacy logoPosition enum. */
  logoPosX: number;
  /** Normalized logo center y in [0,1] — replaces legacy logoPosition enum. */
  logoPosY: number;
  logoSize: string;
  showPrice: boolean;
  /** 'auto' | 'light' | 'dark' — default 'auto' (luminance-based auto-contrast) */
  logoColor?: 'auto' | 'light' | 'dark';
};

export async function saveOverride(
  id: string,
  fields: OverrideFields,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireStudioAuth();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  if (!isValidPhotoId(id)) {
    return { ok: false, error: 'invalid photo id' };
  }

  const file = id + '.jpg';

  await withWriteLock(() => {
    const entries = readClassification();
    const idx = entries.findIndex((e) => e.file === file);
    const prior: Partial<IgEntry> = idx >= 0 ? entries[idx] : {};

    const updated: IgEntry = {
      file,
      dishSlug: capStr(fields.dishSlug, 64),
      dishName: capStr(fields.dishName, 120),
      price: sanitizePrice(fields.price),
      baseline: capStr(fields.baseline, 300),
      overlayMode: oneOf(fields.overlayMode, ['photo-only', 'logo-only', 'logo-name'] as const, 'logo-only'),
      logoPosX: clamp01(fields.logoPosX),
      logoPosY: clamp01(fields.logoPosY),
      logoSize: oneOf(fields.logoSize, ['small', 'medium', 'large'] as const, 'medium'),
      showPrice: fields.showPrice === true,
      logoColor: oneOf(fields.logoColor, ['auto', 'light', 'dark'] as const, 'auto'),
      shotType: prior.shotType ?? 'unknown',
      confidence: prior.confidence ?? 0,
      reasoning: prior.reasoning ?? '',
      override: true,
    };

    const next: IgEntry[] =
      idx >= 0
        ? entries.map((e, i) => (i === idx ? updated : e))
        : [...entries, updated];

    next.sort((a, b) => a.file.localeCompare(b.file));
    writeJsonAtomic(CLASSIFICATION_PATH, next);
  });

  revalidateStudio(id);
  return { ok: true };
}

// ─── saveCaption ─────────────────────────────────────────────────────────────

export async function saveCaption(
  id: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireStudioAuth();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  if (!isValidPhotoId(id)) {
    return { ok: false, error: 'invalid photo id' };
  }

  const safeText = capStr(text, 2200); // IG caption hard limit

  await withWriteLock(() => {
    const captions = readCaptions();
    captions[id] = { text: safeText, updatedAt: new Date().toISOString() };
    writeJsonAtomic(CAPTIONS_PATH, captions);
  });

  revalidateStudio(id);
  return { ok: true };
}

// ─── generateCaptionAction ───────────────────────────────────────────────────

export async function generateCaptionAction(
  id: string,
  entry: Partial<IgEntry>,
): Promise<{ ok: boolean; caption?: string; error?: string }> {
  try {
    await requireStudioAuth();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  if (!isValidPhotoId(id)) {
    return { ok: false, error: 'invalid photo id' };
  }

  const file = id + '.jpg';
  const entryWithFile = { ...entry, file };
  const tmpEntry = tmpJson('igcaption-entry', entryWithFile);

  try {
    const result = await runIgStudio(
      ['--env-file=.env', 'src/caption.js', '--photo', id, '--entry-file', tmpEntry],
      { timeoutMs: 45_000 },
    );

    if (result.code !== 0) {
      return { ok: false, error: result.stderr || `exit code ${result.code}` };
    }

    return { ok: true, caption: result.stdout.trim() };
  } catch (err) {
    // runIgStudio rejects on spawn error / timeout — convert to graceful shape.
    return { ok: false, error: String(err) };
  } finally {
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(tmpEntry);
    } catch {
      // best-effort cleanup
    }
  }
}

// ─── regeneratePhoto ─────────────────────────────────────────────────────────

export async function regeneratePhoto(
  id: string,
): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  try {
    await requireStudioAuth();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  if (!isValidPhotoId(id)) {
    return { ok: false, error: 'invalid photo id' };
  }

  let run;
  try {
    run = await runIgStudio(['src/compose.js', '--photo', id], {
      timeoutMs: 90_000,
    });
  } catch (err) {
    // runIgStudio rejects on spawn error / timeout — convert to graceful shape.
    return { ok: false, error: String(err) };
  }

  if (run.code !== 0) {
    return { ok: false, error: run.stderr || `exit code ${run.code}` };
  }

  // Parse the last JSON line from stdout
  const lines = run.stdout.trim().split('\n').filter(Boolean);
  let parsed: unknown = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      parsed = JSON.parse(lines[i]);
      break;
    } catch {
      // skip non-JSON lines
    }
  }

  revalidateStudio(id);
  return { ok: true, result: parsed };
}
