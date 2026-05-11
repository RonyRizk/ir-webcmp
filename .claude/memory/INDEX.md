# Project memory — `.claude/memory/`

Portable knowledge base for this repo. Future Claude Code sessions in this directory should read the relevant files below before starting work on a feature.

This folder travels with the repo (unlike per-user auto-memory at `~/.claude/projects/...`). Per-user notes (e.g., individual collaborator profile) still live in auto-memory.

## Cross-cutting

- [patterns_report_pages.md](patterns_report_pages.md) — Filters + KPI cards + table + export shape shared by all sales/revenue/occupancy reports. Use as template for new reports.
- [screenshots_folder.md](screenshots_folder.md) — `screenshots/*.PNG` → component mapping. Includes two naming gotchas (Daily Occupancy, Availability Alert).

## Per-feature

- [feature_calendar.md](feature_calendar.md) — `igloo-calendar` (Front Desk). Socket.io live updates; 4 stores; `igl-*` child prefix.
- [feature_booking_details.md](feature_booking_details.md) — `ir-booking-details` + drawer variant. Capability flags toggle features per host.
- [feature_booking_listing.md](feature_booking_listing.md) — `ir-booking-listing` with custom `booking_listing.store` pagination.
- [feature_monthly_bookings_report.md](feature_monthly_bookings_report.md) — UI title "Daily Occupancy"; component `ir-monthly-bookings-report`.
- [feature_daily_revenue.md](feature_daily_revenue.md) — `ir-daily-revenue`; payment-method grouped table.
- [feature_sales_by_channel.md](feature_sales_by_channel.md) — `ir-sales-by-channel`. `propertyid` is **string** here; required `mode` prop.
- [feature_sales_by_country.md](feature_sales_by_country.md) — `ir-sales-by-country` with KPI cards + flag icons; "Load More" pagination.
- [feature_agents.md](feature_agents.md) — `ir-agents` with right-drawer edit pattern (reusable CRUD model).
- [feature_unbookable_rooms.md](feature_unbookable_rooms.md) — UI title "Availability Alert"; component `ir-unbookable-rooms`; `mode` prop reflects.
- [feature_hk_tasks.md](feature_hk_tasks.md) — `ir-hk-tasks` under `ir-housekeeping/` folder; uses dedicated `hk-tasks.store`.
- [feature_housekeeping_setup.md](feature_housekeeping_setup.md) — `ir-housekeeping` settings page (distinct from `ir-hk-tasks`).

## How to use

1. The user describes a task. Identify which feature(s) it touches.
2. Read the matching `feature_*.md` files first. They contain non-obvious conventions, child component maps, and gotchas.
3. For new reports/CRUD pages, read `patterns_report_pages.md` and the closest existing feature as a template.
4. Open the matching `screenshots/*.PNG` for visual reference.
5. When a memory contradicts the current code, trust the code and update the memory.
