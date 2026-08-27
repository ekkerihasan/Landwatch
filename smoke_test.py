"""End-to-end check of every core feature. Run this before any demo.

Uses only the standard library, so there is nothing to install. It talks to the
running API exactly as the frontend does, and cleans up everything it creates.

    Terminal 1:  .venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000
    Terminal 2:  .venv\\Scripts\\python.exe smoke_test.py

Exit code 0 means the demo path is safe to walk through.
"""
import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8000"

passed, failed = 0, 0
created_project_id = None


def call(method, path, body=None, expect=None):
    """Return (status, parsed_body). Never raises on an HTTP error status."""
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path, data=data, method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return e.code, raw
    except urllib.error.URLError as e:
        print(f"\n  Cannot reach {BASE} — is the API running?\n  {e.reason}\n")
        sys.exit(2)


def check(label, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {label}" + (f"  {detail}" if detail else ""))
    else:
        failed += 1
        print(f"  FAIL  {label}" + (f"  {detail}" if detail else ""))


def section(title):
    print(f"\n{title}")


# --- 1. Service and model -----------------------------------------------------
section("1. Service and model")
status, health = call("GET", "/health")
check("API is up", status == 200 and health.get("status") == "ok")

status, model = call("GET", "/admin/model")
check("a trained model is loaded", model.get("status") == "loaded", model.get("model_version", ""))
check("it declares synthetic training", model.get("trained_on") == "synthetic")
metrics = (model.get("metrics") or {}).get("selected") or {}
check("metrics are reported", "roc_auc" in metrics,
      f"AUC={metrics.get('roc_auc')} recall={metrics.get('recall_delayed')}")

# --- 2. Dashboard -------------------------------------------------------------
section("2. Dashboard (the ranked caseload)")
status, projects = call("GET", "/projects")
check("project list loads", status == 200 and isinstance(projects, list), f"{len(projects)} projects")
check("sorted worst-first", projects[0]["prediction"]["risk_class"] in ("Critical", "High"),
      f"top = {projects[0]['name'][:38]}")
check("every project carries a prediction",
      all(p["prediction"].get("risk_class") for p in projects))
check("every project carries factors",
      all(len(p["prediction"]["factors"]) > 0 for p in projects))

status, filtered = call("GET", "/projects?stage=3G")
check("stage filter works", status == 200 and all(p["current_stage"] == "3G" for p in filtered),
      f"{len(filtered)} at 3G")
status, by_name = call("GET", "/projects?sort=name")
check("sort by name works", [p["name"] for p in by_name] == sorted(p["name"] for p in by_name))

# --- 3. Explanation -----------------------------------------------------------
section("3. Explanation (why a project is flagged)")
worst = projects[0]["project_id"]
status, detail = call("GET", f"/projects/{worst}")
check("detail view loads", status == 200 and detail["project_id"] == worst)
check("stage history present", len(detail["stage_history"]) > 0,
      f"{len(detail['stage_history'])} stages")
check("what-if baseline present", detail["current_features"]["compensation_pct"] is not None)

status, factors = call("GET", f"/projects/{worst}/explain")
check("SHAP factors returned", status == 200 and len(factors) >= 3)
check("factors are ranked by impact",
      all(abs(factors[i]["contribution"]) >= abs(factors[i + 1]["contribution"])
          for i in range(len(factors) - 1)))
check("factors are phrased in plain language",
      all(len(f["explanation"]) > 10 for f in factors))
print(f"        top factor: {factors[0]['explanation']}")

# --- 4. Recommendations -------------------------------------------------------
section("4. Recommendations (what to do about it)")
recs = detail["prediction"]["recommendations"]
check("critical project gets actions", len(recs) >= 3, f"{len(recs)} actions")
check("every action has an owner", all(r.get("owner") for r in recs))
check("actions ordered by urgency",
      all(recs[i]["severity"] <= recs[i + 1]["severity"] for i in range(len(recs) - 1)))
for r in recs[:3]:
    print(f"        [{r['severity']}] {r['action']} -> {r['owner']}")

healthiest = min(projects, key=lambda p: p["prediction"]["probability"])
status, healthy = call("GET", f"/projects/{healthiest['project_id']}")
check("healthy project gets no actions",
      len(healthy["prediction"]["recommendations"]) == 0,
      f"{healthy['name'][:34]} is {healthy['prediction']['risk_class']}")

# --- 5. What-if ---------------------------------------------------------------
section("4b. The V2 output card")
card = detail["prediction"]
check("card: risk class and probability", card["risk_class"] and card["probability"] <= 0.99,
      f"{card['probability']:.0%} - {card['risk_class']}")
check("card: never shows 100%", card["probability"] < 1.0)
delay = card.get("delay_estimate")
check("card: predicted delay as a RANGE", delay is not None and delay["upper_days"] >= delay["lower_days"],
      f"{delay['lower_days']}-{delay['upper_days']} days" if delay else "missing")
check("card: four or more risk factors", len(card["factors"]) >= 4)
check("card: recommended actions", len(card["recommendations"]) >= 3)
stage_rows = detail["stage_history"]
check("card: days-vs-baseline derived server-side",
      all("days_vs_baseline" in s for s in stage_rows),
      f"current stage {stage_rows[-1]['days_vs_baseline']:+d} days")
check("card: rehabilitation factor present",
      any(f["feature"] == "rehabilitation_progress_pct" for f in card["factors"]))

section("5. What-if simulator")
status, whatif = call("POST", f"/projects/{worst}/what-if",
                      {"compensation_pct": 95, "open_litigations": 0})
check("scenario runs", status == 200)
check("risk drops when the problems are fixed",
      whatif["scenario"]["probability"] < whatif["baseline"]["probability"],
      f"{whatif['baseline']['risk_class']} -> {whatif['scenario']['risk_class']}")
check("labelled as a scenario", whatif["is_scenario"] is True)
check("carries a disclaimer", "Scenario only" in whatif["disclaimer"])
status, _ = call("POST", f"/projects/{worst}/what-if", {})
check("empty scenario rejected", status == 400)

# --- 6. Flagging --------------------------------------------------------------
section("6. Flag for review")
status, flag = call("POST", f"/projects/{worst}/flag", {"note": "smoke test"})
check("flag created", status == 201 and flag["status"] == "open")
status, flags = call("GET", f"/projects/{worst}/flags")
check("flags listed", status == 200 and len(flags) >= 1)

# --- 7. Assess a site ---------------------------------------------------------
section("7. Assess a site (early prediction)")
status, bare = call("POST", "/estimate/new-project",
                    {"location": "Hubballi, Karnataka", "latitude": 15.36, "longitude": 75.12})
check("scores from a location alone", status == 200,
      f"{bare['prediction']['risk_class']} {bare['prediction']['probability']:.1%}")
check("names every assumption it made", len(bare["assumed_inputs"]) >= 4,
      ", ".join(bare["assumed_inputs"]))
check("states that location is not scored", "not used in scoring" in bare["disclaimer"])

status, detailed = call("POST", "/estimate/new-project", {
    "location": "Hubballi, Karnataka", "latitude": 15.36, "longitude": 75.12,
    "paf_count": 520, "area": 210, "expected_litigations": 4, "planned_compensation_pct": 15,
})
check("risk rises once real numbers go in",
      detailed["prediction"]["probability"] > bare["prediction"]["probability"],
      f"{bare['prediction']['risk_class']} -> {detailed['prediction']['risk_class']}")
check("estimate also recommends actions", len(detailed["prediction"]["recommendations"]) >= 2)

# --- 8. Full CRUD lifecycle ---------------------------------------------------
section("8. Create, update and delete a project")
status, new = call("POST", "/projects", {
    "name": "SMOKE TEST — delete me", "location": "Test, Karnataka",
    "sector": "National Highway", "area": 76.4, "paf_count": 140,
    "current_stage": "3A", "latitude": 12.91, "longitude": 74.85,
})
check("project created", status == 201, f"#{new['project_id']}")
created_project_id = new["project_id"]
check("a stage row opens automatically", len(new["stage_history"]) == 1)
check("new project is NOT scored Critical", new["prediction"]["risk_class"] in ("Low", "Medium"),
      f"{new['prediction']['risk_class']} {new['prediction']['probability']:.1%}")
check("missing data is declared", "compensation_pct" in new["prediction"]["missing_inputs"])

before = new["prediction"]["probability"]
call("POST", f"/projects/{created_project_id}/compensation", {"compensation_pct": 15})
call("POST", f"/projects/{created_project_id}/litigation", {"status": "pending", "type": "Title dispute"})
call("POST", f"/projects/{created_project_id}/litigation", {"status": "pending", "type": "Valuation challenge"})
call("PATCH", f"/projects/{created_project_id}", {"rehabilitation_progress_pct": 30})
status, worse = call("GET", f"/projects/{created_project_id}")
check("recording bad news raises risk", worse["prediction"]["probability"] > before,
      f"{before:.1%} -> {worse['prediction']['probability']:.1%}")
check("missing_inputs now clear", len(worse["prediction"]["missing_inputs"]) == 0,
      "all model inputs now have real data")

call("POST", f"/projects/{created_project_id}/compensation", {"compensation_pct": 92})
status, better = call("GET", f"/projects/{created_project_id}")
check("disbursing compensation lowers risk",
      better["prediction"]["probability"] < worse["prediction"]["probability"],
      f"{worse['prediction']['risk_class']} -> {better['prediction']['risk_class']}")

status, stages = call("POST", f"/projects/{created_project_id}/stages", {"stage": "3C"})
check("stage advances and closes the previous one",
      status == 201 and any(s["exited_at"] for s in stages))
status, _ = call("PATCH", f"/projects/{created_project_id}", {"current_stage": "3D"})
check("stage cannot be changed behind history's back", status == 400)

status, _ = call("DELETE", f"/projects/{created_project_id}")
check("project deleted", status == 204)
status, _ = call("GET", f"/projects/{created_project_id}")
check("deleted project is gone", status == 404)
created_project_id = None

# --- 9. Error handling --------------------------------------------------------
section("9. Error handling")
status, _ = call("GET", "/projects/999999")
check("unknown project returns 404", status == 404)
status, _ = call("POST", "/projects", {"name": "", "location": "x"})
check("invalid payload rejected", status == 422)
status, _ = call("POST", "/estimate/new-project", {"latitude": 15.0})
check("estimate without a location rejected", status == 422)

# --- Result -------------------------------------------------------------------
print(f"\n{'=' * 58}")
print(f"  {passed} passed, {failed} failed")
if failed == 0:
    print("  Core functionality is working. Safe to demo.")
else:
    print("  Something is broken — do not demo until it is fixed.")
print(f"{'=' * 58}\n")

if created_project_id:
    call("DELETE", f"/projects/{created_project_id}")

sys.exit(1 if failed else 0)
