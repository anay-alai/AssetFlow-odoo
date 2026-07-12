# AssetFlow API Specification

All responses use the envelope `{ success: boolean, data?, error?, meta? }`.
Auth: send `Authorization: Bearer <jwt>` on every protected route.
Roles: `admin`, `asset_manager`, `dept_head`, `employee`.

## Auth — `/api/auth`
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/signup` | public | `role` is stripped server-side; always creates `employee`. bcrypt cost 12. |
| POST | `/login` | public | Rejects inactive users. Returns `{ token, user }`. |
| POST | `/forgot-password` | public | Generates a hashed reset token (1h expiry); emails a stub (logged in dev). Always 200. |
| POST | `/reset-password` | public | `{ token, password }`; validates hash + expiry. |
| GET | `/me` | any | Current profile. |

## Organization — `/api`
| Method | Path | Roles |
|---|---|---|
| GET/POST | `/departments` | GET any / POST admin |
| GET/POST | `/categories` | GET any / POST admin (validates `custom_fields` JSON) |
| GET | `/employees` | admin, asset_manager, dept_head (paginated) |
| PUT | `/employees/:id/role` | **admin only** — the only endpoint that changes a role |

## Assets — `/api/assets`
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | any | Filters: `tag, serial_number, category_id, status, department_id, location`; paginated. |
| GET | `/search?q=` | any | Unified search over tag / serial / name. |
| POST | `/` | admin, asset_manager | multipart (`photo`, `documents[]`). Auto tag `AF-XXXX` (row-locked), QR generated, status `Available`. |
| GET | `/:id` | any | |
| GET | `/:id/history` | any | Merged, time-ordered allocation + maintenance events. |
| GET | `/:id/allocation-history` | any | Allocation rows for the panel. |
| PUT | `/:id` | admin, asset_manager | Cannot change `status` (lifecycle endpoints only). |

## Allocations & Transfers — `/api/allocations`
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/` | admin, asset_manager, dept_head | Row-locks asset; 409 `ALREADY_ALLOCATED` with `currentHolder`. Notifies holder. |
| POST | `/:id/return` | same | Skips status flip if asset is `Under Maintenance`. |
| POST | `/transfer-requests` | same | Only when an active allocation exists. |
| PUT | `/transfer-requests/:id/approve` | same | Atomic: closes old + opens new allocation; status `Reallocated`; notifies both. |
| PUT | `/transfer-requests/:id/reject` | same | |

## Bookings — `/api/bookings`
| Method | Path | Notes |
|---|---|---|
| GET | `/resources/:id/bookings?date=` | Day/range bookings for calendar. |
| POST | `/` | Overlap check `existing.start < new.end AND existing.end > new.start`; back-to-back allowed. 409 `BOOKING_OVERLAP`. |
| PUT | `/:id/cancel` | |
| PUT | `/:id/reschedule` | Re-runs overlap excluding own row. |

## Maintenance — `/api/maintenance-requests`
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/?groupBy=status` | any | Kanban-grouped or flat list. |
| POST | `/` | any | Creates `Pending`; **does not** change asset status. |
| PUT | `/:id/approve` | asset_manager+ | Snapshots `prior_status`, sets asset `Under Maintenance`. |
| PUT | `/:id/reject` | asset_manager+ | |
| PUT | `/:id/assign-technician` | asset_manager+ | |
| PUT | `/:id/start` | asset_manager+ | |
| PUT | `/:id/resolve` | asset_manager+ | Restores `prior_status` (or `Allocated` if still held). |

## Audit — `/api/audit-cycles`
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | any | |
| POST | `/` | asset_manager+ | Auto-populates `audit_items` for scope (dept/location). |
| GET | `/:id/items` | any | |
| GET | `/:id/discrepancy-report` | any | Live query of Missing/Damaged items. |
| POST | `/:id/auditors` | asset_manager+ | |
| PUT | `/items/:id/verify` | assigned auditor / override | Rejected if cycle closed. |
| PUT | `/:id/close` | asset_manager+ | Missing→`Lost`; Damaged untouched; idempotent (409 if already closed). |

## Dashboard — `/api/dashboard`
`GET /kpis` → available, allocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns (+ totals).
`GET /overdue`, `GET /recent-activity`.

## Notifications — `/api/notifications`
`GET /` (tabs All/Alerts/Approvals/Bookings, `is_read` filter, paginated), `GET /unread-count`, `PUT /mark-all-read`, `PUT /:id/read`.

## Activity Logs — `/api/activity-logs`
`GET /` (admin, asset_manager, dept_head) — filters `entity_type, user_id, from, to`; paginated.

## Reports — `/api/reports` (admin, asset_manager, dept_head)
`/utilization`, `/maintenance-frequency`, `/most-used-idle`, `/maintenance-due`, `/department-allocation`, `/booking-heatmap`, `/export?type=<department-allocation|assets|maintenance>&format=csv`.

## Background jobs (ENABLE_CRON=true)
- `overdueReturnsCheck` — hourly; idempotent per allocation per day.
- `bookingReminder` — every 15 min; notifies bookings starting within 30 min.
- `overdueBookingsCheck` — every 15 min; auto-completes past-end live bookings.
