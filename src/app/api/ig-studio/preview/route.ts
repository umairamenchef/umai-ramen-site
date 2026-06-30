/**
 * POST /api/ig-studio/preview
 * Accepts { id, entry } — shells compose --preview to a temp PNG and streams it.
 * Auth-gated: requires valid ig_studio_auth cookie.
 */

export const dynamic = 'force-dynamic';

import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

import { requireStudioAuth } from '@/lib/ig-studio/auth';
import { isValidPhotoId } from '@/lib/ig-studio/data';
import { runIgStudio } from '@/lib/ig-studio/run';

export async function POST(req: Request): Promise<Response> {
  // Auth gate
  try {
    await requireStudioAuth();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  // Parse body
  let body: { id?: string; entry?: Record<string, unknown>; format?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { id, entry, format } = body;
  const validFormats = ['feed', 'square', 'story'];
  const previewFormat = validFormats.includes(format as string) ? (format as string) : 'feed';

  if (!id || !isValidPhotoId(id)) {
    return new Response('Invalid or missing photo id', { status: 400 });
  }

  const rand = randomBytes(6).toString('hex');
  const entryPath = resolve(tmpdir(), `igpreview-entry-${id}-${rand}.json`);
  const outPng = resolve(tmpdir(), `igpreview-${id}-${rand}.png`);

  // Ensure `file` is set in the entry
  const entryData = { ...(entry ?? {}), file: id + '.jpg' };

  try {
    writeFileSync(entryPath, JSON.stringify(entryData, null, 2));

    let run;
    try {
      run = await runIgStudio(
        [
          'src/compose.js',
          '--photo', id,
          '--preview',
          '--format', previewFormat,
          '--out', outPng,
          '--entry-file', entryPath,
        ],
        { timeoutMs: 30_000 },
      );
    } catch (err) {
      // runIgStudio rejects on spawn error / timeout — return JSON 500 (cleanup in finally).
      return new Response(
        JSON.stringify({ error: String(err) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (run.code !== 0) {
      return new Response(
        JSON.stringify({ error: run.stderr || `exit code ${run.code}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // compose.js can exit 0 without producing the PNG (e.g. unexpected internal
    // path) — guard so we return a clean JSON error, not an opaque 500.
    if (!existsSync(outPng)) {
      return new Response(
        JSON.stringify({ error: 'Aperçu non généré (fichier de sortie manquant)' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const buf = readFileSync(outPng);

    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } finally {
    // Best-effort cleanup
    for (const p of [entryPath, outPng]) {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
  }
}
