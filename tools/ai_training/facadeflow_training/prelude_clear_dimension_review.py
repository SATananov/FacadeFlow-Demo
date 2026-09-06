from __future__ import annotations
import argparse
import html
from pathlib import Path

PROFILES = [
    ("482.30", "Каса", "60 / 64 / 42 mm", "64 - 22 = 42"),
    ("482.05", "Крило", "60 / 56 mm", "78 - 22 = 56"),
    ("482.21", "Делител", "60 / 84 / 40 mm", "84 - 22 - 22 = 40"),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lab041-output", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    src = Path(args.lab041_output)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    cards = []
    for code, label, cat_dims, human_rule in PROFILES:
        safe = code.replace(".", "_")
        source_svg = src / f"{safe}_catalogue_with_dimensions.svg"
        if not source_svg.exists():
            raise SystemExit(f"Missing source SVG: {source_svg}")

        target_svg = out / source_svg.name
        target_svg.write_text(source_svg.read_text(encoding="utf-8"), encoding="utf-8")

        card = (
            '<article class="card">'
            f'<div class="head"><div><div class="eyebrow">KMG PRELUDE 60</div>'
            f'<h2>{html.escape(code)} · {html.escape(label)}</h2></div>'
            '<div class="badge">ОРИГИНАЛЕН КАТАЛОГОВ ВЕКТОР</div></div>'
            f'<div class="viewer"><div class="toolbar">'
            f'<button onclick="zoomImg(\'{safe}\',1)">100%</button>'
            f'<button onclick="zoomImg(\'{safe}\',1.5)">150%</button>'
            f'<button onclick="zoomImg(\'{safe}\',2)">200%</button>'
            f'<button onclick="zoomImg(\'{safe}\',2.5)">250%</button>'
            f'<button onclick="zoomImg(\'{safe}\',1)">Побери</button>'
            f'</div><div class="viewport"><img id="img-{safe}" src="{target_svg.name}" '
            f'alt="{html.escape(code)} dimensioned catalogue section"></div></div>'
            '<div class="facts">'
            f'<div class="fact blue"><small>КАТАЛОГОВИ КОТИ</small><strong>{html.escape(cat_dims)}</strong></div>'
            f'<div class="fact green"><small>ПОТВЪРДЕНА РАБОТНА ЛОГИКА</small><strong>{html.escape(human_rule)}</strong></div>'
            '</div>'
            '<div class="note">Размерите върху чертежа са оригиналните каталогови коти. '
            '22 mm работните зони остават отделно, докато точните anchor точки върху контура не бъдат валидирани.</div>'
            '</article>'
        )
        cards.append(card)

    html_doc = (
        '<!doctype html><html lang="bg"><head><meta charset="utf-8">'
        '<title>PRELUDE 60 Clear Dimension Review</title>'
        '<style>'
        'body{margin:0;background:#eef3f6;font-family:Arial,sans-serif;color:#14242d}'
        '.top{position:sticky;top:0;z-index:5;background:#102832;color:white;padding:18px 26px;border-bottom:4px solid #e4a64a}'
        '.top h1{margin:0;font-size:26px}.top p{margin:6px 0 0;color:#d2e2e8}'
        '.wrap{max-width:1500px;margin:auto;padding:24px}.card{background:white;border:1px solid #c9d5dc;border-radius:12px;margin-bottom:28px;overflow:hidden}'
        '.head{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #d6e0e5}'
        '.eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;color:#0d6396}h2{margin:4px 0 0;font-size:25px}'
        '.badge{background:#e9f4ff;color:#0d5790;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:800}'
        '.viewer{padding:16px 20px}.toolbar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}'
        'button{border:1px solid #aab9c2;background:white;padding:8px 12px;border-radius:7px;font-weight:700;cursor:pointer}'
        'button:hover{background:#edf6fb}.viewport{height:620px;border:2px solid #9fb1bc;border-radius:8px;overflow:auto;background:white;display:flex;align-items:center;justify-content:center}'
        '.viewport img{display:block;width:84%;min-width:900px;max-width:none;transform-origin:center center;transition:transform .12s ease}'
        '.facts{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 20px 14px}.fact{padding:14px 16px;border-radius:8px;border:1px solid}'
        '.fact small{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;margin-bottom:5px}.fact strong{font-size:22px}'
        '.blue{background:#eaf4ff;border-color:#b6d5ea}.green{background:#edf8f0;border-color:#badfc4}'
        '.note{margin:0 20px 20px;background:#fff7e8;border:1px solid #e2bd77;color:#6e4500;padding:12px;border-radius:8px}'
        '@media(max-width:900px){.head{align-items:flex-start;flex-direction:column;gap:10px}.facts{grid-template-columns:1fr}.viewport{height:460px}.viewport img{min-width:720px}}'
        '</style>'
        '<script>function zoomImg(id,z){document.getElementById("img-"+id).style.transform="scale("+z+")";}</script>'
        '</head><body>'
        '<div class="top"><h1>KMG PRELUDE 60 · Ясен преглед на размерите</h1>'
        '<p>Големи оригинални чертежи · четими коти · zoom 100–250% · отделена работна логика</p></div>'
        '<div class="wrap">' + ''.join(cards) + '</div></body></html>'
    )
    (out / "index.html").write_text(html_doc, encoding="utf-8")

    print("=== PRELUDE CLEAR DIMENSION REVIEW PASS ===")
    print("Large drawings: YES")
    print("Zoom 100 / 150 / 200 / 250: YES")
    print("Catalogue dimensions remain on original sketch: YES")
    print("Human-confirmed rules separated: YES")
    print("False 22 mm contour overlay: NO")
    print("Machine ready: NO")

if __name__ == "__main__":
    main()
