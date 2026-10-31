# Portfolio API

Backend for **[nihalxofficial.vercel.app](https://nihalxofficial.vercel.app)** — every word,
project, skill and image shown on the public site lives in MongoDB and is edited from a
private dashboard. No content is hardcoded in the frontend.

The same server powers three things:

| Feature | Who uses it | Module |
| --- | --- | --- |
| Public content read API | the Next.js site (server rendered, ISR 30-60s) | `modules/portfolio` |
| Contact inbox + SMTP notification | visitors → dashboard | `modules/contact` |
| Gemini assistant (visitor chat + dashboard form filler) | visitors + admin | `modules/ai` |
| Generic CRUD over 14 content types | admin dashboard | `modules/admin` |
| ImgBB media library | admin dashboard | `modules/media` |

## Stack

- **Express 5** on Node 22, TypeScript, `tsc` → `dist`
- **MongoDB Atlas** through Mongoose 8
- **Zod** validation on every body, query and param
- **Firebase Admin** ID token verification + a server side UID allowlist
- **Google Gemini** (`@google/genai`) with a model fallback chain
- **Nodemailer** over any SMTP provider
- **ImgBB** for image hosting (nothing is stored on the server)

## Architecture

Every feature follows the same one way flow, so a route file never contains business logic:

```
request
  → route        mounts middleware, picks the validator
  → validator    zod schema for body / query / params
  → controller   HTTP only: reads the request, sends the envelope
  → service      business rules, ownership, side effects
  → model        Mongoose schema + indexes
```

Cross cutting pieces live in `middlewares/` (auth, validation, rate limits, errors) and
`utils/` (`ApiError`, `catchAsync`, `sendResponse`). Responses always use the same envelope:

```json
{ "success": true, "message": "Projects loaded", "data": [], "meta": { "page": 1, "limit": 24, "total": 9, "totalPages": 1 } }
```

### The content registry

`modules/admin/content.registry.ts` is the single source of truth for the dashboard. Each of
the 14 entities declares its model, writable fields, field kinds, validation and search
fields once; the CRUD routes, the Zod schemas and the form the admin sees are all generated
from it. Adding a field means editing one file — the API accepts it and the dashboard renders
an input for it automatically.

```ts
{
  key: "projects",
  label: "Projects",
  model: ProjectModel,
  titleField: "title",
  fields: [
    { name: "title", kind: "string", required: true, max: 160 },
    { name: "slug", kind: "slug", required: true },
    { name: "techStack", kind: "list" },
    { name: "seo", kind: "object", children: [{ name: "title", kind: "string" }] },
  ],
}
```

`pickFields()` walks the same tree on write, so unknown keys can never reach Mongoose
(mass assignment protection). Entities: `projects`, `posts`, `experience`, `education`,
`certifications`, `skills`, `services`, `testimonials`, `statistics`, `navigation`,
`sections`, and the singletons `hero`, `about`, `settings`.

## Project structure

```
src/
├── app.ts                  express app, CORS, helmet, routers, error handler
├── index.ts                boot: env → mongo → listen
├── config/                 env parsing, mongo connection, firebase admin
├── middlewares/            auth, validate, rate limits, error handler
├── models/                 mongoose schemas (project, blog, content, profile, media)
├── modules/
│   ├── admin/              generic content CRUD + dashboard overview
│   ├── ai/                 gemini client, visitor chat (SSE), form fill
│   ├── auth/               GET /auth/status, GET /auth/session (token + allowlist)
│   ├── contact/            public submit, admin inbox
│   ├── media/              imgbb upload, from-url import, delete
│   └── portfolio/          public aggregate read API
├── scripts/seed.ts         initial portfolio content (`--reset` wipes first)
└── utils/                  ApiError, catchAsync, sendResponse
```

## Endpoints

### Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | status of mongo, firebase, gemini, smtp, imgbb |
| GET | `/api/v1/portfolio` | everything the site needs in one request |
| GET | `/api/v1/portfolio/featured` | featured projects only |
| GET | `/api/v1/portfolio/projects/:slug` | project + related |
| GET | `/api/v1/portfolio/posts/:slug` | post + related |
| POST | `/api/v1/contact` | rate limited, stored then emailed |
| POST | `/api/v1/ai/chat` | SSE stream: `start` / `delta` / `done` / `error` |

### Admin (Bearer Firebase ID token, UID must be in `ADMIN_UIDS`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/auth/status` | identity only (no allowlist) — used to print the UID after a rejected sign-in |
| GET | `/api/v1/auth/session` | confirms the token and the allowlist |
| GET | `/api/v1/admin/overview` | counts for the dashboard cards |
| GET | `/api/v1/admin/content/describe` | the schema tree the dashboard renders |
| GET | `/api/v1/admin/content/:entity` | paginated list, `?q=&page=&limit=` |
| POST | `/api/v1/admin/content/:entity` | create (upserts singletons) |
| PATCH | `/api/v1/admin/content/:entity` | singleton upsert |
| GET | `/api/v1/admin/content/:entity/:id` | read one |
| PATCH | `/api/v1/admin/content/:entity/:id` | partial update |
| DELETE | `/api/v1/admin/content/:entity/:id` | delete (singletons refuse) |
| GET | `/api/v1/admin/messages` | `?status=unread&search=&page=` |
| PATCH | `/api/v1/admin/messages/:id` | `{ "status": "read" }` |
| DELETE | `/api/v1/admin/messages/:id` | remove a message |
| GET | `/api/v1/admin/media` | paginated media library |
| POST | `/api/v1/admin/media` | `{ image: dataUri, name, mimeType, folder }` |
| POST | `/api/v1/admin/media/from-url` | `{ url, name }` |
| DELETE | `/api/v1/admin/media/:id` | remove from MongoDB (ImgBB keeps the file) |
| POST | `/api/v1/admin/ai/form-fill` | `{ entity, notes, current }` → drafted fields |

## Environment

Copy the template and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | yes | 5000 locally, 5000 in Docker |
| `FRONTEND_URL` | yes | allowed CORS origin(s), comma separated |
| `MONGODB_URI` | yes | Atlas connection string |
| `MONGODB_DATABASE` | yes | database name (`portfolio`) |
| `ADMIN_UIDS` | yes | Firebase UIDs allowed into the dashboard |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | yes | service account for token verification |
| `GOOGLE_APPLICATION_CREDENTIALS` | no | alternative to the three fields above |
| `GEMINI_API_KEY` | no | visitor chat + dashboard form fill |
| `GEMINI_MODEL` / `GEMINI_FALLBACK_MODELS` | no | model chain when one is overloaded |
| `SMTP_*`, `CONTACT_RECEIVER_EMAIL` | no | notifications; without SMTP messages are still stored |
| `IMGBB_API_KEY` | no | media uploads |
| `IMGBB_EXPIRATION` | no | optional auto expiry in seconds |

Anything optional degrades gracefully: `/health` reports what is configured, and the related
feature returns a clear error instead of crashing the server.

## Local development

```bash
npm install
npm run dev        # tsx watch on http://localhost:5000
npm run typecheck
npm run build && npm start
```

Seed the database with the real portfolio content:

```bash
npm run seed            # first run only
npm run seed -- --reset # wipe content collections and reinsert everything
```

The seed refuses to run over an existing database so a stray command cannot destroy edited
content; `--reset` is the explicit opt-in.

## Docker

```bash
docker build -t nihalxofficial/portfolio-api:release-2 .
docker run --rm --env-file .env -p 5000:5000 nihalxofficial/portfolio-api:release-2
docker push nihalxofficial/portfolio-api:release-2
```

The image is multi stage: dev dependencies are only used to compile TypeScript, the runtime
contains `dist/` plus production modules and runs as an unprivileged user. Secrets are never
copied into the image — compose injects `.env` at runtime.

Seed inside the container (the compiled script ships with the image):

```bash
docker run --rm --env-file .env nihalxofficial/portfolio-api:release-2 node dist/scripts/seed.js
```

## Security notes

- Admin access is decided **on the server**: the token is verified with Firebase Admin and its
  UID is compared to `ADMIN_UIDS`. The browser cannot promote itself.
- Every admin route sits behind `requireAdmin`; the media router parses its own larger body
  limit *after* the check.
- Writes go through `pickFields`, and every body is validated by a schema generated from the
  registry, so unknown fields are dropped.
- Rate limits apply to login-adjacent, contact and chat endpoints.
- `helmet`, strict CORS and a `1mb` JSON limit (14mb only for media) are enabled globally.

## Release tags

| Image | Contents |
| --- | --- |
| `nihalxofficial/portfolio:release-1` | the original single page portfolio (frontend only) |
| `nihalxofficial/portfolio-api:release-2` | this API |
| `nihalxofficial/portfolio-web:release-2` | the rebuilt site + admin dashboard |

Both release-2 images are orchestrated by `docker-compose.yml` in the repository root.
