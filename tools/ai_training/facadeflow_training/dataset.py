from __future__ import annotations
import json
from pathlib import Path
from typing import Iterable

def load_jsonl(path: str | Path) -> list[dict]:
    p = Path(path)
    rows = []
    with p.open("r", encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{p}:{n}: invalid JSON: {exc}") from exc
    return rows

def save_jsonl(path: str | Path, rows: Iterable[dict]) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
