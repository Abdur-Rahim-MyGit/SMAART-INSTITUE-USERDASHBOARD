# Daily task tracker

Commits in this repo feed an automated daily task tracker. **The tooling lives
in the admin panel repo**, not here:

- Script — [`tools/daily_tracker.py`](https://github.com/Abdur-Rahim-MyGit/ADMIN-SMAART-INSTITUTE-26/blob/claude/automate-daily-task-tracker-m8diw5/tools/daily_tracker.py)
- Setup and configuration — [`tools/README.md`](https://github.com/Abdur-Rahim-MyGit/ADMIN-SMAART-INSTITUTE-26/blob/claude/automate-daily-task-tracker-m8diw5/tools/README.md)

## What it reads from this repo

A nightly job checks this repo out alongside the admin panel and scans
`origin/dharshh` and `origin/main` for commits by `dharsinismaart@gmail.com`,
turning each day's work into rows in a monthly Excel sheet.

Commits are grouped into one task row per (day, work area). Areas come from
file paths — `front-end/`, `back-end/`, `mobile-app/`, `docs/`,
`aws-deployment/`, `nginx/`, `loadtest/`. Generated paths (`dist/`, lockfiles,
`node_modules/`) are excluded so they don't inflate the numbers.

## Two things that make your rows read better

**Descriptive commit subjects.** The tracker derives descriptions from file
paths precisely because subjects like `new files`, `changes done` or
`chnages in the ui` carry no information. A real subject line beats anything
inferred from paths.

**Non-code work won't appear.** Meetings, manual QA, deployments and calls are
invisible to git. Add them to
[`tools/manual_notes.md`](https://github.com/Abdur-Rahim-MyGit/ADMIN-SMAART-INSTITUTE-26/blob/claude/automate-daily-task-tracker-m8diw5/tools/manual_notes.md)
in the admin repo:

```
## 2026-08-28
- [Meetings] Sprint planning with the placement team | 1h
- [Testing] Manual QA pass on the course progress flow
```

## Adding a new area

If this repo gains a top-level directory, add it to the `areas` list in
`tools/tracker_config.json` in the admin repo — otherwise its files land under
"Other".
