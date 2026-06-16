# Hiring Protocol

How Orchestra grows its org chart on-demand without bloating. The roster lives
in `orchestra.json`. Run `python validate.py` after any change.

## Who can create what

| Actor | Can create | Cannot create |
| --- | --- | --- |
| **Chairman / devs** | **Skills** (new atomic capabilities) | — |
| **CEO** | **Departments** (when no department fits the work) | Skills |
| **Department head** | **Roles** inside their own department | Skills, departments |

Skills are the atomic unit and are created **only by humans**. Roles and
departments are just text (a prompt + a list of existing skills), so agents can
mint them; skills are real capabilities, so they aren't self-minted — otherwise
near-duplicate skills explode the same way roles would.

## Two things both called "role"

- **Role definition** — `id` + `description` + `system_prompt` + `skills[]`.
  Tiny text. Permanent. This is what gets *hired* and stored in `orchestra.json`.
- **Role memory** — the context a role accumulates doing real work. Grows.
  Loaded only when the role is active; prune when stale.

Having 500 role *definitions* is cheap. Only *memory* costs, and only for active
roles. So we never auto-fire definitions.

## The hire protocol (run by a department head)

```
Head receives a task from the CEO:
  1. SCAN   read the one-line `description` of every role in your department
  2. MATCH  can an existing role do this?
              ├─ yes → reuse it (STOP)
              └─ no  → continue
  3. HIRE   write { id, department, description, system_prompt, skills[] }
              - description: one sharp line — this is all future MATCH steps see
              - skills: pick only from the existing skill registry
              - if a needed skill doesn't exist, STOP and ask the Chairman
  4. APPEND add the role to orchestra.json, then assign the task to it
  5. LOG    tell the Chairman: "Hired '<id>' into <department>"
```

The CEO runs the same loop one level up: SCAN departments, MATCH, and if none
fit, create a department (with a head role) before delegating.

`// ponytail: MATCH is a linear scan of descriptions. Add embedding search only
when one department passes ~100 roles.`

## Roster review (manual, not automatic)

Definitions never auto-expire. When the roster feels crowded or duplicated, the
Chairman runs a review: list roles whose descriptions overlap, merge or delete
by hand. No firing logic, no TTLs — a human glance is cheaper than the machinery
to automate it.
