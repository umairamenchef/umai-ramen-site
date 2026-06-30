/**
 * Server-only data lib for /ig-studio.
 * Reads classification.json, captions.json, and menu-options.json at RUNTIME
 * from ig-studio/ (relative to process.cwd() = repo root).
 * Do NOT import this from client components.
 */

import { resolve } from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';

// ─── Paths ────────────────────────────────────────────────────────────────────

export const IG_ROOT = resolve(process.cwd(), 'ig-studio');
export const PHOTOS_DIR = resolve(IG_ROOT, 'photos');
export const CLASSIFICATION_PATH = resolve(IG_ROOT, 'classification.json');
export const CAPTIONS_PATH = resolve(IG_ROOT, 'captions.json');
export const MENU_OPTIONS_PATH = resolve(IG_ROOT, 'data', 'menu-options.json');
export const OUT_DIR = resolve(IG_ROOT, 'out');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IgEntry {
  file: string;
  dishSlug: string;
  shotType: string;
  confidence: number;
  reasoning: string;
  override?: boolean;
  /** 'photo-only' | 'logo-only' | 'logo-name' (backward compat: 'packshot' → 'logo-name') */
  overlayMode?: string;
  dishName?: string;
  price?: number | null;
  baseline?: string;
  /**
   * Normalized logo center position in [0,1].
   * logoPosX/logoPosY take priority over the legacy logoPosition enum.
   * x=0 is left edge, x=1 is right edge; y=0 is top, y=1 is bottom.
   */
  logoPosX?: number;
  logoPosY?: number;
  /** Legacy enum — kept for backward compat; ignored when logoPosX/logoPosY are present. */
  logoPosition?: string;
  /** 'small' | 'medium' | 'large' — default 'medium' */
  logoSize?: string;
  /** Show price on-image (logo-name mode only) — default false */
  showPrice?: boolean;
  /**
   * Logo color variant for overlay compositing.
   * 'auto' (default) — auto-select based on background luminance at logo region.
   * 'light' — always use ivoire (#F5F0E8) wordmark.
   * 'dark'  — always use charcoal (#1C1C1C) wordmark.
   */
  logoColor?: 'auto' | 'light' | 'dark';
}

export interface IgPhoto {
  id: string;        // e.g. "umai_001"
  file: string;      // e.g. "umai_001.jpg"
  dishSlug: string;
  dishName: string;
  shotType: string;
  overlayMode: string;
  confidence: number;
  reasoning: string;
  override: boolean;
  hasCaption: boolean;
  group: string;
  status: 'validated' | 'pending';
}

export interface MenuItem {
  slug: string;
  name: string;
  price: number | null;
  baseline: string;
  vege?: boolean;
  signature?: boolean;
  overlay?: string;
}

export interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export interface MenuOptions {
  nap: {
    name: string;
    address: string;
    phone: string;
    instagram: string;
    website: string;
  };
  groups: MenuGroup[];
}

// ─── Guards ───────────────────────────────────────────────────────────────────

/** Only ids matching this pattern are safe to use as file names. */
export function isValidPhotoId(id: string): boolean {
  return /^umai_\d{3}$/.test(id);
}

/** Returns the absolute FS path for a photo id (after validation). */
export function photoFsPath(id: string): string {
  if (!isValidPhotoId(id)) throw new Error(`Invalid photo id: ${id}`);
  return resolve(PHOTOS_DIR, id + '.jpg');
}

// ─── Readers ─────────────────────────────────────────────────────────────────

export function readClassification(): IgEntry[] {
  try {
    const raw = readFileSync(CLASSIFICATION_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as IgEntry[];
    return [];
  } catch {
    return [];
  }
}

export function readCaptions(): Record<string, { text: string; updatedAt: string }> {
  try {
    const raw = readFileSync(CAPTIONS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch {
    return {};
  }
}

export function loadMenuOptions(): MenuOptions & { slugToGroup: Map<string, string>; menuLabel: (slug: string) => string } {
  // Resilient read: a missing or corrupt menu-options.json must not 500 the whole
  // app (gallery, generated view AND editor all call this). Fall back to an empty
  // menu, mirroring readClassification()/readCaptions().
  const EMPTY_NAP = { name: '', address: '', phone: '', instagram: '', website: '' };
  let menu: MenuOptions & { _note?: string; currency?: string; classification_axes?: Record<string, string> };
  try {
    const raw = readFileSync(MENU_OPTIONS_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as MenuOptions;
    menu = parsed && Array.isArray(parsed.groups) ? parsed : { nap: EMPTY_NAP, groups: [] };
  } catch {
    menu = { nap: EMPTY_NAP, groups: [] };
  }

  // Build a slug → group name map for fast lookup
  const slugToGroup = new Map<string, string>();
  const slugToLabel = new Map<string, string>();

  for (const grp of menu.groups ?? []) {
    for (const item of grp.items ?? []) {
      slugToGroup.set(item.slug, grp.group);
      slugToLabel.set(item.slug, item.name);
    }
  }

  function menuLabel(slug: string): string {
    return slugToLabel.get(slug) ?? slug;
  }

  return { ...menu, slugToGroup, menuLabel };
}

// ─── Main view ───────────────────────────────────────────────────────────────

/**
 * Returns a merged view of all 81 photos, sorted by filename.
 * Reads photos/ directory, classification.json, captions.json, and menu-options.json.
 * Returns [] if photos/ dir doesn't exist.
 */
export async function getPhotos(): Promise<IgPhoto[]> {
  if (!existsSync(PHOTOS_DIR)) return [];

  const files = readdirSync(PHOTOS_DIR)
    .filter((f) => f.endsWith('.jpg'))
    .sort();

  const entries = readClassification();
  const captions = readCaptions();
  const menu = loadMenuOptions();

  // Build a map from file name → classification entry
  const entryByFile = new Map<string, IgEntry>();
  for (const e of entries) {
    entryByFile.set(e.file, e);
  }

  return files.map((file) => {
    const id = file.replace(/\.jpg$/, '');
    const entry = entryByFile.get(file);

    const dishSlug = entry?.dishSlug ?? 'ambiance';
    const override = entry?.override ?? false;

    // Resolve dish display name: prefer explicit dishName, then menu lookup, then slug
    const dishName = entry?.dishName ?? menu.menuLabel(dishSlug);

    // Resolve group from slug
    const group = menu.slugToGroup.get(dishSlug) ?? 'Non classé';

    return {
      id,
      file,
      dishSlug,
      dishName,
      shotType: entry?.shotType ?? 'unknown',
      overlayMode: entry?.overlayMode ?? 'logo-only',
      confidence: entry?.confidence ?? 0,
      reasoning: entry?.reasoning ?? '',
      override,
      hasCaption: !!captions[id],
      group,
      status: override ? 'validated' : 'pending',
    } satisfies IgPhoto;
  });
}

// ─── Generated posts (out/) ──────────────────────────────────────────────────

export interface GeneratedPost {
  id: string;
  dishName: string;
  dishSlug: string;
  group: string;
  /** Which formats exist on disk. */
  formats: { feed: boolean; square: boolean; story: boolean };
  caption: string;
}

/**
 * Returns every photo that has at least a feed.png rendered in out/{id}/,
 * sorted by id. Reads out/, classification.json, captions.json, menu-options.json.
 * The caption falls back to out/{id}/caption.txt when not in captions.json.
 */
export async function getGeneratedPosts(): Promise<GeneratedPost[]> {
  if (!existsSync(OUT_DIR)) return [];

  const ids = readdirSync(OUT_DIR)
    .filter((d) => /^umai_\d{3}$/.test(d))
    .filter((d) => existsSync(resolve(OUT_DIR, d, 'feed.png')))
    .sort();

  const entries = readClassification();
  const captions = readCaptions();
  const menu = loadMenuOptions();
  const entryByFile = new Map<string, IgEntry>();
  for (const e of entries) entryByFile.set(e.file, e);

  return ids.map((id) => {
    const entry = entryByFile.get(id + '.jpg');
    const dishSlug = entry?.dishSlug ?? 'ambiance';
    const dishName = entry?.dishName ?? menu.menuLabel(dishSlug);
    const group = menu.slugToGroup.get(dishSlug) ?? 'Non classé';

    let caption = captions[id]?.text ?? '';
    if (!caption) {
      try {
        caption = readFileSync(resolve(OUT_DIR, id, 'caption.txt'), 'utf-8').trim();
      } catch { /* no caption file */ }
    }

    return {
      id,
      dishName,
      dishSlug,
      group,
      formats: {
        feed:   existsSync(resolve(OUT_DIR, id, 'feed.png')),
        square: existsSync(resolve(OUT_DIR, id, 'square.png')),
        story:  existsSync(resolve(OUT_DIR, id, 'story.png')),
      },
      caption,
    } satisfies GeneratedPost;
  });
}

/** Absolute path to a generated output PNG (after id + format validation). */
export function outputFsPath(id: string, format: 'feed' | 'square' | 'story'): string {
  if (!isValidPhotoId(id)) throw new Error(`Invalid photo id: ${id}`);
  if (!['feed', 'square', 'story'].includes(format)) throw new Error(`Invalid format: ${format}`);
  return resolve(OUT_DIR, id, format + '.png');
}
