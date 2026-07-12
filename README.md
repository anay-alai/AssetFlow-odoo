# AssetFlow

**Enterprise Asset & Resource Management System**

AssetFlow is a centralized ERP module for organizations to track, allocate, book, and maintain physical assets and shared resources — equipment, furniture, vehicles, rooms — across departments. It replaces spreadsheet/paper-based tracking with structured lifecycles, conflict-safe allocation and booking, a gated maintenance approval workflow, and scheduled audit cycles.

Industry-agnostic by design: usable by offices, schools, hospitals, factories, or agencies. Explicitly **out of scope**: purchasing, invoicing, and accounting. Acquisition cost is stored for reporting/ranking only.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Core Business Rules](#core-business-rules)
7. [Screens](#screens)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [Database Setup](#database-setup)
11. [API Overview](#api-overview)
12. [Running Tests](#running-tests)
13. [Scheduled Jobs](#scheduled-jobs)
14. [Deployment](#deployment)
15. [Contributing](#contributing)
16. [License](#license)

---

## Features

- **Role-based account model** — signup creates employee-only accounts; Admin promotes to Department Head / Asset Manager from one controlled screen (no self-elevation).
- **Organization setup** — departments (with hierarchy), asset categories (with custom fields), employee directory.
- **Full asset lifecycle** — Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed, with controlled transitions and per-asset history.
- **Conflict-safe allocation** — blocks double-allocation, offers a transfer-request flow instead.
- **Time-slot resource booking** — overlap validation on shared/bookable resources (rooms, vehicles, equipment).
- **Gated maintenance workflow** — Pending → Approved/Rejected → Technician Assigned → In Progress → Resolved, with asset status auto-updating only on approval/resolution.
- **Structured audit cycles** — assigned auditors, per-asset verification, auto-generated discrepancy reports, cycle close with cascading status updates.
- **Operational dashboard** — live KPIs, overdue returns/bookings, quick actions.
- **Reports & analytics** — utilization trends, maintenance frequency, idle/most-used assets, department allocation summary, booking heatmap, CSV/PDF export.
- **Notifications & activity log** — every meaningful action surfaces a notification and an auditable log entry.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router v6, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts, Axios, date-fns, react-hot-toast |
| Backend | Node.js, Express, Sequelize ORM, JWT (jsonwebtoken), bcrypt, express-validator/Zod, node-cron, multer, qrcode |
| Database | MySQL 8 (InnoDB, native ENUM columns) |
| Testing | Jest, Supertest, React Testing Library |
| Tooling | ESLint, Prettier, Sequelize CLI, Docker Compose |

---

## Architecture Overview

AssetFlow follows a layered backend architecture:

```
Route → Middleware (auth, role check, validation) → Controller → Service → Model (Sequelize) → MySQL
```

- **Controllers** stay thin — request/response shims only.
- **Services** own all business logic, including conflict checks (allocation, booking overlap), workflow gating (maintenance, transfers), and cascading updates (audit close). This keeps logic unit-testable independent of HTTP.
- **Middleware** enforces authentication, role-based authorization, and request validation before any controller runs.
- **Jobs** (node-cron) run independently of the request/response cycle to detect overdue returns/bookings and generate reminders.

The frontend mirrors this by resource: one API client, one set of React Query hooks, and one page per screen, per module (auth, assets, allocations, bookings, maintenance, audits, reports, notifications).

---

## Project Structure

```
assetflow/
├── backend/
│   └── src/
│       ├── config/          # DB connection, env loader, enum constants
│       ├── models/          # Sequelize models + associations
│       ├── migrations/      # Schema migrations + seeders
│       ├── routes/          # Express routers per resource
│       ├── controllers/     # Thin request/response handlers
│       ├── services/        # Business logic (conflict checks, workflows)
│       ├── middleware/      # auth, authorize, validateRequest, activityLogger
│       ├── validators/      # Zod/express-validator schemas
│       ├── utils/           # asset tag generator, overlap checker, QR, etc.
│       └── jobs/            # cron jobs (overdue returns, booking reminders)
├── frontend/
│   └── src/
│       ├── api/             # axios clients per module
│       ├── components/      # shared + module-specific components
│       ├── pages/           # one file/folder per screen
│       ├── context/         # AuthContext, NotificationContext
│       ├── hooks/           # useAuth, useRole, useFetch
│       ├── routes/          # AppRoutes, ProtectedRoute
│       └── utils/           # formatting, shared constants
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   ├── api-spec.md
│   └── architecture.md
├── docker-compose.yml
└── README.md
```

---

## User Roles & Permissions

| Action | Admin | Asset Manager | Dept Head | Employee |
|---|:---:|:---:|:---:|:---:|
| Self-signup | — | — | — | ✅ |
| Promote user role | ✅ | ❌ | ❌ | ❌ |
| Manage departments/categories | ✅ | ❌ | ❌ | ❌ |
| Register asset | ❌ | ✅ | ❌ | ❌ |
| Allocate / approve transfer | ❌ | ✅ | ✅ (own dept) | ❌ |
| Book shared resource | ✅ | ✅ | ✅ | ✅ |
| Raise maintenance request | ✅ | ✅ | ✅ | ✅ |
| Approve/reject maintenance | ❌ | ✅ | ❌ | ❌ |
| Create/close audit cycle | ❌ | ✅ | ❌ | ❌ |
| Perform audit verification | — | ✅ (if assigned) | ✅ (if assigned) | ✅ (if assigned) |
| View org-wide reports | ✅ | ✅ (operational) | ✅ (dept scope) | ❌ |

Role assignment happens in exactly one place: **Admin → Organization Setup → Employee Directory**. The signup endpoint hardcodes new accounts to `role = employee` server-side, regardless of any role field sent in the request.

---

## Core Business Rules

- **Allocation conflict:** an asset can only have one active allocation at a time. A second allocation attempt is rejected with the current holder's details and a transfer-request option — never silently overwritten.
- **Booking overlap:** two bookings on the same resource conflict if `existing.start < new.end AND existing.end > new.start`. Back-to-back bookings (one starts exactly when another ends) are allowed.
- **Maintenance gating:** asset status flips to *Under Maintenance* only on request **approval**, never on request creation, and reverts to its prior state (not hardcoded to *Available*) on resolution.
- **Audit close:** closing a cycle is irreversible. Assets marked *Missing* cascade to status *Lost*; assets marked *Damaged* are flagged in the discrepancy report but require a separate maintenance request to change status.
- **Overdue detection:** a scheduled job flags allocations past their expected return date and bookings/maintenance nearing due dates, feeding both the dashboard and notifications (idempotent — no duplicate alerts for the same overdue item).

---

## Screens

1. Login / Signup
2. Dashboard / Home
3. Organization Setup (Admin) — Departments, Categories, Employee Directory
4. Asset Registration & Directory
5. Asset Allocation & Transfer
6. Resource Booking
7. Maintenance Management (Kanban)
8. Asset Audit
9. Reports & Analytics
10. Activity Logs & Notifications

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MySQL ≥ 8
- npm or yarn
- Docker & Docker Compose (optional, for containerized local setup)

### Local Setup (without Docker)

```bash
# Clone
git clone <repo-url> assetflow
cd assetflow

# Backend
cd backend
npm install
cp .env.example .env      # fill in DB credentials + JWT secret
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev                # starts on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env       # set VITE_API_BASE_URL=http://localhost:5000/api
npm run dev                # starts on http://localhost:5173
```

### With Docker Compose

```bash
docker-compose up --build
```

This spins up MySQL, the backend API, and (optionally) a frontend container as defined in `docker-compose.yml`.

### Default Seeded Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@assetflow.com | Admin@123 |
| Asset Manager | manager@assetflow.com | Manager@123 |
| Department Head | depthead@assetflow.com | DeptHead@123 |
| Employee | employee@assetflow.com | Employee@123 |

> Change these before any non-local deployment.

---

## Environment Variables

**backend/.env**
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=assetflow
DB_USER=root
DB_PASSWORD=yourpassword
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRY=1d
PORT=5000
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Database Setup

The authoritative schema lives in `database/schema.sql`. It defines all tables, foreign keys, native `ENUM` status columns, and indexes on the hot query paths (`asset_tag`, `serial_number`, booking time ranges, allocation status). Sequelize migrations in `backend/src/migrations/` mirror this schema for use with `sequelize-cli`.

To reset the database entirely:

```bash
cd backend
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

## API Overview

All endpoints are prefixed with `/api`. Full request/response contracts live in `docs/api-spec.md`. Summary by module:

| Module | Base Route |
|---|---|
| Auth | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Departments / Categories / Employees | `/api/departments`, `/api/categories`, `/api/employees` |
| Assets | `/api/assets` |
| Allocations / Transfers | `/api/allocations`, `/api/transfer-requests` |
| Bookings | `/api/bookings`, `/api/resources` |
| Maintenance | `/api/maintenance-requests` |
| Audits | `/api/audit-cycles`, `/api/audit-items` |
| Reports | `/api/reports` |
| Notifications / Logs | `/api/notifications`, `/api/activity-logs` |

**Response envelope (success):**
```json
{ "success": true, "data": { ... }, "meta": { ... } }
```

**Response envelope (error):**
```json
{ "success": false, "error": { "code": "ALREADY_ALLOCATED", "message": "...", "details": { ... } } }
```

---

## Running Tests

```bash
# Backend
cd backend
npm test                 # Jest + Supertest

# Frontend
cd frontend
npm test                 # React Testing Library
```

Priority test coverage: allocation conflict rejection, booking overlap matrix (exact/partial/back-to-back), signup role integrity, maintenance status gating, audit-close cascade behavior.

---

## Scheduled Jobs

Defined in `backend/src/jobs/`, registered via `node-cron` on server start:

- `overdueReturnsCheck.js` — hourly scan for allocations past expected return date
- `overdueBookingsCheck.js` — flags bookings that should have started/ended but weren't actioned
- `bookingReminder.js` — sends a reminder notification ahead of a booking's start time

---

## Deployment

- **Backend + MySQL:** Railway, Render, or any container host supporting Docker Compose.
- **Frontend:** Vercel or Netlify (static Vite build), pointed at the deployed backend via `VITE_API_BASE_URL`.
- Ensure `JWT_SECRET` and DB credentials are set as platform secrets, not committed to `.env`.

---

## Contributing

1. Branch from `main`: `feature/<short-description>`.
2. Keep business logic in `services/`, not controllers.
3. Add/adjust tests for any change to conflict logic (allocation, booking, maintenance gating, audit close).
4. Run `npm run lint` before opening a PR.

---

## License

Refer [LICENSE](LICENSE) file for more details.

## current bugs
- [x] admin must not change his own position
- [ ] Audit reports are not visible
- [ ] maintenance flow how will we make it active.
- [ ] New assets are is avaliable to add in the Asset manager
- [ ] Employee add feature add Department Head 
- [ ] perform audit if assigned to it
- 

| Feature             |    Admin    | Asset Manager |    Department Head   |              Employee              |
| ------------------- | :---------: | :-----------: | :------------------: | :--------------------------------: |
| Login               |      ✅      |       ✅       |           ✅          |                  ✅                 |
| Register Asset      |      ❌      |       ✅       |           ❌          |                  ❌                 |
| View Assets         |      ✅      |       ✅       |      Department      |                 Own                |
| Allocate Asset      |      ❌      |       ✅       | Request/Approve Dept |                  ❌                 |
| Transfer Asset      |      ❌      |       ✅       |     Approve Dept     |               Request              |
| Return Asset        |      ❌      |    Approve    |         View         |               Request              |
| Raise Maintenance   |      ❌      |       ✅       |           ❌          |                  ✅                 |
| Approve Maintenance |      ❌      |       ✅       |           ❌          |                  ❌                 |
| Book Resource       |      ✅      |       ✅       |           ✅          |                  ✅                 |
| Approve Booking     |      ❌      |       ❌       |           ❌          | ❌ *(automatic overlap validation)* |
| Create Departments  |      ✅      |       ❌       |           ❌          |                  ❌                 |
| Create Categories   |      ✅      |       ❌       |           ❌          |                  ❌                 |
| Manage Employees    |      ✅      |       ❌       |           ❌          |                  ❌                 |
| Promote Roles       |      ✅      |       ❌       |           ❌          |                  ❌                 |
| Create Audit Cycle  |      ✅      |       ❌       |           ❌          |                  ❌                 |
| Perform Audit       | If assigned |  If assigned  |      If assigned     |             If assigned            |
| Close Audit Cycle   |      ✅      |       ❌       |           ❌          |                  ❌                 |
| View Analytics      |     All     |     Asset     |      Department      |              Personal              |
| Export Reports      |      ✅      |       ✅       |      Department      |                  ❌                 |
