from __future__ import annotations
import argparse
import json
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError as exc:
    raise SystemExit("PyMuPDF is required. Run SETUP.ps1 first.") from exc

REGIONS = {
    "482.30": {"page": 2, "clip": [32, 100, 105, 205]},
    "482.05": {"page": 2, "clip": [200, 95, 275, 205]},
    "482.21": {"page": 2, "clip": [200, 235, 280, 355]},
}

def point_tuple(p):
    return [round(float(p.x), 4), round(float(p.y), 4)]

def serialize_item(item):
    op = item[0]
    if op == "l":
        return {"op": "line", "p1": point_tuple(item[1]), "p2": point_tuple(item[2])}
    if op == "c":
        return {
            "op": "cubic",
            "p1": point_tuple(item[1]),
            "c1": point_tuple(item[2]),
            "c2": point_tuple(item[3]),
            "p2": point_tuple(item[4]),
        }
    return {"op": str(op), "raw": [str(x) for x in item[1:]]}

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    pdf = Path(args.pdf)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    if not pdf.exists():
        raise SystemExit(f"PDF not found: {pdf}")

    doc = fitz.open(pdf)
    if len(doc) < 2:
        raise SystemExit("Expected PRELUDE catalogue with at least 2 pages")

    manifest = {
        "source_pdf": pdf.name,
        "source_type": "CATALOGUE",
        "system": "KMG PRELUDE 60",
        "exact_production_geometry": False,
        "regions": {}
    }

    for code, cfg in REGIONS.items():
        page = doc[cfg["page"] - 1]
        clip = fitz.Rect(*cfg["clip"])

        # Faithful catalogue visual crop
        pix = page.get_pixmap(matrix=fitz.Matrix(4, 4), clip=clip, alpha=False)
        png_name = f"{code.replace('.', '_')}_catalogue_crop.png"
        pix.save(out / png_name)

        # Raw vector evidence from the original PDF, not invented geometry
        vectors = []
        for d in page.get_drawings():
            if not d["rect"].intersects(clip):
                continue
            vectors.append({
                "rect": [round(float(d["rect"].x0),4), round(float(d["rect"].y0),4),
                         round(float(d["rect"].x1),4), round(float(d["rect"].y1),4)],
                "type": d.get("type"),
                "color": d.get("color"),
                "fill": d.get("fill"),
                "width": d.get("width"),
                "items": [serialize_item(i) for i in d.get("items", [])],
            })

        vector_name = f"{code.replace('.', '_')}_vectors.json"
        (out / vector_name).write_text(
            json.dumps({
                "code": code,
                "source": "KMG PRELUDE 60 catalogue",
                "page": cfg["page"],
                "clip_pdf_points": cfg["clip"],
                "note": "Vector evidence extracted from catalogue page. It includes catalogue drawing elements inside the crop and is not yet isolated production contour geometry.",
                "drawings": vectors
            }, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

        manifest["regions"][code] = {
            "page": cfg["page"],
            "png": png_name,
            "vector_json": vector_name,
            "clip_pdf_points": cfg["clip"],
            "drawing_count": len(vectors)
        }

    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("=== PRELUDE CATALOGUE EXTRACTION PASS ===")
    for code, item in manifest["regions"].items():
        print(f"{code}: {item['drawing_count']} vector drawing objects")
    print("Exact production geometry: NO")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
