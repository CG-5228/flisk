# GitHub topic discovery report — 2026-10-19

This scans 15 TDK-relevant topics with 91 GitHub API calls. GitHub repository counts are discovery proxies; they do not show that a topic label increases traffic.

## How to read the signals

- **Acceleration** compares repositories created in the latest 30 days with the preceding 30 days.
- **90-day baseline** compares the latest 90 days with the prior 90 days.
- **Absolute demand** is the total repositories and new repositories in the 90-day window.
- **Confidence** is based on the 90-day new-repository sample: high ≥100, medium ≥25, low <25; samples under 10 are classified too small/noisy.
- **Historical snapshots** are appended weekly in `github-topic-history.csv`; the weekly rolling-window change compares this report's 30-day new-repository count with the prior saved snapshot, exposing whether momentum is rising or falling.

Trend labels are evidence summaries, not predictions. ‘Emerging’ requires positive acceleration and a positive 90-day baseline; ‘Trending now’ adds substantial total and recent demand; large, slowing topics are marked established.

## Add-label recommendations

TDK currently uses 20 of GitHub's 20 topic slots. Only absent topics that accurately describe TDK are considered.

- **`development-environment` (not assigned; direct fit):** describes TDK's core local-development product. Evidence: Trending now; 201 vs 50 newly created repositories in the latest/prior 30 days (+302.0%); 90-day change +308.2% (298 new repositories); 432 pushed in 30 days; high confidence.
- **`python` (not assigned; supported fit):** TDK supports a Python backend and includes a runnable example. Evidence: Trending now; 55712 vs 44483 newly created repositories in the latest/prior 30 days (+25.2%); 90-day change +24.7% (145171 new repositories); 131946 pushed in 30 days; high confidence.

TDK is at the 20-topic limit, so the recommended next change is to replace `hacktoberfest2026` with `development-environment` after that campaign ends, if the accelerating and baseline signals remain positive. `python` is a second, capability-backed candidate. Do not add rare-language tags based on rarity alone.

This is a relevance and momentum recommendation, not a claim that a tag causes traffic growth. Validate impact with repository traffic before/after a relevant change.

| Topic | Fit | On TDK | Classification | Total | New 30d | Prior 30d | Acceleration | Weekly 30d change | New 90d | Prior 90d | 90d change | Active 30d | Confidence |
|---|---|:---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| cli | direct | no | Trending now | 151189 | 19697 | 10040 | +96.2% | first snapshot | 39484 | 25378 | +55.6% | 42878 | high |
| developer-experience | direct | yes | Trending now | 1936 | 296 | 159 | +86.2% | first snapshot | 603 | 372 | +62.1% | 696 | high |
| developer-tools | direct | yes | Trending now | 87320 | 16932 | 9723 | +74.1% | first snapshot | 36557 | 22290 | +64.0% | 36744 | high |
| development-environment | direct | no | Trending now | 1990 | 201 | 50 | +302.0% | first snapshot | 298 | 73 | +308.2% | 432 | high |
| docker | direct | yes | Mixed / watch | 230023 | 9156 | 7678 | +19.2% | first snapshot | 25153 | 21969 | +14.5% | 30351 | high |
| docker-compose | direct | yes | Trending now | 52796 | 1818 | 1376 | +32.1% | first snapshot | 4607 | 3515 | +31.1% | 5432 | high |
| local-development | direct | yes | Trending now | 1107 | 128 | 100 | +28.0% | first snapshot | 308 | 174 | +77.0% | 366 | high |
| starlark | direct | yes | Mixed / watch | 164 | 4 | 5 | -20.0% | first snapshot | 16 | 13 | +23.1% | 39 | low |
| tilt | direct | yes | Mixed / watch | 217 | 7 | 7 | +0.0% | first snapshot | 18 | 17 | +5.9% | 32 | low |
| tiltfile | direct | yes | Too small / noisy | 7 | 1 | 0 | +100.0% | first snapshot | 1 | 0 | +100.0% | 1 | low |
| devops | adjacent | yes | Established / slowing | 48168 | 3388 | 3691 | -8.2% | first snapshot | 9945 | 9010 | +10.4% | 9959 | high |
| microservices | adjacent | yes | Established / slowing | 22076 | 747 | 646 | +15.6% | first snapshot | 2084 | 2249 | -7.3% | 2625 | high |
| python | supported | no | Trending now | 961471 | 55712 | 44483 | +25.2% | first snapshot | 145171 | 116454 | +24.7% | 131946 | high |
| traefik | adjacent | yes | Trending now | 2840 | 89 | 66 | +34.8% | first snapshot | 225 | 220 | +2.3% | 482 | high |
| typescript | supported | yes | Trending now | 484929 | 31185 | 24282 | +28.4% | first snapshot | 79797 | 55705 | +43.2% | 88189 | high |
