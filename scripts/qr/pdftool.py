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

Units: mm <-> pt through 72 / 25.4. Exit codes: 0 = ok, 1 = a check failed,
2 = usage, missing module or unreadable file.
"""

import argparse
import json
import os
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
