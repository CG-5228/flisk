#!/usr/bin/env python3
"""Explain whether relevant GitHub topics are emerging, established, or too noisy."""
from __future__ import annotations

import csv
import http.client
import json
import os
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

# Keep the scan focused on TDK's product and ecosystem. Fifteen topics × six
# search windows stays within the requested ~100-search weekly budget.
TRACKED_TOPICS = {
    "cli", "developer-experience", "developer-tools", "development-environment",
    "devops", "docker", "docker-compose", "local-development", "microservices",
    "python", "starlark", "tilt", "tiltfile", "traefik", "typescript",
}
TOPIC_FIT = {
    "development-environment": "direct",
    "python": "supported",
    "cli": "direct",
    "developer-experience": "direct",
    "developer-tools": "direct",
    "development-environment": "direct",
    "devops": "adjacent",
    "docker": "direct",
    "docker-compose": "direct",
    "local-development": "direct",
    "microservices": "adjacent",
    "starlark": "direct",
    "tilt": "direct",
    "tiltfile": "direct",
    "traefik": "adjacent",
    "typescript": "supported",
}
FIT_REASON = {
    "development-environment": "describes TDK's core local-development product",
    "python": "TDK supports a Python backend and includes a runnable example",
}
HISTORY_FIELDS = [
    "snapshot_date", "topic", "current_repo_topic", "total_repos",
    "new_last_30d", "new_previous_30d", "new_last_90d", "new_previous_90d",
    "active_last_30d", "acceleration_pct", "growth_90d_pct",
    "weekly_rolling_30d_change_pct", "confidence", "classification",
]


def api_get(path: str, params: dict[str, str], token: str | None) -> dict:
    """Call the fixed api.github.com host; only an encoded query path is dynamic."""
    target = f"{path}?{urlencode(params)}"
    for _attempt in range(5):
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "tdk-github-topic-trends",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        connection = http.client.HTTPSConnection("api.github.com", timeout=30)
        try:
            connection.request("GET", target, headers=headers)
            response = connection.getresponse()
            body = response.read()
            if response.status == 403 and response.getheader("X-RateLimit-Remaining") == "0":
                reset = int(response.getheader("X-RateLimit-Reset", time.time() + 60))
                time.sleep(max(1, min(reset - int(time.time()) + 1, 90)))
                continue
            if response.status == 422:
                print(f"Skipping unsupported GitHub query: {params.get('q', path)}", file=sys.stderr)
                return {}
            if response.status >= 400:
                raise RuntimeError(f"GitHub API returned HTTP {response.status}: {body.decode('utf-8', errors='replace')}")
            return json.loads(body)
        finally:
            connection.close()
    raise RuntimeError(f"GitHub rate limit persisted for request: {target}")


def count(token: str | None, topic: str, qualifier: str = "") -> int:
    query = f"topic:{topic} {qualifier}".strip()
    return int(api_get("/search/repositories", {"q": query, "per_page": "1"}, token).get("total_count", 0))


def pct_change(current: int, previous: int) -> float:
    return round((current - previous) / previous * 100, 1) if previous else (100.0 if current else 0.0)


def classify(total: int, new90: int, acceleration: float, growth90: float) -> tuple[str, str]:
    if new90 < 10:
        return "Too small / noisy", "low"
    confidence = "high" if new90 >= 100 else "medium" if new90 >= 25 else "low"
    if acceleration >= 20 and growth90 > 0:
        return ("Trending now" if total >= 1000 and new90 >= 100 else "Emerging"), confidence
    if total >= 10000 and (growth90 <= 0 or acceleration < 0):
        return "Established / slowing", confidence
    if total < 100 and new90 < 25:
        return "Too small / noisy", "low"
    return "Mixed / watch", confidence


def read_history(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    today = datetime.now(timezone.utc).date()
    d30 = today - timedelta(days=30)
    d60 = today - timedelta(days=60)
    d90 = today - timedelta(days=90)
    d180 = today - timedelta(days=180)
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    current_topics = set(api_get("/repos/tdk-landscape/tdk-cli-core/topics", {}, token).get("names", []))
    api_gets_per_run = 1 + len(TRACKED_TOPICS) * 6
    rows = []

    for topic in sorted(TRACKED_TOPICS):
        total = count(token, topic)
        recent30 = count(token, topic, f"created:>={d30.isoformat()}")
        previous30 = count(token, topic, f"created:{d60.isoformat()}..{(d30 - timedelta(days=1)).isoformat()}")
        recent90 = count(token, topic, f"created:>={d90.isoformat()}")
        previous90 = count(token, topic, f"created:{d180.isoformat()}..{(d90 - timedelta(days=1)).isoformat()}")
        active30 = count(token, topic, f"pushed:>={d30.isoformat()}")
        acceleration = pct_change(recent30, previous30)
        growth90 = pct_change(recent90, previous90)
        label, confidence = classify(total, recent90, acceleration, growth90)
        row = {
            "snapshot_date": today.isoformat(),
            "topic": topic,
            "current_repo_topic": topic in current_topics,
            "total_repos": total,
            "new_last_30d": recent30,
            "new_previous_30d": previous30,
            "new_last_90d": recent90,
            "new_previous_90d": previous90,
            "active_last_30d": active30,
            "acceleration_pct": acceleration,
            "growth_90d_pct": growth90,
            "confidence": confidence,
            "classification": label,
        }
        rows.append(row)
        print(f"{topic:<28} {label:<20} total={total:>8} new30={recent30:>6}/{previous30:<6} accel={acceleration:>7.1f}% growth90={growth90:>7.1f}% confidence={confidence}", flush=True)
        time.sleep(0.2)

    rows.sort(key=lambda row: (TOPIC_FIT[row["topic"]] != "direct", row["topic"]))
    out = Path(os.getenv("OUTPUT_DIR", "reports/github-topics"))
    out.mkdir(parents=True, exist_ok=True)
    snapshot_path = out / "github-topic-trends.csv"

    history_path = out / "github-topic-history.csv"
    history = read_history(history_path)
    prior_snapshots = [r for r in history if r.get("snapshot_date", "") < today.isoformat()]
    prior_date = max((r["snapshot_date"] for r in prior_snapshots), default=None)
    prior_by_topic = {r["topic"]: r for r in prior_snapshots if r["snapshot_date"] == prior_date}
    for row in rows:
        prior = prior_by_topic.get(row["topic"])
        row["weekly_rolling_30d_change_pct"] = (
            pct_change(row["new_last_30d"], int(prior["new_last_30d"])) if prior else ""
        )
    # Make workflow_dispatch reruns idempotent for a given UTC date.
    history = [r for r in history if r.get("snapshot_date") != today.isoformat()]
    history.extend(rows)
    history.sort(key=lambda r: (r["snapshot_date"], r["topic"]))
    write_csv(snapshot_path, rows, HISTORY_FIELDS)
    write_csv(history_path, history, HISTORY_FIELDS)

    md_path = out / "github-topic-trends.md"
    with md_path.open("w", encoding="utf-8") as file:
        file.write(f"# GitHub topic discovery report — {today.isoformat()}\n\n")
        file.write(f"This scans {len(TRACKED_TOPICS)} TDK-relevant topics with {api_gets_per_run} GitHub API calls. GitHub repository counts are discovery proxies; they do not show that a topic label increases traffic.\n\n")
        file.write("## How to read the signals\n\n")
        file.write("- **Acceleration** compares repositories created in the latest 30 days with the preceding 30 days.\n- **90-day baseline** compares the latest 90 days with the prior 90 days.\n- **Absolute demand** is the total repositories and new repositories in the 90-day window.\n- **Confidence** is based on the 90-day new-repository sample: high ≥100, medium ≥25, low <25; samples under 10 are classified too small/noisy.\n- **Historical snapshots** are appended weekly in `github-topic-history.csv`, Weekly rolling-window change compares this report's 30-day new-repository count with the prior saved snapshot, exposing whether momentum is rising or falling.\n\n")
        file.write("Trend labels are evidence summaries, not predictions. ‘Emerging’ requires positive acceleration and a positive 90-day baseline; ‘Trending now’ adds substantial total and recent demand; large, slowing topics are marked established.\n\n")
        file.write(f"## Add-label recommendations\n\nTDK currently uses {len(current_topics)} of GitHub's 20 topic slots. Only absent topics that accurately describe TDK are considered.\n\n")
        for topic in ("development-environment", "python"):
            row = next(r for r in rows if r["topic"] == topic)
            state = "already assigned" if topic in current_topics else "not assigned"
            reason = FIT_REASON[topic]
            file.write(f"- **`{topic}` ({state}; {TOPIC_FIT[topic]} fit):** {reason}. Evidence: {row['classification']}; {row['new_last_30d']} vs {row['new_previous_30d']} newly created repositories in the latest/prior 30 days ({row['acceleration_pct']:+.1f}%); 90-day change {row['growth_90d_pct']:+.1f}% ({row['new_last_90d']} new repositories); {row['active_last_30d']} pushed in 30 days; {row['confidence']} confidence.\n")
        file.write("\nTDK is at the 20-topic limit, so the recommended next change is to replace `hacktoberfest2026` with `development-environment` after that campaign ends, if the accelerating and baseline signals remain positive. `python` is a second, capability-backed candidate. Do not add rare-language tags based on rarity alone.\n\n")
        file.write("This is a relevance and momentum recommendation, not a claim that a tag causes traffic growth. Validate impact with repository traffic before/after a relevant change.\n\n")
        file.write("| Topic | Fit | On TDK | Classification | Total | New 30d | Prior 30d | Acceleration | Weekly 30d change | New 90d | Prior 90d | 90d change | Active 30d | Confidence |\n|---|---|:---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|\n")
        for row in rows:
            weekly_change = f"{row['weekly_rolling_30d_change_pct']:+.1f}%" if row["weekly_rolling_30d_change_pct"] != "" else "first snapshot"
            file.write(f"| {row['topic']} | {TOPIC_FIT[row['topic']]} | {'yes' if row['current_repo_topic'] else 'no'} | {row['classification']} | {row['total_repos']} | {row['new_last_30d']} | {row['new_previous_30d']} | {row['acceleration_pct']:+.1f}% | {weekly_change} | {row['new_last_90d']} | {row['new_previous_90d']} | {row['growth_90d_pct']:+.1f}% | {row['active_last_30d']} | {row['confidence']} |\n")


if __name__ == "__main__":
    main()
