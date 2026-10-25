# DevPrep Backend Server

A modular, secure, production-ready Express + TypeScript backend powering the DevPrep technical interview platform. Built with a clean modular architecture, MongoDB/Mongoose, JWT + HttpOnly refresh cookies, RBAC, Zod validation, and OpenAPI 3.0 (Swagger UI).

---

## Architecture Overview

The backend is organized around **feature modules** mirroring the frontend architecture. Each feature module encapsulates its own routes, controllers, services, models, and validation schemas, while genuine shared cross-cutting concerns reside in `common/` and configuration in `config/`.

```text
src/
├── app.ts                  # Express application setup, security middleware, Swagger & central router
├── server.ts               # HTTP server lifecycle and database bootstrap
│
├── config/                 # Central configuration
│   ├── database.ts         # Mongoose connection & disconnect management
│   ├── env.ts              # Zod-validated environment configuration (fail-fast)
│   └── swagger.ts          # OpenAPI 3.0 specification & Swagger UI configuration
│
├── common/                 # Shared cross-cutting concerns
│   ├── errors/
│   │   └── AppError.ts     # Operational error hierarchy with HTTP status codes
│   ├── middleware/
│   │   ├── authenticate.ts # JWT verification & user attachment
│   │   ├── authorize.ts    # Role-based access control (RBAC) middleware
│   │   ├── errorHandler.ts # Centralized operational/unhandled error formatter
│   │   ├── rateLimit.ts    # Rate limiting for auth and API endpoints
│   │   ├── upload.ts       # Multer profile image uploads
│   │   └── validate.ts     # Zod request validation middleware
│   ├── utils/
│   │   ├── asyncHandler.ts # Async controller wrapper
│   │   ├── mail.service.ts # SMTP email transport
│   │   ├── publicUser.ts   # Safe user serialization (scrubs password, tokens)
│   │   └── token.ts        # Cryptographic hashes and JWT helpers
│   └── types/              # Common TypeScript declarations
│
├── modules/                # Feature Modules
│   ├── auth/               # Authentication & session rotation
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── auth.validator.ts
│   │   └── models/
│   │       ├── user.model.ts
│   │       └── refreshSession.model.ts
│   │
│   ├── questions/          # Question discovery & admin management
│   │   ├── questions.controller.ts
│   │   ├── questions.model.ts
│   │   ├── questions.routes.ts
│   │   ├── questions.service.ts
│   │   └── questions.validator.ts
│   │
│   └── users/              # User profile & administration
│       ├── user.controller.ts
│       ├── user.routes.ts
│       ├── user.service.ts
│       └── user.validator.ts
│
├── routes/
│   └── index.ts            # Central route dispatcher (/api/auth, /api/users, /api/questions)
│
└── scripts/
    ├── createAdmin.ts      # Automated admin account provisioner / role promotion
    └── seedQuestions.ts    # Idempotent database seeder (migrates 193 static frontend questions)
```

---

## Environment Configuration & Security

All sensitive values and environment settings are validated at startup via `src/config/env.ts` using Zod. Missing or malformed configuration triggers an immediate process exit with clear error logs.

### Required Environment Variables

Create `.env` by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | `number` | `5000` | HTTP server port |
| `NODE_ENV` | `string` | `development` | `development`, `production`, or `test` |
| `MONGODB_URI` | `string` | `mongodb://127.0.0.1:27017/app` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | `string` | - | Random secret string (min 32 chars) for signing access tokens |
| `JWT_REFRESH_SECRET` | `string` | - | Distinct random secret string (min 32 chars) for refresh tokens |
| `ACCESS_TOKEN_EXPIRES_IN` | `string` | `15m` | Lifetime of short-lived JWT access tokens |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | `number` | `30` | Refresh token cookie validity in days |
| `REFRESH_COOKIE_NAME` | `string` | `refreshToken` | HttpOnly cookie name for refresh sessions |
| `CLIENT_URL` | `string` | `http://localhost:5173` | Frontend application origin |
| `CORS_ORIGINS` | `string` | `http://localhost:5173,...` | Comma-separated list of allowed CORS origins |
| `EMAIL_VERIFICATION_ENABLED`| `boolean` | `false` | Enable email confirmation requirement |
| `REQUIRE_VERIFIED_EMAIL` | `boolean` | `false` | Prevent unverified logins |
| `MAX_PROFILE_IMAGE_BYTES` | `number` | `2097152` | 2MB avatar upload limit |

> [!IMPORTANT]
> - Never commit `.env` to version control. Both `.env` and `.env.*` are ignored in `.gitignore`.
> - Raw passwords, JWT tokens, and database credentials are never logged or exposed in API errors.

---

## Quickstart & Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Static Questions (193 Questions)
Migrates all questions from `Interview-client/src/modules/questions/data/` (JavaScript, React, Node.js, Database, TypeScript) into MongoDB.
Uses `bulkWrite` with `upsert: true` (100% idempotent; running repeatedly will not produce duplicates).

```bash
npm run seed
```

### 3. Create or Promote an Administrator
Provisions a default administrator account:
- **Email:** `admin@devprep.com`
- **Password:** `AdminPassword123!`
- **Role:** `admin`

```bash
npm run admin:create
```

### 4. Start Development Server
```bash
npm run dev
```
Server runs at `http://localhost:5000`.

### 5. Build for Production
```bash
npm run build
npm start
```

### 6. Run Test Suite
Integration tests use `mongodb-memory-server` and run isolated in-memory test suites without needing a local running MongoDB instance.

```bash
npm test
```

---

## Swagger / OpenAPI Documentation

Interactive Swagger UI documentation is mounted at:
👉 **`http://localhost:5000/api-docs`**

The raw OpenAPI 3.0 JSON specification is available at:
👉 **`http://localhost:5000/api-docs.json`**

### Features Documented:
- **Public Questions API**: `/api/questions`, `/api/questions/stats`, `/api/questions/topics`, `/api/questions/{id}`.
- **Admin Questions API**: `POST /api/questions`, `POST /api/questions/bulk`, `PUT /api/questions/{id}`, `DELETE /api/questions/{id}`.
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/logout`, token refresh, and password management.
- **Users**: `GET /api/users/me`, `GET /api/users/all`.
- Security schemes: HTTP Bearer JWT authentication and HttpOnly Cookie authentication.

---

## API Summary

### Public Endpoints (No Authentication Required)
- `GET /api/questions` - Query questions with pagination, search, subject (`technology`), topic, and difficulty filters.
- `GET /api/questions/stats?technology=javascript` - Aggregated question totals by topic and difficulty level.
- `GET /api/questions/topics?technology=javascript` - Distinct topic list with question counts.
- `GET /api/questions/:id` - Fetch single question by unique slug or MongoDB ID.
- `POST /api/auth/login` - Authenticate admin or user.

### Admin Endpoints (`Authorization: Bearer <admin_token>`)
- `POST /api/questions` - Create a single question.
- `POST /api/questions/bulk` - Bulk upsert questions via JSON array.
- `PUT /api/questions/:id` - Update existing question.
- `DELETE /api/questions/:id` - Delete question.
- `GET /api/users/all` - List registered users.

---

## Example Bulk JSON Question Format (Option B)

Administrators can paste an array of question objects directly into the Admin Portal (`/admin`) or submit to `POST /api/questions/bulk`:

```json
[
  {
    "id": "react-custom-001",
    "title": "React Server Components vs Client Components",
    "question": "What is the primary difference between React Server Components (RSC) and Client Components?",
    "answer": "Option A: Server Components render exclusively on the server and do not add JavaScript to the client bundle.",
    "topic": "Architecture",
    "subtopic": "Server Components",
    "difficulty": "advanced",
    "technology": "react",
    "tags": ["react", "rsc", "nextjs", "architecture"],
    "codeExample": "// Server Component\nasync function Profile({ id }) {\n  const user = await db.user.find(id);\n  return <div>{user.name}</div>;\n}",
    "explanation": "Server Components execute solely on the server, having direct access to backend data sources without transmitting component code to the client.",
    "options": [
      { "id": "A", "text": "Server Components render exclusively on the server without client bundle JS" },
      { "id": "B", "text": "Client Components cannot use useState or useEffect" },
      { "id": "C", "text": "Server Components can only render static HTML without props" },
      { "id": "D", "text": "There is no difference; they are synonymous" }
    ],
    "correctAnswer": "A"
  }
]
```
