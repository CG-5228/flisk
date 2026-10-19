#!/usr/bin/env python3
"""Rank GitHub repository topics by size, recent creation, and activity."""
from __future__ import annotations

import csv
import http.client
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

CANDIDATE_TOPICS = {"development-environment", "python", "nim", "pony", "agda"}
LABEL_ADVICE = {
    "development-environment": "Best next topic to add: it directly describes TDK's core product. Because all 20 topic slots are occupied, replace the time-bound hacktoberfest2026 topic after the 2026 campaign.",
    "python": "Consider adding: TDK has a Python backend provider and a runnable Python example.",
    "nim": "Do not add yet: no maintained Nim provider or example is present.",
    "pony": "Do not add yet: no maintained Pony provider or example is present.",
    "agda": "Do not add yet: no maintained Agda provider or example is present.",
}

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


def current_topics(token: str | None) -> set[str]:
    return set(api_get("/repos/tdk-landscape/tdk-cli-core/topics", {}, token).get("names", []))


def main() -> None:
    now = datetime.now(timezone.utc).date()
    recent_since = now - timedelta(days=90)
    active_since = now - timedelta(days=30)
    previous_recent_since = recent_since - timedelta(days=90)
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    assigned_topics = current_topics(token)
    topics = sorted(assigned_topics | CANDIDATE_TOPICS)

    rows = []
    for topic in topics:
        total = count(token, topic)
        recent = count(token, topic, f"created:>={recent_since.isoformat()}")
        previous = count(token, topic, f"created:{previous_recent_since.isoformat()}..{(recent_since - timedelta(days=1)).isoformat()}")
        active = count(token, topic, f"pushed:>={active_since.isoformat()}")
        growth = round((recent - previous) / previous * 100, 1) if previous else (100.0 if recent else 0.0)
        volume_factor = min(1.0, (recent / 100) ** 0.5)
        activity_factor = min(1.0, active / max(recent, 1))
        trend_score = round((growth / 100) * volume_factor * activity_factor, 3)
        rows.append({
            "topic": topic,
            "current_repo_topic": topic in assigned_topics,
            "total_repos": total,
            "new_repos_last_90d": recent,
            "new_repos_previous_90d": previous,
            "new_repo_growth_pct": growth,
            "active_repos_last_30d": active,
            "trend_score": trend_score,
            "created_since": recent_since.isoformat(),
            "active_since": active_since.isoformat(),
        })
        print(f"{topic:<34} total={total:>8} new90d={recent:>7} prev90d={previous:>7} growth={growth:>7.1f}% active30d={active:>7}", flush=True)
        time.sleep(0.25)

    rows.sort(key=lambda row: (row["trend_score"], row["new_repos_last_90d"], row["active_repos_last_30d"]), reverse=True)
    out = Path(os.getenv("OUTPUT_DIR", "."))
    out.mkdir(parents=True, exist_ok=True)
    with (out / "github-topic-trends.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys(), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    top = rows[:10]
    with (out / "github-topic-trends.md").open("w", encoding="utf-8") as file:
        file.write(f"# GitHub topic trends — {now.isoformat()}\n\n")
        file.write("Counts come from GitHub repository search. Growth compares newly created matching repositories in the latest 90 days with the prior 90 days. Activity means pushed in the last 30 days. Trend score is growth multiplied by a volume factor (capped at 100 new repositories) and an activity factor (active repositories relative to new repositories), to reduce small-sample spikes. The workflow fetches TDK's current topic labels each run and marks them in the CSV. Experimental language topics are comparison only; trends do not establish product fit.\n\n")
        file.write(f"## Label recommendation\n\nTDK currently has {len(assigned_topics)} of GitHub's 20 available topic slots.\n\n")
        for topic, advice in LABEL_ADVICE.items():
            state = "already assigned" if topic in assigned_topics else "not assigned"
            row = next((item for item in rows if item["topic"] == topic), None)
            trend = f" Latest 90-day growth: {row['new_repo_growth_pct']:.1f}% ({row['new_repos_last_90d']} new; {row['active_repos_last_30d']} active in 30 days)." if row else ""
            file.write(f"- `{topic}` ({state}): {advice}{trend}\n")
        file.write("The report never changes repository metadata.\n\n")
        file.write("| Topic | On TDK | Total repos | New (90d) | Prior 90d | Growth | Active (30d) | Score |\n|---|:---:|---:|---:|---:|---:|---:|---:|\n")
        for row in top:
            current = "yes" if row["current_repo_topic"] else "no"
            file.write(f"| {row['topic']} | {current} | {row['total_repos']} | {row['new_repos_last_90d']} | {row['new_repos_previous_90d']} | {row['new_repo_growth_pct']:.1f}% | {row['active_repos_last_30d']} | {row['trend_score']:.3f} |\n")


if __name__ == "__main__":
    main()
