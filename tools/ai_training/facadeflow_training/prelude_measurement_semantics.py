from __future__ import annotations
import argparse, json, html
from pathlib import Path

def ruler_svg(total, visible, zones, equation):
    width = 560.0
    x0 = 20.0
    y = 55.0
    h = 72.0
    parts = []
    if len(zones) == 1:
        parts = [("Работна зона", zones[0], "#ffedd5"), ("Видима част", visible, "#dbeafe")]
    else:
        parts = [("Работна зона", zones[0], "#ffedd5"), ("Видима част", visible, "#dbeafe"), ("Работна зона", zones[1], "#ffedd5")]
    rects, labels = [], []
    x = x0
    for label, mm, fill in parts:
        w = width * (mm / total)
        rects.append(f'<rect x="{x:.2f}" y="{y}" width="{w:.2f}" height="{h}" fill="{fill}" stroke="#334155"/>')
        labels.append(f'<text x="{x+w/2:.2f}" y="{y+32}" text-anchor="middle" font-size="16">{html.escape(label)}</text>')
        labels.append(f'<text x="{x+w/2:.2f}" y="{y+55}" text-anchor="middle" font-size="18" font-weight="700">{mm} mm</text>')
        x += w
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 610 180">'
        '<rect width="100%" height="100%" fill="white"/>'
        f'<text x="20" y="26" font-size="18" font-weight="700">Общ работен размер: {total} mm</text>'
        + ''.join(rects) + ''.join(labels) +
        f'<text x="300" y="160" text-anchor="middle" font-size="18">{html.escape(equation)}</text>'
        '</svg>'
    )

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--lab03-output", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    cfg = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    lab03 = Path(args.lab03_output)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    cards = []
    for code, p in cfg["profiles"].items():
        safe = code.replace(".", "_")
        src = lab03 / f"{safe}_clean_catalogue_section.svg"
        if not src.exists():
            raise SystemExit(f"Missing Lab03 source: {src}")

        cat_name = f"{safe}_catalogue_vector.svg"
        (out / cat_name).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")

        ruler_name = f"{safe}_measurement_semantics.svg"
        (out / ruler_name).write_text(
            ruler_svg(p["working_total_mm"], p["visible_mm"], p["zones_mm"], p["equation"]),
            encoding="utf-8"
        )

        note = p.get("note", "")
        note_html = f'<p class="note">{html.escape(note)}</p>' if note else ""
        cards.append(
            '<article class="card">'
            f'<h2>{html.escape(code)} · {html.escape(p["label_bg"])}</h2>'
            '<div class="cols">'
            f'<section><h3>Истински каталогов вектор</h3><img src="{cat_name}"></section>'
            f'<section><h3>Потвърдена работна размерна логика</h3><img src="{ruler_name}"></section>'
            '</div>'
            f'<p><strong>Формула:</strong> {html.escape(p["equation"])}</p>'
            f'<p><strong>Anchor status:</strong> {html.escape(p["placement_status"])}</p>'
            + note_html +
            '</article>'
        )

    html_doc = (
        '<!doctype html><html lang="bg"><head><meta charset="utf-8">'
        '<title>PRELUDE 60 Measurement Semantics</title><style>'
        'body{font-family:Arial,sans-serif;background:#f4f7f9;color:#17212b;margin:24px}'
        '.warn{background:#fff4d6;border:1px solid #e3b950;padding:12px;border-radius:8px}'
        '.card{background:white;border:1px solid #cfd8df;border-radius:10px;padding:18px;margin:18px 0}'
        '.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}'
        'section{border:1px solid #dbe3e8;border-radius:8px;padding:12px}'
        'img{width:100%;height:360px;object-fit:contain;background:white}'
        '.note{color:#7c2d12;background:#fff7ed;padding:10px;border-radius:7px}'
        '@media(max-width:900px){.cols{grid-template-columns:1fr}}'
        '</style></head><body>'
        '<h1>KMG PRELUDE 60 · Measurement Semantics Lab</h1>'
        '<p class="warn"><strong>Важно:</strong> размерната логика е потвърдена, но точните geometric anchor points върху контура още НЕ са валидирани. '
        'Затова размерният ruler е отделен и не се наслагва фалшиво върху профила.</p>'
        + ''.join(cards) +
        '</body></html>'
    )
    (out / "index.html").write_text(html_doc, encoding="utf-8")
    (out / "manifest.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")

    print("=== PRELUDE MEASUREMENT SEMANTICS PASS ===")
    print("482.30: 64 - 22 = 42")
    print("482.05: 78 - 22 = 56")
    print("482.21: 84 - 22 - 22 = 40")
    print("Catalogue vector preserved: YES")
    print("Geometric anchor points validated: NO")
    print("Machine ready: NO")

if __name__ == "__main__":
    main()
