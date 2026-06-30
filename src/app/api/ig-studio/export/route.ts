/**
 * Auth-gated export route — streams a .zip of all VALIDATED posts.
 *
 * GET /api/ig-studio/export
 *   - 401 if unauthenticated
 *   - 200 application/zip otherwise
 *
 * Zip contents per validated photo:
 *   {id}/feed.png
 *   {id}/square.png   (if present)
 *   {id}/story.png    (if present)
 *   {id}/caption.txt
 *   manifest.json     (top-level, lists included + skipped with reason)
 *
 * Build approach: stage files under os.tmpdir(), shell out to macOS `zip`, stream
 * the result, clean up. Consistent with the project's macOS-only sips dependency.
 * No new npm packages required.
 */

import { execFileSync } from 'child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { requireStudioAuth } from '@/lib/ig-studio/auth';
import { readClassification, readCaptions, IG_ROOT } from '@/lib/ig-studio/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Auth gate
  try {
    await requireStudioAuth();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const entries = readClassification().filter((e) => e.override === true);
  const captions = readCaptions();
  const outDir = resolve(IG_ROOT, 'out');

  // Stage everything under a temp dir
  const stagingDir = mkdtempSync(join(tmpdir(), 'umai-export-'));

  const included: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  try {
    for (const entry of entries) {
      const id = entry.file.replace(/\.jpg$/, '');
      const sourceDir = resolve(outDir, id);
      const feedPath = resolve(sourceDir, 'feed.png');

      // A post without feed.png hasn't been composed yet → skip gracefully
      if (!existsSync(feedPath)) {
        skipped.push({ id, reason: 'not composed (feed.png missing — run Regenerate in the editor)' });
        continue;
      }

      // Create per-post staging folder
      const postStageDir = join(stagingDir, id);
      mkdirSync(postStageDir, { recursive: true });

      // Copy whichever variants exist
      for (const variant of ['feed.png', 'square.png', 'story.png'] as const) {
        const src = resolve(sourceDir, variant);
        if (existsSync(src)) {
          copyFileSync(src, join(postStageDir, variant));
        }
      }

      // Assemble caption.txt: saved caption > entry baseline > dishName > empty
      const captionText =
        captions[id]?.text ??
        entry.baseline ??
        entry.dishName ??
        '';
      writeFileSync(join(postStageDir, 'caption.txt'), captionText, 'utf-8');

      included.push(id);
    }

    // Write top-level manifest
    const manifest = {
      exportedAt: new Date().toISOString(),
      includedCount: included.length,
      skippedCount: skipped.length,
      included,
      skipped,
    };
    writeFileSync(join(stagingDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    // Zip everything in the staging dir
    const zipPath = join(stagingDir, 'umai-posts.zip');
    execFileSync('zip', ['-r', 'umai-posts.zip', '.'], { cwd: stagingDir });

    // Read zip into buffer and return
    const zipBuffer = readFileSync(zipPath);

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="umai-posts.zip"',
        'Content-Length': String(zipBuffer.byteLength),
      },
    });
  } catch (err) {
    // The `zip` binary or a file op failed — return a clear JSON error instead of
    // an opaque 500 (e.g. `zip` not installed on the host).
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ig-studio/export] failed:', message);
    return new Response(
      JSON.stringify({ error: 'Export impossible', detail: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  } finally {
    // Best-effort cleanup — do not let errors here mask the main response
    try {
      rmSync(stagingDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
