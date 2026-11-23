#!/usr/bin/env node
// Phase 15 / Plan 01: writes the five menu QR codes (FR, EN, DE, IT, 中文) into public/qr/.
//
//   node scripts/qr/generate.mjs
//
// For each locale of src/lib/qr.ts (QR_LOCALES), the code of qrMenuUrl(locale)
// (https://umai-ramen.fr/{locale}/menu, error correction Q, version 3 = 29 x 29 modules)
// is built with the `qrcode` package (devDependency) and written twice:
//   - public/qr/umai-menu-{locale}.svg: vector, rendered by qrSvg() of src/lib/qr.ts
//     (filled squares, 1 module = 1 mm, white 4-module quiet zone, #000000 on #FFFFFF,
//     no logo), the file the print sheets inline and the /menu/qr page shows;
//   - public/qr/umai-menu-{locale}.png: 1036 x 1036 px, 28 px per module, pure black on
//     white (for messaging apps). `width` is never passed: it would force uneven modules.
// The PNG is encoded with the same level and mask as the SVG, so both files carry the
// very same symbol. Re-running rewrites byte-identical files (no git diff).
//
// Checked by scripts/qr/verify.mjs (decode with mutool + jsQR, live URL check).
// Exit codes: 0 = GENERATE OK, 1 = a code is not version 3 / 29 modules or a PNG is not
// 1036 x 1036, 2 = usage or unexpected error.
// Node 24 (native type stripping loads src/lib/qr.ts, import.meta.dirname).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import {
  QR_LOCALES,
  QR_EC_LEVEL,
  QR_VERSION,
  QR_MODULES,
  QR_QUIET_ZONE,
  QR_PNG_SCALE,
  QR_PNG_SIZE,
  qrMenuUrl,
  qrAssetPath,
  qrSvg,
} from '../../src/lib/qr.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

class UsageError extends Error {}

/** Width and height from the PNG IHDR chunk (big-endian at bytes 16 and 20). */
function pngSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    throw new UsageError(`unexpected argument ${args[0]} (usage: node scripts/qr/generate.mjs)`);
  }

  mkdirSync(join(ROOT, 'public', 'qr'), { recursive: true });
  const failures = [];
  let files = 0;

  for (const locale of QR_LOCALES) {
    const url = qrMenuUrl(locale);
    const qr = QRCode.create(url, { errorCorrectionLevel: QR_EC_LEVEL });
    if (qr.version !== QR_VERSION || qr.modules.size !== QR_MODULES) {
      failures.push(
        `${locale}: expected version ${QR_VERSION} (${QR_MODULES} modules), got version ${qr.version} (${qr.modules.size} modules)`,
      );
      continue;
    }

    const svgRel = qrAssetPath(locale, 'svg');
    const pngRel = qrAssetPath(locale, 'png');
    writeFileSync(join(ROOT, 'public', svgRel), qrSvg(qr.modules, url));
    files++;

    const pngPath = join(ROOT, 'public', pngRel);
    await QRCode.toFile(pngPath, url, {
      type: 'png',
      errorCorrectionLevel: QR_EC_LEVEL,
      maskPattern: qr.maskPattern,
      margin: QR_QUIET_ZONE,
      scale: QR_PNG_SCALE,
      color: { dark: '#000000ff', light: '#ffffffff' },
    });
    files++;
    const size = pngSize(pngPath);
    if (!size || size.width !== QR_PNG_SIZE || size.height !== QR_PNG_SIZE) {
      failures.push(
        `${locale}: ${pngRel} is ${size ? `${size.width}x${size.height}` : 'not a PNG'}, expected ${QR_PNG_SIZE}x${QR_PNG_SIZE}`,
      );
      continue;
    }

    console.log(
      `QR ${locale} ${url} v${qr.version} ${QR_EC_LEVEL} mask ${qr.maskPattern} -> public${svgRel}, .png`,
    );
  }

  if (failures.length > 0) {
    for (const line of failures) console.log(`FAIL ${line}`);
    console.log(`GENERATE FAILED failures=${failures.length}`);
    return 1;
  }
  console.log(`GENERATE OK files=${files}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`ERROR ${error instanceof UsageError ? error.message : (error.stack ?? error)}`);
    process.exit(2);
  },
);
