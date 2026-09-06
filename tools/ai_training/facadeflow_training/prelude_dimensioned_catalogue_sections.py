from __future__ import annotations
import argparse, html, json
from pathlib import Path

PROFILE_META = {
    "482.30": {
        "label": "Каса",
        "catalogue_dims": "Каталог: 60 / 64 / 42 mm",
        "human_rule": "Human-confirmed: 64 - 22 = 42",
        "note": "22 mm е изведена работна зона. Не се наслагва върху контура, докато точните anchor точки не бъдат валидирани."
    },
    "482.05": {
        "label": "Крило",
        "catalogue_dims": "Каталог: 60 / 56 mm",
        "human_rule": "Human-confirmed: 78 - 22 = 56",
        "note": "78 mm НЕ е показана като същата каталогова кота в текущия изглед. Затова 78/22 не се рисуват фалшиво върху профила."
    },
    "482.21": {
        "label": "Делител",
        "catalogue_dims": "Каталог: 60 / 84 / 40 mm",
        "human_rule": "Human-confirmed: 84 - 22 - 22 = 40",
        "note": "22 + 22 са потвърдени работни зони от двете страни. Геометричните им anchor точки още не са валидирани."
    },
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lab02-output", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    lab02 = Path(args.lab02_output)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    cards = []
    manifest = {"source": str(lab02), "profiles": {}, "safety": {
        "catalogue_dimensions_on_sketch": True,
        "human_confirmed_22mm_overlaid_on_contour": False,
        "geometric_anchor_points_validated": False,
        "machine_ready": False,
        "production_approved": False
    }}

    for code, meta in PROFILE_META.items():
        safe = code.replace(".", "_")
        src = lab02 / f"{safe}_with_dimensions.svg"
        if not src.exists():
            raise SystemExit(f"Missing Lab02 dimensioned SVG: {src}")

        dst_name = f"{safe}_catalogue_with_dimensions.svg"
        (out / dst_name).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")

        manifest["profiles"][code] = {
            "asset": dst_name,
            "catalogue_dimensions": meta["catalogue_dims"],
            "human_confirmed_rule": meta["human_rule"],
            "anchor_status": "NOT_YET_VALIDATED_FOR_22MM_WORKING_ZONE"
        }

        cards.append(
            '<article class="card">'
            f'<h2>{html.escape(code)} · {html.escape(meta["label"])}</h2>'
            '<div class="drawing">'
            f'<img src="{dst_name}" alt="{html.escape(code)} dimensioned catalogue section">'
            '</div>'
            f'<p class="catalogue"><strong>{html.escape(meta["catalogue_dims"])}</strong></p>'
            f'<p class="human"><strong>{html.escape(meta["human_rule"])}</strong></p>'
            f'<p class="note">{html.escape(meta["note"])}</p>'
            '</article>'
        )

    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    html_doc = (
        '<!doctype html><html lang="bg"><head><meta charset="utf-8">'
        '<title>PRELUDE 60 Dimensioned Catalogue Sections</title><style>'
        'body{font-family:Arial,sans-serif;background:#f4f7f9;color:#17212b;margin:24px}'
        '.warn{background:#fff4d6;border:1px solid #e3b950;padding:12px;border-radius:8px}'
        '.card{background:white;border:1px solid #cfd8df;border-radius:10px;padding:18px;margin:18px 0}'
        '.drawing{border:1px solid #dbe3e8;border-radius:8px;padding:12px;background:#fff}'
        'img{display:block;width:100%;height:460px;object-fit:contain}'
        '.catalogue{background:#eaf4ff;padding:10px;border-radius:7px}'
        '.human{background:#eef8ee;padding:10px;border-radius:7px}'
        '.note{background:#fff7ed;color:#7c2d12;padding:10px;border-radius:7px}'
        '</style></head><body>'
        '<h1>KMG PRELUDE 60 · Dimensioned Catalogue Sections</h1>'
        '<p class="warn"><strong>Важно:</strong> самите скици вече са с оригиналните каталогови коти. '
        'Human-confirmed 22 mm работни зони остават отделно, докато не валидираме точните им anchor точки върху контура.</p>'
        + ''.join(cards) +
        '</body></html>'
    )
    (out / "index.html").write_text(html_doc, encoding="utf-8")

    print("=== PRELUDE DIMENSIONED CATALOGUE SECTIONS PASS ===")
    print("482.30: original catalogue dimensions on sketch")
    print("482.05: original catalogue dimensions on sketch")
    print("482.21: original catalogue dimensions on sketch")
    print("Human-confirmed 22 mm falsely overlaid: NO")
    print("Geometric anchor points validated: NO")
    print("Machine ready: NO")

if __name__ == "__main__":
    main()
