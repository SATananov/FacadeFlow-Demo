from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

try:
    import fitz
except ImportError as exc:
    raise SystemExit("PyMuPDF is required. Run tools/ai_training/SETUP.ps1 first.") from exc

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)

def _number(value: str | None) -> float | None:
    if not value:
        return None
    m = re.match(r"^\s*([0-9.+-]+)", value)
    return float(m.group(1)) if m else None

def crop_svg(full_svg: str, box: list[float], out_width: int = 640) -> str:
    root = ET.fromstring(full_svg)
    x0, y0, x1, y1 = map(float, box)
    w, h = x1 - x0, y1 - y0
    out_height = max(1, round(out_width * h / w))

    # Keep all original vector elements and only alter the viewport.
    # This is a faithful vector view of the original PDF page, not redrawn geometry.
    root.set("viewBox", f"{x0} {y0} {w} {h}")
    root.set("width", str(out_width))
    root.set("height", str(out_height))
    root.set("preserveAspectRatio", "xMidYMid meet")

    return ET.tostring(root, encoding="unicode")

def render_png(page, box: list[float], target_scale: float = 5.0):
    rect = fitz.Rect(*box)
    return page.get_pixmap(matrix=fitz.Matrix(target_scale, target_scale), clip=rect, alpha=False)

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    pdf = Path(args.pdf)
    manifest_path = Path(args.manifest)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    if not pdf.exists():
        raise SystemExit(f"PDF not found: {pdf}")
    if not manifest_path.exists():
        raise SystemExit(f"Manifest not found: {manifest_path}")

    config = json.loads(manifest_path.read_text(encoding="utf-8"))
    doc = fitz.open(pdf)
    page_no = int(config["source_page"])
    if len(doc) < page_no:
        raise SystemExit(f"Catalogue has only {len(doc)} pages; expected page {page_no}")

    page = doc[page_no - 1]
    full_svg = page.get_svg_image(text_as_path=True)

    generated = {}
    for code, profile in config["profiles"].items():
        safe = code.replace(".", "_")
        generated[code] = {}

        for key, suffix in [
            ("section_only_box", "section_only"),
            ("section_with_dimensions_box", "with_dimensions"),
        ]:
            box = profile[key]
            svg = crop_svg(full_svg, box)
            svg_name = f"{safe}_{suffix}.svg"
            (out / svg_name).write_text(svg, encoding="utf-8")

            png_name = f"{safe}_{suffix}.png"
            render_png(page, box).save(out / png_name)

            generated[code][suffix] = {
                "svg": svg_name,
                "png": png_name,
                "pdf_box": box
            }

    output_manifest = {
        "source_pdf": pdf.name,
        "source_page": page_no,
        "system": config["system"],
        "generated": generated,
        "profiles": config["profiles"],
        "safety": config["safety"]
    }
    (out / "manifest.json").write_text(
        json.dumps(output_manifest, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    cards = []
    for code, profile in config["profiles"].items():
        role = profile["label_bg"]
        human = profile["human_confirmed"]
        safe = code.replace(".", "_")
        cards.append(f"""
        <article class="card">
          <h2>{html.escape(code)} · {html.escape(role)}</h2>
          <div class="grid">
            <section>
              <h3>Истински каталогов вектор</h3>
              <img src="{safe}_section_only.svg" alt="{html.escape(code)} catalogue vector">
            </section>
            <section>
              <h3>Каталог + размери</h3>
              <img src="{safe}_with_dimensions.svg" alt="{html.escape(code)} catalogue dimensions">
            </section>
          </div>
          <p><strong>Human-confirmed:</strong> {html.escape(human["formula"])}</p>
          <p class="source">Source layers remain separate: KMG catalogue / Nadezhda human-confirmed.</p>
        </article>
        """)

    html_doc = f"""<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<title>PRELUDE 60 Verified Vector Views</title>
<style>
body{{font-family:Arial,sans-serif;margin:24px;background:#f3f6f8;color:#17232b}}
h1{{margin-bottom:4px}} .note{{color:#744b00;background:#fff4d6;padding:12px;border:1px solid #e2bd66}}
.card{{background:white;border:1px solid #ccd5da;border-radius:10px;padding:18px;margin:18px 0}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}
section{{border:1px solid #dde4e8;padding:12px;border-radius:8px}}
img{{width:100%;height:360px;object-fit:contain;background:white}}
.source{{font-size:13px;color:#52636d}}
@media(max-width:900px){{.grid{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<h1>KMG PRELUDE 60 · Verified Catalogue Vector Views</h1>
<p class="note"><strong>Важно:</strong> тези SVG-и са директен векторен изглед от оригиналния PDF. Не са production-ready assembly geometry.</p>
{''.join(cards)}
</body></html>"""
    (out / "index.html").write_text(html_doc, encoding="utf-8")

    print("=== PRELUDE VERIFIED VECTOR VIEWS PASS ===")
    for code in config["profiles"]:
        print(f"{code}: SVG section + SVG with catalogue dimensions")
    print("Verified catalogue visual: YES")
    print("AI-redrawn contour: NO")
    print("Isolated production contour: NO")
    print("Machine ready: NO")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
