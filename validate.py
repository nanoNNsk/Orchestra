"""Validate orchestra.json integrity. Run after any roster edit: python validate.py

Checks the invariants the hire protocol depends on:
- every role's department exists
- every department's head is a real role that lives in that department
- every skill a role references exists in the registry
- ids are unique
"""
import json
import sys
from pathlib import Path


def validate(data):
    errors = []

    skills = {s["id"] for s in data["skills"]}
    depts = {d["id"] for d in data["departments"]}
    roles = {r["id"]: r for r in data["roles"]}

    if len(skills) != len(data["skills"]):
        errors.append("duplicate skill id")
    if len(depts) != len(data["departments"]):
        errors.append("duplicate department id")
    if len(roles) != len(data["roles"]):
        errors.append("duplicate role id")

    for r in data["roles"]:
        if r["department"] not in depts:
            errors.append(f"role '{r['id']}' in unknown department '{r['department']}'")
        for sk in r["skills"]:
            if sk not in skills:
                errors.append(f"role '{r['id']}' uses unknown skill '{sk}'")

    for d in data["departments"]:
        head = roles.get(d["head"])
        if head is None:
            errors.append(f"department '{d['id']}' head '{d['head']}' is not a role")
        elif head["department"] != d["id"]:
            errors.append(f"department '{d['id']}' head '{d['head']}' lives in '{head['department']}'")

    return errors


if __name__ == "__main__":
    data = json.loads(Path(__file__).with_name("orchestra.json").read_text())
    errors = validate(data)
    if errors:
        print("INVALID:")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print(f"OK: {len(data['departments'])} departments, "
          f"{len(data['roles'])} roles, {len(data['skills'])} skills")
