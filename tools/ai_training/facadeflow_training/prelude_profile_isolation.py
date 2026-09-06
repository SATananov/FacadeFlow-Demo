from __future__ import annotations
import argparse, html, json
from pathlib import Path
import fitz

def rgb(value):
    if not value:
        return "none"
    vals = [max(0, min(255, round(float(v) * 255))) for v in value[:3]]
    return f"rgb({vals[0]},{vals[1]},{vals[2]})"

def pt(p, x0, y0):
    return f"{float(p.x)-x0:.4f},{float(p.y)-y0:.4f}"

def path_d(items, x0, y0):
    chunks, current = [], None
    for item in items:
        op = item[0]
        if op == "l":
            p1, p2 = item[1], item[2]
            s, e = pt(p1,x0,y0), pt(p2,x0,y0)
            if current != s:
                chunks.append(f"M {s}")
            chunks.append(f"L {e}")
            current = e
        elif op == "c":
            p1, c1, c2, p2 = item[1], item[2], item[3], item[4]
            s = pt(p1,x0,y0)
            if current != s:
                chunks.append(f"M {s}")
            chunks.append(f"C {pt(c1,x0,y0)} {pt(c2,x0,y0)} {pt(p2,x0,y0)}")
            current = pt(p2,x0,y0)
        elif op == "re":
            r = item[1]
            x, y = float(r.x0)-x0, float(r.y0)-y0
            w, h = float(r.x1-r.x0), float(r.y1-r.y0)
            chunks.append(f"M {x:.4f},{y:.4f} h {w:.4f} v {h:.4f} h {-w:.4f} Z")
            current = None
    return " ".join(chunks)

def extract_svg(page, box):
    clip = fitz.Rect(*box)
    x0, y0, x1, y1 = map(float, box)
    w, h = x1-x0, y1-y0
    paths, used = [], 0

    for drawing in page.get_drawings():
        if not drawing["rect"].intersects(clip):
            continue
        d = path_d(drawing.get("items", []), x0, y0)
        if not d:
            continue

        stroke = rgb(drawing.get("color"))
        fill = rgb(drawing.get("fill"))
        width = max(0.18, float(drawing.get("width") or 0.25))
        so = float(drawing.get("stroke_opacity") or 1.0)
        fo = float(drawing.get("fill_opacity") or 1.0)

        paths.append(
            '<path d="' + d + '" stroke="' + stroke + '" fill="' + fill + '" '
            + f'stroke-width="{width:.4f}" stroke-opacity="{so:.4f}" '
            + f'fill-opacity="{fo:.4f}" stroke-linejoin="round" stroke-linecap="round"/>'
        )
        used += 1

    out_h = round(640*h/w)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.4f} {h:.4f}" '
        f'width="640" height="{out_h}" preserveAspectRatio="xMidYMid meet">'
        '<rect width="100%" height="100%" fill="white"/>'
        f'<defs><clipPath id="clip"><rect x="0" y="0" width="{w:.4f}" height="{h:.4f}"/></clipPath></defs>'
        '<g clip-path="url(#clip)">' + ''.join(paths) + '</g></svg>'
    )
    return svg, used

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    pdf = Path(args.pdf)
    manifest_path = Path(args.manifest)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    cfg = json.loads(manifest_path.read_text(encoding="utf-8"))
    doc = fitz.open(pdf)
    page = doc[int(cfg["source_page"])-1]

    cards = []
    generated = {}

    for code, profile in cfg["profiles"].items():
        safe = code.replace(".", "_")
        generated[code] = {}
        for key, suffix in (
            ("catalogue_section_box", "clean_catalogue_section"),
            ("profile_body_box", "profile_body_candidate"),
        ):
            svg, count = extract_svg(page, profile[key])
            name = f"{safe}_{suffix}.svg"
            (out / name).write_text(svg, encoding="utf-8")
            generated[code][suffix] = {"svg": name, "vector_paths_used": count, "pdf_box": profile[key]}

        formula = profile["human_confirmed"]["formula"]
        cards.append(
            '<article class="card">'
            f'<h2>{html.escape(code)} · {html.escape(profile["label_bg"])}</h2>'
            '<div class="cols">'
            f'<section><h3>Clean catalogue vector</h3><img src="{safe}_clean_catalogue_section.svg"></section>'
            f'<section><h3>Profile body candidate</h3><img src="{safe}_profile_body_candidate.svg"></section>'
            '</div>'
            f'<p><strong>Human-confirmed:</strong> {html.escape(formula)}</p>'
            '</article>'
        )

    (out / "manifest.json").write_text(
        json.dumps({"system": cfg["system"], "generated": generated, "safety": cfg["safety"]},
                   ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    page_html = (
        '<!doctype html><html lang="bg"><head><meta charset="utf-8">'
        '<title>PRELUDE 60 Profile Isolation</title><style>'
        'body{font-family:Arial,sans-serif;background:#f3f6f8;color:#17232b;margin:24px}'
        '.warning{background:#fff3d2;border:1px solid #e5bd58;padding:12px;border-radius:8px}'
        '.card{background:white;border:1px solid #cfd9df;border-radius:10px;padding:18px;margin:18px 0}'
        '.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}'
        'section{border:1px solid #dce4e8;border-radius:8px;padding:12px}'
        'img{width:100%;height:420px;object-fit:contain;background:white}'
        '@media(max-width:900px){.cols{grid-template-columns:1fr}}'
        '</style></head><body>'
        '<h1>KMG PRELUDE 60 · Profile Isolation Lab</h1>'
        '<p class="warning"><strong>Важно:</strong> vector linework е директно от оригиналния PDF drawing layer. '
        'Profile body candidate още НЕ е production contour.</p>'
        + ''.join(cards) +
        '</body></html>'
    )
    (out / "index.html").write_text(page_html, encoding="utf-8")

    print("=== PRELUDE PROFILE ISOLATION CANDIDATES PASS ===")
    for code, parts in generated.items():
        print(f"{code}: clean {parts['clean_catalogue_section']['vector_paths_used']} paths | "
              f"body {parts['profile_body_candidate']['vector_paths_used']} paths")
    print("PDF text excluded: YES")
    print("AI-redrawn geometry: NO")
    print("Human verification required: YES")
    print("Production contour validated: NO")
    print("Machine ready: NO")

if __name__ == "__main__":
    main()
