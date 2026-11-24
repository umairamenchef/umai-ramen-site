#!/usr/bin/env python3
"""Phase 15 / Plan 02: PDF tools for the QR print files (pypdf + PyMuPDF).

Sub-commands:

  boxes <in> <out> --width-mm W --height-mm H --bleed-mm B [--title T]
      Chromium honours CSS @page sizes only approximately (111 x 154 mm came out as
      111.17 x 154.18 mm). This sets exact boxes on every page: the content is moved so its
      top-left corner stays at the top-left of the page, then MediaBox = CropBox = BleedBox
      = W x H mm and TrimBox = MediaBox inset by B mm on every side (TrimBox = MediaBox when
      B = 0). Metadata: /Title T, /Author « Umaï Ramen », /Subject the 5 menu URLs,
      /Creator « scripts/qr/print.mjs (Chromium) ». Writes <out>.

  info <pdf>
      JSON on stdout: { "pages": [ { "media_mm": [w, h], "trim_mm": [x0, y0, x1, y1],
      "bleed_mm": [...], "spans": [ { "text", "bbox": [x0, y0, x1, y1] } ],
      "lines": [ { "text", "bbox" } ] } ] }. Boxes come from pypdf (PDF space converted to
      top-left millimetres), spans and lines from PyMuPDF get_text('dict') (top-left mm,
      2 decimals; a line joins the spans PyMuPDF puts on one line, e.g. a title set in two
      fonts).

  check <pdf> --kind a4|a6 [--bleed-mm B]
      Print-readiness assertions, one FAIL line per failure:
      - pages: a4 = 1, a6 = 2 (recto, verso);
      - boxes (pypdf, +/- 0.01 mm): a4 MediaBox 210 x 297 mm, TrimBox = BleedBox = MediaBox;
        a6 bleed B = --bleed-mm, or when absent the TrimBox inset (equal on the 4 sides,
        0 < B <= 5), MediaBox (105 + 2B) x (148 + 2B), TrimBox inset B, BleedBox = MediaBox;
      - vector only: no image on any page;
      - fonts (PyMuPDF get_fonts): every font embedded, every base name (subset prefix
        ABCDEF+ removed) starts with Outfit-, DMSerifDisplay- or NotoSansSC-, and none looks
        like a system font (PingFang, Helvetica, Arial, Times, Hiragino, STHeiti, Songti);
      - text: the 5 labels on every page; the A4 also carries the 5 display URLs, the 5 scan
        hints and the street address (golden copies of src/lib/qr.ts below);
      - safe area: every text span and every drawing (except rectangles covering >= 90 % of
        the page, i.e. the page background) inside a4 [12, 12, 198, 285] mm,
        a6 [B + 5, B + 5, B + 100, B + 143] mm (top-left coordinates).
      Then PDF CHECK OK file=<pdf> pages=<n> media=<w>x<h> trim=<w>x<h> bleed=<b> images=0
      fonts=<names> checks=<n> (exit 0), or PDF CHECK FAILED file=<pdf> failures=<n> (exit 1).

Units: mm <-> pt through 72 / 25.4. Exit codes: 0 = ok, 1 = a check failed,
2 = usage, missing module or unreadable file.
"""

import argparse
import json
import os
import re
import sys

try:
    import fitz  # PyMuPDF
    from pypdf import PdfReader, PdfWriter, Transformation
    from pypdf.errors import PyPdfError
    from pypdf.generic import RectangleObject
except ImportError as error:  # pragma: no cover - environment check
    print(f"ERROR missing Python module ({error}): python3 -m pip install --user pymupdf pypdf")
    sys.exit(2)

MM = 72 / 25.4
AUTHOR = "Umaï Ramen"
SUBJECT = "https://umai-ramen.fr/{fr,en,de,it,zh}/menu"
CREATOR = "scripts/qr/print.mjs (Chromium)"

# Golden copies of src/lib/qr.ts (QR_LABELS, qrDisplayUrl, QR_SCAN_HINTS, QR_PRINT_FOOTER).
# scripts/qr/verify.mjs maps each label to its code from qr.ts itself.
LOCALES = ("fr", "en", "de", "it", "zh")
LABELS = ("Menu en français", "Menu in English", "Speisekarte auf Deutsch", "Menù in italiano", "中文菜单")
DISPLAY_URLS = tuple(f"umai-ramen.fr/{locale}/menu" for locale in LOCALES)
SCAN_HINTS = (
    "Scannez avec l'appareil photo",
    "Scan with your phone camera",
    "Mit der Handykamera scannen",
    "Inquadra con la fotocamera",
    "用手机相机扫码",
)
ADDRESS = "5 Rue des Orphelins"

A4 = {"w": 210.0, "h": 297.0, "pages": 1, "safe": (12.0, 12.0, 198.0, 285.0)}
A6_TRIM = (105.0, 148.0)
A6_PAGES = 2
A6_SAFETY = 5.0
BOX_TOLERANCE_MM = 0.01
SAFE_TOLERANCE_MM = 0.01
BACKGROUND_AREA_SHARE = 0.9
ALLOWED_FONTS = ("Outfit-", "DMSerifDisplay-", "NotoSansSC-")
SYSTEM_FONTS = re.compile(r"PingFang|Helvetica|Arial|Times|Hiragino|STHeiti|Songti", re.IGNORECASE)
SUBSET_PREFIX = re.compile(r"^[A-Z]{6}\+")


class UsageError(Exception):
    pass


def r2(value):
    return round(value + 0.0, 2)


def box_mm(box, page_top):
    """pypdf box (PDF space, y up) -> [x0, y0, x1, y1] in top-left millimetres."""
    x0, y0, x1, y1 = (float(v) for v in box)
    return [r2(x0 / MM), r2((page_top - y1) / MM), r2(x1 / MM), r2((page_top - y0) / MM)]


def cmd_boxes(args):
    if args.width_mm <= 0 or args.height_mm <= 0 or args.bleed_mm < 0:
        raise UsageError("width and height must be > 0 mm, bleed >= 0 mm")
    if 2 * args.bleed_mm >= min(args.width_mm, args.height_mm):
        raise UsageError("the bleed leaves no trim area")
    reader = PdfReader(args.input)
    writer = PdfWriter()
    w, h, b = args.width_mm * MM, args.height_mm * MM, args.bleed_mm * MM
    for page in reader.pages:
        page.add_transformation(Transformation().translate(0, h - float(page.mediabox.top)))
        full = RectangleObject([0, 0, w, h])
        page.mediabox = full
        page.cropbox = RectangleObject([0, 0, w, h])
        page.bleedbox = RectangleObject([0, 0, w, h])
        page.trimbox = RectangleObject([b, b, w - b, h - b])
        writer.add_page(page)
    metadata = {"/Author": AUTHOR, "/Subject": SUBJECT, "/Creator": CREATOR}
    if args.title:
        metadata["/Title"] = args.title
    writer.add_metadata(metadata)
    out_dir = os.path.dirname(os.path.abspath(args.output))
    os.makedirs(out_dir, exist_ok=True)
    with open(args.output, "wb") as fh:
        writer.write(fh)
    print(
        f"BOXES OK file={args.output} pages={len(reader.pages)} media={args.width_mm:.2f}x{args.height_mm:.2f} "
        f"bleed={args.bleed_mm:g}"
    )
    return 0


def page_text(fitz_page):
    """Spans and lines of a PyMuPDF page in top-left millimetres (blank spans skipped)."""
    spans, lines = [], []
    for block in fitz_page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            parts = [s for s in line["spans"] if s["text"].strip()]
            for span in parts:
                spans.append({"text": span["text"], "bbox": [r2(v / MM) for v in span["bbox"]]})
            if parts:
                text = "".join(s["text"] for s in line["spans"]).strip()
                lines.append({"text": text, "bbox": [r2(v / MM) for v in line["bbox"]]})
    return spans, lines


def pdf_info(path):
    reader = PdfReader(path)
    doc = fitz.open(path)
    pages = []
    for index, page in enumerate(reader.pages):
        top = float(page.mediabox.top)
        spans, lines = page_text(doc[index])
        pages.append(
            {
                "media_mm": [r2(float(page.mediabox.width) / MM), r2(float(page.mediabox.height) / MM)],
                "media_box_mm": box_mm(page.mediabox, top),
                "trim_mm": box_mm(page.trimbox, top),
                "bleed_mm": box_mm(page.bleedbox, top),
                "spans": spans,
                "lines": lines,
            }
        )
    return {"file": path, "pages": pages}


def cmd_info(args):
    print(json.dumps(pdf_info(args.pdf), ensure_ascii=False))
    return 0


class Checker:
    def __init__(self):
        self.checks = 0
        self.failures = []

    def check(self, ok, message):
        self.checks += 1
        if not ok:
            self.failures.append(message)
        return ok


def close(a, b, tolerance=BOX_TOLERANCE_MM):
    return abs(a - b) <= tolerance


def same_box(a, b):
    return all(close(x, y) for x, y in zip(a, b))


def fmt_box(box):
    return "[" + ", ".join(f"{v:.2f}" for v in box) + "]"


def font_name(doc, xref, basefont):
    """BaseFont, or for nameless fonts (Type3) the FontName of their FontDescriptor."""
    if basefont:
        return basefont
    try:
        kind, value = doc.xref_get_key(xref, "FontDescriptor")
        if kind == "xref":
            kind, name = doc.xref_get_key(int(value.split()[0]), "FontName")
            if kind == "name":
                return name.lstrip("/")
    except (RuntimeError, ValueError):
        pass
    return ""


def inside(bbox, safe):
    x0, y0, x1, y1 = bbox
    s0, t0, s1, t1 = safe
    tol = SAFE_TOLERANCE_MM
    return x0 >= s0 - tol and y0 >= t0 - tol and x1 <= s1 + tol and y1 <= t1 + tol


def cmd_check(args):
    path = args.pdf
    reader = PdfReader(path)
    doc = fitz.open(path)
    c = Checker()
    n = len(reader.pages)
    want_pages = A4["pages"] if args.kind == "a4" else A6_PAGES
    c.check(n == want_pages, f"pages: {n}, expected {want_pages}")
    if n == 0:
        print("FAIL pages: the PDF has no page")
        print(f"PDF CHECK FAILED file={path} failures=1")
        return 1

    # Bleed and expected boxes (top-left millimetres).
    first = reader.pages[0]
    first_top = float(first.mediabox.top)
    first_media = box_mm(first.mediabox, first_top)
    first_trim = box_mm(first.trimbox, first_top)
    if args.kind == "a4":
        bleed = 0.0
        if args.bleed_mm not in (None, 0):
            raise UsageError("--bleed-mm applies to --kind a6 only (the A4 sheet has no bleed)")
        media_w, media_h = A4["w"], A4["h"]
        safe = A4["safe"]
    else:
        if args.bleed_mm is not None:
            bleed = args.bleed_mm
            if not 0 <= bleed <= 5:
                raise UsageError("--bleed-mm must be between 0 and 5")
        else:
            insets = [
                first_trim[0] - first_media[0],
                first_trim[1] - first_media[1],
                first_media[2] - first_trim[2],
                first_media[3] - first_trim[3],
            ]
            bleed = round(insets[0], 2)
            c.check(
                all(close(v, insets[0]) for v in insets) and 0 < bleed <= 5,
                f"bleed: TrimBox insets {fmt_box(insets)} mm must be equal on the 4 sides and in (0, 5]",
            )
        media_w, media_h = A6_TRIM[0] + 2 * bleed, A6_TRIM[1] + 2 * bleed
        safe = (bleed + A6_SAFETY, bleed + A6_SAFETY, bleed + A6_TRIM[0] - A6_SAFETY, bleed + A6_TRIM[1] - A6_SAFETY)
    want_media = [0.0, 0.0, media_w, media_h]
    want_trim = [bleed, bleed, media_w - bleed, media_h - bleed]

    fonts = set()
    for index, page in enumerate(reader.pages):
        where = f"page {index + 1}"
        top = float(page.mediabox.top)
        media = box_mm(page.mediabox, top)
        # MediaBox origin must be 0,0 for the top-left conversion of PyMuPDF to match.
        c.check(
            same_box(media, want_media) and close(float(page.mediabox.left), 0) and close(float(page.mediabox.bottom), 0),
            f"{where} MediaBox {fmt_box(media)} mm, expected {fmt_box(want_media)}",
        )
        trim = box_mm(page.trimbox, top)
        c.check(same_box(trim, want_trim), f"{where} TrimBox {fmt_box(trim)} mm, expected {fmt_box(want_trim)}")
        bleed_box = box_mm(page.bleedbox, top)
        c.check(same_box(bleed_box, want_media), f"{where} BleedBox {fmt_box(bleed_box)} mm, expected the MediaBox")

        fpage = doc[index]
        images = fpage.get_images(full=True)
        c.check(len(images) == 0, f"{where}: {len(images)} raster image(s), expected 0 (vector only)")

        for xref, ext, ftype, basefont, *_ in fpage.get_fonts(full=True):
            raw = font_name(doc, xref, basefont)
            name = SUBSET_PREFIX.sub("", raw)
            label = f"{raw or 'unnamed'} ({ftype}, xref {xref})"
            fonts.add(name or f"unnamed-{ftype}")
            # Chromium turns a font it cannot embed (e.g. a macOS system font) into Type3 glyph procedures.
            c.check(ext != "n/a" and ftype != "Type3", f"{where}: font {label} is not embedded as a font program")
            c.check(name.startswith(ALLOWED_FONTS), f"{where}: font {label} is not Outfit / DM Serif Display / Noto Sans SC")
            c.check(not SYSTEM_FONTS.search(name), f"{where}: system font {label} in a print file")

        text = fpage.get_text()
        expected = list(LABELS)
        if args.kind == "a4":
            expected += list(DISPLAY_URLS) + list(SCAN_HINTS) + [ADDRESS]
        for item in expected:
            c.check(item in text, f"{where}: text {item!r} not found")

        spans, _ = page_text(fpage)
        for span in spans:
            c.check(
                inside(span["bbox"], safe),
                f"{where}: text {span['text']!r} at {fmt_box(span['bbox'])} mm outside the safe area {fmt_box(safe)}",
            )
        page_area = fpage.rect.width * fpage.rect.height
        for drawing in fpage.get_drawings():
            rect = drawing["rect"]
            if rect.width * rect.height >= BACKGROUND_AREA_SHARE * page_area:
                continue  # page background
            bbox = [r2(v / MM) for v in rect]
            c.check(inside(bbox, safe), f"{where}: drawing at {fmt_box(bbox)} mm outside the safe area {fmt_box(safe)}")

    trim_w = want_trim[2] - want_trim[0]
    trim_h = want_trim[3] - want_trim[1]
    if c.failures:
        for line in c.failures:
            print(f"FAIL {line}")
        print(f"PDF CHECK FAILED file={path} failures={len(c.failures)}")
        return 1
    print(
        f"PDF CHECK OK file={path} pages={n} media={media_w:.2f}x{media_h:.2f} trim={trim_w:.2f}x{trim_h:.2f} "
        f"bleed={bleed:g} images=0 fonts={','.join(sorted(fonts))} checks={c.checks}"
    )
    return 0


def build_parser():
    parser = argparse.ArgumentParser(description="PDF tools for the QR print files")
    sub = parser.add_subparsers(dest="command", required=True)

    boxes = sub.add_parser("boxes", help="set exact MediaBox/TrimBox/BleedBox")
    boxes.add_argument("input")
    boxes.add_argument("output")
    boxes.add_argument("--width-mm", type=float, required=True)
    boxes.add_argument("--height-mm", type=float, required=True)
    boxes.add_argument("--bleed-mm", type=float, required=True)
    boxes.add_argument("--title")
    boxes.set_defaults(func=cmd_boxes)

    info = sub.add_parser("info", help="boxes and text spans as JSON")
    info.add_argument("pdf")
    info.set_defaults(func=cmd_info)

    check = sub.add_parser("check", help="print-readiness assertions")
    check.add_argument("pdf")
    check.add_argument("--kind", choices=("a4", "a6"), required=True)
    check.add_argument("--bleed-mm", type=float)
    check.set_defaults(func=cmd_check)
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    fitz.TOOLS.mupdf_display_errors(False)
    try:
        return args.func(args)
    except UsageError as error:
        print(f"ERROR {error}")
        return 2
    except (OSError, ValueError, RuntimeError, PyPdfError) as error:  # unreadable or invalid PDF
        print(f"ERROR {type(error).__name__}: {error}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
