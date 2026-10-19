#!/usr/bin/env python3
"""Rank GitHub repository topics by size, recent creation, and activity."""
from __future__ import annotations

import csv
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

TOPICS = [
    # TDK's current topics, plus a few language and tooling hypotheses to evaluate.
    "bun", "cli", "developer-experience", "developer-tools",
    "development-environment", "devops", "docker", "docker-compose",
    "docker-compose-alternative", "hot-reload", "inner-loop",
    "local-development", "microservices", "starlark", "tilt", "tiltfile",
    "traefik", "typescript", "nix", "nim", "pony", "idris", "agda",
    "prolog",
]
CURRENT_TOPICS = {
    "bun", "cli", "developer-experience", "developer-tools", "development-environment",
    "devops", "docker", "docker-compose", "docker-compose-alternative", "hacktoberfest",
    "hacktoberfest2026", "hot-reload", "inner-loop", "local-development", "microservices",
    "starlark", "tilt", "tiltfile", "traefik", "typescript",
}

API = "https://api.github.com/search/repositories"


def count(token: str | None, topic: str, qualifier: str = "") -> int:
    query = f"topic:{topic} {qualifier}".strip()
    for _attempt in range(5):
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "tdk-github-topic-trends",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        url = f"{API}?{urlencode({'q': query, 'per_page': 1})}"
        request = Request(url, headers=headers)
        try:
            with urlopen(request, timeout=30) as response:
                return int(json.load(response).get("total_count", 0))
        except HTTPError as error:
            if error.code == 403 and error.headers.get("X-RateLimit-Remaining") == "0":
                reset = int(error.headers.get("X-RateLimit-Reset", time.time() + 60))
                time.sleep(max(1, min(reset - int(time.time()) + 1, 90)))
                continue
            if error.code == 422:  # GitHub search can reject malformed/unsupported queries
                print(f"Skipping unsupported query: {query}", file=sys.stderr)
                return 0
            raise
    raise RuntimeError(f"GitHub rate limit persisted for query: {query}")


def main() -> None:
    now = datetime.now(timezone.utc).date()
    recent_since = now - timedelta(days=90)
    active_since = now - timedelta(days=30)
    previous_recent_since = recent_since - timedelta(days=90)
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")

    rows = []
    for topic in TOPICS:
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
            "current_repo_topic": topic in CURRENT_TOPICS,
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
        file.write("Counts come from GitHub repository search. Growth compares newly created matching repositories in the latest 90 days with the prior 90 days. Activity means pushed in the last 30 days. Trend score is growth multiplied by a volume factor (capped at 100 new repositories) and an activity factor (active repositories relative to new repositories), to reduce small-sample spikes. Topics already assigned to TDK are marked. Experimental language topics are included for comparison only; a trend signal does not prove product fit or justify adding a tag without maintained support. The workflow never changes repository metadata.\n\n")
        file.write("| Topic | On TDK | Total repos | New (90d) | Prior 90d | Growth | Active (30d) | Score |\n|---|:---:|---:|---:|---:|---:|---:|---:|\n")
        for row in top:
            current = "yes" if row["current_repo_topic"] else "no"
            file.write(f"| {row['topic']} | {current} | {row['total_repos']} | {row['new_repos_last_90d']} | {row['new_repos_previous_90d']} | {row['new_repo_growth_pct']:.1f}% | {row['active_repos_last_30d']} | {row['trend_score']:.3f} |\n")


if __name__ == "__main__":
    main()
