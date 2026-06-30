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
  const entries = readClassification();
  const idx = entries.findIndex((e) => e.file === file);

  const prior: Partial<IgEntry> = idx >= 0 ? entries[idx] : {};

  const updated: IgEntry = {
    file,
    dishSlug: fields.dishSlug,
    dishName: fields.dishName,
    price: fields.price,
    baseline: fields.baseline,
    overlayMode: fields.overlayMode,
    logoPosX: fields.logoPosX,
    logoPosY: fields.logoPosY,
    logoSize: fields.logoSize,
    showPrice: fields.showPrice,
    logoColor: fields.logoColor ?? 'auto',
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

  const captions = readCaptions();
  captions[id] = { text, updatedAt: new Date().toISOString() };
  writeJsonAtomic(CAPTIONS_PATH, captions);

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
