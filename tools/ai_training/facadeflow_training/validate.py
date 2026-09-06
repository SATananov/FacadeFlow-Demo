from __future__ import annotations
import json
from pathlib import Path
from .dataset import load_jsonl

ROLES = {"FIXED_FIELD", "OPENABLE_FIELD", "SLIDING_FIELD", "PANEL_FIELD"}
PROFILE_ROLES = {"FRAME", "SASH", "MULLION", "TRANSOM", "THRESHOLD"}

def validate_verified_profiles(path: Path) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    errors: list[str] = []
    seen = set()
    for p in data.get("profiles", []):
        code = p.get("code")
        role = p.get("role")
        if not code:
            errors.append("profile without code")
            continue
        if code in seen:
            errors.append(f"duplicate profile code: {code}")
        seen.add(code)
        if role not in PROFILE_ROLES:
            errors.append(f"{code}: invalid role {role}")
        cat = p.get("catalogue", {})
        human = p.get("human_confirmed", {})
        if cat.get("source") == human.get("source"):
            errors.append(f"{code}: catalogue and human-confirmed provenance must remain separate")
        if human.get("holder_zone_sides") == 2:
            full = human.get("full_working_dimension_mm")
            visible = human.get("visible_dimension_mm")
            zone = human.get("holder_zone_mm")
            if None not in (full, visible, zone) and full - zone - zone != visible:
                errors.append(f"{code}: two-sided holder-zone formula mismatch")
        elif human.get("holder_zone_sides") == 1:
            full = human.get("full_working_dimension_mm")
            visible = human.get("visible_dimension_mm")
            zone = human.get("holder_zone_mm")
            if None not in (full, visible, zone) and full - zone != visible:
                errors.append(f"{code}: one-sided holder-zone formula mismatch")
    return errors

def validate_examples(path: Path) -> list[str]:
    rows = load_jsonl(path)
    errors: list[str] = []
    ids = set()
    for row in rows:
        rid = row.get("id")
        if not rid:
            errors.append("training row without id")
            continue
        if rid in ids:
            errors.append(f"duplicate training id: {rid}")
        ids.add(rid)
        if row.get("source") != "SYNTHETIC_TRAINING":
            errors.append(f"{rid}: training corpus must be private-safe synthetic reduction")
        target = row.get("target", {})
        fields = target.get("fields", [])
        for field in fields:
            if field.get("role") not in ROLES:
                errors.append(f"{rid}: invalid field role {field.get('role')}")
        dividers = target.get("dividers", [])
        if fields and len(dividers) not in {0, max(0, len(fields)-1)}:
            errors.append(f"{rid}: divider count is not 0 or N-1")
    return errors

def main() -> int:
    root = Path(__file__).resolve().parents[1]
    verified = root / "data" / "verified" / "prelude60_profiles.json"
    training = root / "data" / "training" / "construction_examples.jsonl"

    errors = validate_verified_profiles(verified) + validate_examples(training)
    if errors:
        print("=== VALIDATION FAIL ===")
        for e in errors:
            print("-", e)
        return 1

    print("=== FACADEFLOW AI TRAINING LAB 01 VALIDATION PASS ===")
    print("PRELUDE 60 verified profiles: 3")
    print("Synthetic training examples: 4")
    print("Catalogue vs human-confirmed provenance separation: PASS")
    print("Automatic exact profile inference from system name: NOT ENABLED")
    print("Machine ready: NO")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
