# The little studio ☀

A yellow scrapbook portfolio with a private CMS, PostgreSQL publishing snapshots, S3-compatible media, and reliable contact notifications.

**Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS, Motion for React, Prisma 7, Better Auth, PostgreSQL, and an SMTP worker. Public content is server-rendered and cached; private previews are authenticated and uncached.

## Local development

Requires Node.js 24, Docker Compose, and an existing PostgreSQL database. This project never creates or resets your database. It adds tables in the `portfolio` schema.

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env`, fill in your local credentials, and generate a random `BETTER_AUTH_SECRET` of at least 32 characters. The supplied local database credentials have already been saved in the ignored `.env` for this workspace.
3. `DATABASE_URL` connects from Node to `127.0.0.1:5432`; `DOCKER_DATABASE_URL` connects to the existing `dev-postgres:5432` container on `dev-network`. URL-encode database passwords. Both URLs must end with `?schema=portfolio`; preserve any required TLS parameters when adding it.
4. Start local services:

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d storage mailpit
npm run storage:init
npm run setup
npm run dev
```

Run `npm run worker` in another terminal to deliver contact alerts. Local email goes only to Mailpit, not the internet.

- Portfolio: http://localhost:3000
- Studio: http://localhost:3000/admin
- Development email inbox: http://localhost:8025
- Development storage console: http://localhost:9001

`DEMO_MODE=true` enables a clearly labeled static demonstration only when no portfolio is published. It does not expose saved drafts. Use `SEED_DEMO=true npm run db:seed` to add editable sample projects and a journal entry; nothing is published by seeding. Turn demo mode off in production.

## Administrator accounts through environment variables

Configure these in `.env` locally or the Dokploy Environment panel:

```dotenv
ADMIN_1_EMAIL=your-real-email@example.com
ADMIN_1_NAME=MACM
ADMIN_1_PASSWORD=your-unique-long-password
ADMIN_2_EMAIL=her-real-email@example.com
ADMIN_2_NAME=Her name
ADMIN_2_PASSWORD=her-unique-long-password
```

Use passwords of 12–128 characters. Run `npm run admin:bootstrap` locally for first-time provisioning. For local development, `npm run dev` now synchronizes configured admin emails, names, and passwords before starting Next.js; `npm run admin:sync:dev` runs the same sync without starting the server, including when the local Docker app is already running. This command is restricted to a local PostgreSQL connection and local HTTP site URL. If changing an existing email, set `ADMIN_1_PREVIOUS_EMAIL` (or `ADMIN_2_PREVIOUS_EMAIL`) to the old address for one sync, then remove it. It revokes existing sessions when credentials change. The Docker `setup` service automatically runs migrations, initializes the profile draft, and provisions both accounts before the app and worker start. Empty account groups are skipped; partial/invalid groups fail setup visibly. The production bootstrap leaves existing accounts unchanged, including their passwords. Changing a production bootstrap password variable does not reset an existing account: use the email password-reset flow. In production, remove bootstrap password variables after successful first provisioning. Reapply them only to create missing accounts. These variables are passed to the one-time setup service; the running app and worker receive only their own settings.

Both accounts have the same editing permissions. There is no public registration. Additional manual provisioning is available through `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` and `npm run admin:create`.

## Editing and publishing

- Edit name, headline, introduction, availability, portrait, résumé, about, experience, education, skills, socials, contact details, and search metadata in **My profile**.
- **Save draft** retains private changes. **Preview saved draft** shows what was last saved. **Publish portfolio** atomically replaces the live profile snapshot.
- Projects and journal entries each have their own drafts and publish/unpublish controls. Saving a published item does not alter its live content. Changing a published slug changes its URL; old URLs return 404.
- Repeatable profile entries can be reordered or hidden. Projects use an order number and homepage feature flag. Empty sections are omitted.
- Concurrent edits return a conflict instead of overwriting another administrator’s changes. Copy any edits you need to retain before choosing **Reload latest version**.
- Upload JPEG, PNG, WebP, or PDF files in the media library. Images require an accessible description and are re-encoded to WebP, stripped of metadata, and resized to at most 1800px. PDFs have a 10 MB limit and are served with a sandbox policy. A résumé has both view and download links.
- Draft-only assets require administrator authentication. Published asset access is checked on every request, and unpublishing revokes public access. Keep the storage bucket private. Referenced files cannot be deleted from the library.
- Stories use constrained Markdown with headings, lists, emphasis, links, and quotes. Raw HTML and inline image embedding are disabled; use the gallery for images.

## Deploy with Dokploy

Use a **Docker Compose** project with `compose.dokploy.yaml`. The production stack pulls prebuilt GHCR images for the app, email worker, and setup service. `compose.yaml` remains the local source-build configuration.

1. Connect this repository to Dokploy and select `compose.dokploy.yaml`. Give Dokploy access to the two GHCR images, `ghcr.io/macm18/resume-st` and `ghcr.io/macm18/resume-st-tools`: make both packages public or configure a GHCR registry credential with `read:packages`.
2. Paste your production settings into Dokploy’s environment configuration so it supplies the Compose `.env` file. Provide an external PostgreSQL connection, a separate production auth secret, SMTP, and S3 credentials. Use `DATABASE_URL=postgresql://.../production_database?schema=portfolio&sslmode=require` when your provider requires TLS. Leave `DOCKER_DATABASE_URL` unset so it inherits `DATABASE_URL`.
3. Set `BETTER_AUTH_URL` and `SITE_URL` to the exact public HTTPS origin. Set `DEMO_MODE=false`. Supply the two account groups for initial provisioning.
4. Create the private production S3 bucket beforehand; the development bucket initialization is not run in production. Set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY`. Set `S3_ENDPOINT` for compatible providers; leave it blank for AWS S3. The application credentials need only object Get/Put/Delete in that bucket.
5. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true` for implicit TLS, usually port 465), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (a verified sender), and `CONTACT_TO` (one address or a comma-separated recipient list). Visitor email is Reply-To, never the sender.
6. In Dokploy Domains, route your domain to service **app**, container port **3000**, with HTTPS. The production Compose exposes the internal port without binding a host port. Dokploy manages routing labels and networks. [Dokploy domain instructions](https://docs.dokploy.com/docs/core/docker-compose/domains).
7. Add a GitHub Actions repository secret named `DOKPLOY_WEBHOOK_URL` containing the Dokploy Compose deployment webhook URL. A push to `main` builds and pushes both images to GHCR, then calls that webhook. Other branches do not deploy production. The workflow fails before the webhook if either image fails to publish. The webhook only confirms Dokploy accepted the request; check the deployment result in Dokploy.
8. Deploy. The setup service must succeed before app/worker start. Check `/api/health`, sign in, upload real content, preview, and publish. The site remains “coming soon” until publication.

Use one application instance and one or more email workers. The public cache is local to the application instance. Multiple application replicas require shared cache invalidation before scaling.

If PostgreSQL is another Dokploy container, attach setup, app, and worker to that database’s external network in a local Compose override and use its DNS name. Do not expose PostgreSQL publicly for this application.

### Rate limiting and request limits

Login/reset limits are stored by Better Auth in PostgreSQL. Contact submissions are limited to five per 15 minutes. By default the app uses a shared fallback bucket. For per-visitor limits, configure your trusted reverse proxy to **overwrite** `X-Real-IP` from the actual client address and set `TRUST_PROXY=true`; never enable it when callers can supply this header directly. Configure a proxy request-body limit of 12 MB as a second boundary for file uploads.

### Email reliability

Contact submission and the pending email job are stored together. SMTP failure does not lose messages. The worker uses database row locks, bounded exponential retry (five attempts), and a five-minute stale-claim recovery. The inbox shows status and supports manual retry of failed alerts. Delivery is at-least-once: a crash after SMTP acceptance but before status persistence may cause a duplicate; stable Message-ID helps clients recognize it.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit
```

Integration tests require the configured development database and create/delete only test-prefixed content. Browser tests require the running app, local storage, Mailpit, and an initialized draft profile. Run them with the email worker stopped so they can deterministically exercise delivery failures. They provision two temporary accounts and remove their own content/accounts afterward. Never run the browser suite against production. `TEST_BASE_URL` defaults to `http://localhost:3000`.

Run the full local Docker stack:

```sh
docker compose -f compose.yaml -f compose.dev.yaml up --build -d
```

Stop a locally running Node server first to free port 3000. Services: app, worker, setup, private RustFS storage, development bucket initialization, and Mailpit. The existing PostgreSQL container is external and is never managed by this Compose project.

## Backups and operations

- Back up the `portfolio` PostgreSQL schema regularly, before migrations, and enable provider PITR where available. Use a database-client password prompt or private service file rather than putting passwords in shell commands.
- Enable production bucket versioning/backups. Restore database metadata and storage objects from matching recovery points; the database alone does not contain the files.
- Keep auth and storage secrets in Dokploy secrets/environment settings; `.env*` is excluded from Git and Docker build contexts. Back up required secrets separately.
- Monitor `/api/health`, setup/app/worker logs, and failed inbox alerts. Database health does not imply SMTP or storage health; verify a real upload and test contact after deployment.
- Keep this initial migration’s schema name `portfolio`. To use another schema, create an explicit migration strategy rather than editing a migration that has already been applied.
- The MACM.lk footer credit is part of the site design and stays present on every public page.
