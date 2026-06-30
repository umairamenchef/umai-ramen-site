/**
 * Auth-gated generated-output route.
 * GET /api/ig-studio/output/[id]?format=feed|square|story      → full PNG
 * GET /api/ig-studio/output/[id]?format=feed&size=thumb        → 480px-wide JPEG via sharp
 *
 * Serves the branded posts rendered into ig-studio/out/[id]/[format].png.
 * Security: requireStudioAuth() + isValidPhotoId() + format whitelist (no traversal).
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { requireStudioAuth } from '@/lib/ig-studio/auth';
import { isValidPhotoId, outputFsPath } from '@/lib/ig-studio/data';

export const dynamic = 'force-dynamic';

type Fmt = 'feed' | 'square' | 'story';
const FORMATS: Fmt[] = ['feed', 'square', 'story'];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireStudioAuth();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  if (!isValidPhotoId(id)) {
    return new Response('Not Found', { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const fmt = (searchParams.get('format') ?? 'feed') as Fmt;
  if (!FORMATS.includes(fmt)) {
    return new Response('Bad format', { status: 400 });
  }

  const p = outputFsPath(id, fmt);
  if (!existsSync(p)) {
    return new Response('Not Found', { status: 404 });
  }

  if (searchParams.get('size') === 'thumb') {
    const sharp = (await import('sharp')).default;
    const buf = await sharp(p)
      .resize({ width: 480, withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer();
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=60',
      },
    });
  }

  const buf = await readFile(p);
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=60',
    },
  });
}
