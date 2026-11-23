#!/usr/bin/env python3
"""Phase 15 / Plan 02: vector « UMAÏ / Ramen Noodle bar » logo for the QR print files.

Usage:
    python3 scripts/qr/extract-logo.py [--pdf <path>] [--out <path>]

Defaults (relative paths are resolved from the repository root):
    --pdf .planning/sources/menu-2026/plats-ouvert-360x250mm-print-2026-11-10.pdf
          (the 2026 Exaprint print of the food menu, tracked in git)
    --out scripts/qr/assets/umai-logo.svg

How: on page index 0, the window x 30.0-77.0 mm / y 225.5-247.5 mm (PyMuPDF top-left
coordinates) fully contains exactly 8 filled vector drawings: U, M, A, the I stem, the two
tréma dots, « Ramen » and « Noodle bar ». They are re-drawn item by item (l = line,
c = bezier, re = rectangle, qu = quad), translated so the union of their boxes starts at
0,0, on a new page of exactly that size, filled with #1A1A1A (the brand text colour), and
exported with page.get_svg_image(text_as_path=True). The root <svg> gets fill="#1A1A1A".
Nothing from the bowl illustration (above the window) or the page background is taken.

Output: LOGO OK paths=8 size_mm=<w>x<h> out=<path>   (expected about 45.05x19.76)
Exit codes: 0 = ok, 1 = not exactly 8 drawings / unexpected SVG, 2 = usage or I/O error.
Needs PyMuPDF (fitz). MuPDF may report « No common ancestor in structure tree » on this
PDF: harmless, and silenced here.
"""

import argparse
import os
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover - environment check
    print("ERROR PyMuPDF (fitz) is not installed: python3 -m pip install --user pymupdf")
    sys.exit(2)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MM = 72 / 25.4
DEFAULT_PDF = ".planning/sources/menu-2026/plats-ouvert-360x250mm-print-2026-11-10.pdf"
DEFAULT_OUT = "scripts/qr/assets/umai-logo.svg"
WINDOW_MM = (30.0, 225.5, 77.0, 247.5)  # x0, y0, x1, y1, top-left coordinates
EXPECTED_DRAWINGS = 8
FILL = (0x1A / 255,) * 3


def resolve(path):
    return path if os.path.isabs(path) else os.path.join(ROOT, path)


def shown(path):
    return os.path.relpath(path, ROOT) if path.startswith(ROOT) else path


def moved(point, dx, dy):
    return fitz.Point(point.x - dx, point.y - dy)


def main():
    parser = argparse.ArgumentParser(description="Extract the vector UMAÏ logo from the 2026 print.")
    parser.add_argument("--pdf", default=DEFAULT_PDF)
    parser.add_argument("--out", default=DEFAULT_OUT)
    args = parser.parse_args()

    fitz.TOOLS.mupdf_display_errors(False)
    pdf = resolve(args.pdf)
    out = resolve(args.out)
    if not os.path.exists(pdf):
        print(f"ERROR missing source PDF {shown(pdf)}")
        return 2

    src = fitz.open(pdf)
    page = src[0]
    x0, y0, x1, y1 = WINDOW_MM
    window = fitz.Rect(x0 * MM, y0 * MM, x1 * MM, y1 * MM)
    drawings = [d for d in page.get_drawings() if window.contains(d["rect"])]
    if len(drawings) != EXPECTED_DRAWINGS:
        print(f"FAIL expected {EXPECTED_DRAWINGS} drawings inside the window, found {len(drawings)}:")
        for d in drawings:
            r = d["rect"]
            print(f"  {d.get('type')} rect_mm=[{r.x0 / MM:.2f}, {r.y0 / MM:.2f}, {r.x1 / MM:.2f}, {r.y1 / MM:.2f}]")
        return 1

    bbox = fitz.Rect(drawings[0]["rect"])
    for d in drawings[1:]:
        bbox |= d["rect"]
    dx, dy = bbox.x0, bbox.y0

    doc = fitz.open()
    target = doc.new_page(width=bbox.width, height=bbox.height)
    for d in drawings:
        shape = target.new_shape()
        for item in d["items"]:
            kind = item[0]
            if kind == "l":
                shape.draw_line(moved(item[1], dx, dy), moved(item[2], dx, dy))
            elif kind == "c":
                shape.draw_bezier(
                    moved(item[1], dx, dy), moved(item[2], dx, dy), moved(item[3], dx, dy), moved(item[4], dx, dy)
                )
            elif kind == "re":
                r = item[1]
                shape.draw_rect(fitz.Rect(r.x0 - dx, r.y0 - dy, r.x1 - dx, r.y1 - dy))
            elif kind == "qu":
                q = item[1]
                shape.draw_quad(
                    fitz.Quad(moved(q.ul, dx, dy), moved(q.ur, dx, dy), moved(q.ll, dx, dy), moved(q.lr, dx, dy))
                )
            else:
                print(f"FAIL unsupported drawing item {kind!r}")
                return 1
        shape.finish(
            fill=FILL,
            color=None,
            even_odd=bool(d.get("even_odd", False)),
            closePath=bool(d.get("closePath", False)),
        )
        shape.commit()

    svg = target.get_svg_image(text_as_path=True)
    if "<image" in svg or "<text" in svg:
        print("FAIL the logo SVG contains <image> or <text>")
        return 1
    paths = len(re.findall(r"<path\b", svg))
    if paths != EXPECTED_DRAWINGS:
        print(f"FAIL the logo SVG has {paths} <path> elements, expected {EXPECTED_DRAWINGS}")
        return 1
    svg, count = re.subn(r"<svg\b", '<svg fill="#1A1A1A"', svg, count=1)
    if count != 1 or "viewBox" not in svg:
        print("FAIL no root <svg> with a viewBox in the MuPDF output")
        return 1

    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(svg if svg.endswith("\n") else svg + "\n")
    print(f"LOGO OK paths={paths} size_mm={bbox.width / MM:.2f}x{bbox.height / MM:.2f} out={shown(out)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
