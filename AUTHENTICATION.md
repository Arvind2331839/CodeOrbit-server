# Authentication and Authorization

This project provides a reusable Express + TypeScript authentication foundation with short-lived JWT access tokens, rotated refresh sessions, Zod validation, RBAC, centralized errors, optional Nodemailer flows, and constrained profile-image uploads.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI`, two different random secrets of at least 32 characters, and `CORS_ORIGINS`.
3. Start MongoDB.
4. Run `npm run dev` or build with `npm run build` and run `npm start`.

Email verification is disabled by default. Set `EMAIL_VERIFICATION_ENABLED=true` and configure all SMTP variables to enable it. Set `REQUIRE_VERIFIED_EMAIL=true` to block login until verification.

## Endpoints

All authentication endpoints are under `/api/auth`:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/register` | Create an account and issue tokens |
| POST | `/login` | Authenticate with email and password |
| POST | `/refresh-token` | Rotate the HttpOnly refresh cookie |
| POST | `/logout` | Revoke the current refresh session |
| POST | `/forgot-password` | Send a single-use reset link |
| POST | `/reset-password` | Set a new password and revoke sessions |
| POST | `/verify-email` | Consume an email-verification token |
| POST | `/resend-verification` | Send a new verification link |
| POST | `/change-password` | Change password and revoke sessions |

Access tokens are returned in the response body and should be sent as `Authorization: Bearer <token>`. Refresh tokens are HttpOnly cookies scoped to `/api/auth`; raw refresh tokens are never stored in MongoDB. Rotation revokes the presented session first, and reuse revokes the user's remaining sessions.

## Authorization / RBAC

Authentication and authorization are separate middleware:

```ts
router.get(
  "/admin/users",
  authenticate,
  authorize("admin"),
  getUsers,
);
```

The current roles are `user` and `admin`. Add roles to `USER_ROLES` only when the product needs them.

## Password and email security

Passwords are hashed with bcryptjs (12 rounds), excluded from normal queries, and never returned by public DTOs. Reset and verification tokens are cryptographically random, stored only as SHA-256 hashes, expire, and are single-use. Resetting or changing a password removes all refresh sessions.

Forgot-password responses intentionally do not reveal whether an email exists.

## Profile images

`PUT /api/users/profile-image` accepts one `profileImage` multipart field. JPEG, PNG, and WebP are allowed, with a default 2 MiB limit. Filenames are UUIDs; original filenames are ignored; upload signatures are checked before the stored path is persisted.

## Security and operational notes

- Helmet, CORS credentials, request body limits, and centralized error handling are configured in `src/app.ts`.
- Auth endpoints use stronger rate limits than ordinary routes. Tests skip rate limiting only under `NODE_ENV=test`.
- Use HTTPS in production so the refresh cookie's `secure` flag is effective.
- Keep secrets out of source control. Production responses omit stack traces and implementation details.
- `GET /api/users/all` is restricted to `admin`; `/me`, search, and profile updates require authentication.

## Testing

Run:

```bash
npm run build
npm test
```

The integration suite uses `mongodb-memory-server` and covers registration, protected access, refresh rotation, logout invalidation, duplicate accounts, invalid credentials, strict request validation, RBAC denial, and password-change session invalidation.