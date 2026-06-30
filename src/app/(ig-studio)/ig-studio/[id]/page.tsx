/**
 * /ig-studio/[id] — per-photo editor server component.
 * Loads the classification entry, caption, and menu options, then renders <PhotoEditor>.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import { requireStudioAuth } from '@/lib/ig-studio/auth';
import {
  isValidPhotoId,
  readClassification,
  readCaptions,
  loadMenuOptions,
  getPhotos,
  type IgEntry,
} from '@/lib/ig-studio/data';
import { PhotoEditor } from './PhotoEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhotoEditorPage({ params }: PageProps) {
  // Auth gate
  try {
    await requireStudioAuth();
  } catch {
    redirect('/ig-studio/login');
  }

  const { id } = await params;

  if (!isValidPhotoId(id)) {
    notFound();
  }

  // Load data
  const entries = readClassification();
  const captions = readCaptions();
  const menu = loadMenuOptions();

  const entry: IgEntry | undefined = entries.find((e) => e.file === id + '.jpg');
  const captionText = captions[id]?.text ?? '';

  // Adjacent ids for batch navigation (same order as the gallery: sorted by filename)
  const photos = await getPhotos();
  const idx = photos.findIndex((p) => p.id === id);
  const prevId = idx > 0 ? photos[idx - 1].id : null;
  const nextId = idx >= 0 && idx < photos.length - 1 ? photos[idx + 1].id : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-gray-800">
        <Link
          href="/ig-studio"
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          ← Galerie
        </Link>
        <h1 className="text-sm font-mono text-gray-300">{id}</h1>
        {entry?.override && (
          <span className="ml-auto text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
            Validé
          </span>
        )}
      </header>

      {/* Editor */}
      <PhotoEditor
        id={id}
        entry={entry ?? null}
        caption={captionText}
        groups={menu.groups}
        prevId={prevId}
        nextId={nextId}
      />
    </div>
  );
}
