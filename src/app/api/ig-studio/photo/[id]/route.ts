/**
 * Auth-gated photo + thumbnail route.
 * GET /api/ig-studio/photo/[id]          → full JPEG
 * GET /api/ig-studio/photo/[id]?size=thumb → 480px-wide JPEG via sharp
 *
 * Security:
 * - requireStudioAuth() — 401 if cookie missing/invalid
 * - isValidPhotoId()   — only ids matching /^umai_\d{3}$/ are resolved; 404 otherwise
 * - No path traversal possible: id is validated before being used as filename
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { requireStudioAuth } from '@/lib/ig-studio/auth';
import { isValidPhotoId, photoFsPath } from '@/lib/ig-studio/data';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Auth gate — route handlers are NOT matched by proxy.ts middleware
  try {
    await requireStudioAuth();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  // Path-traversal guard: only valid photo ids are accepted
  if (!isValidPhotoId(id)) {
    return new Response('Not Found', { status: 404 });
  }

  const p = photoFsPath(id);

  if (!existsSync(p)) {
    return new Response('Not Found', { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const size = searchParams.get('size');

  if (size === 'thumb') {
    // Sharp thumbnail: 480px wide, quality 70
    const sharp = (await import('sharp')).default;
    const buf = await sharp(p)
      .resize({ width: 480, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    return new Response(buf, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  // Full-resolution file
  const buf = await readFile(p);
  return new Response(buf, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
