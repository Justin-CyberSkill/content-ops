# Deploy to Vercel and Neon

First production deploy, in order. Each step ends with a check. Nothing here is automatic: every account, secret and merge is a person's call.

The order matters. Migrations run from GitHub Actions only after a push to `main` (`.github/workflows/ci.yml`), and Vercel deploys on the same push. So set up the database and run migrations before Vercel exists, and the first deploy never meets an empty database.

## What you need

- Admin on `github.com/cyberskill-official/content-ops`, to add a secret and merge to `main`.
- A Neon account and a Vercel account for CyberSkill. Vercel's Hobby plan is for non-commercial use only, so a company app needs Pro.
- On your machine: Node 22.18+, pnpm 10, `openssl`, and this repo on the branch you will merge.

## 1. Create the Neon database

1. In the Neon console, create a project named `content-ops`. Pick region **AWS Asia Pacific (Singapore)** and Postgres **17**, which matches local Docker.
2. Open **Connect** on the `main` branch. Copy two connection strings:
   - **Pooled** (host contains `-pooler`): this becomes `DATABASE_URL` for the app.
   - **Direct** (turn "Connection pooling" off): this becomes `DATABASE_URL_UNPOOLED`, used only for migrations and the admin seed.

Check: both strings end in `?sslmode=require` and only the pooled one has `-pooler` in the host.

Keep both strings in a password manager, never in the repo or chat.

## 2. Give GitHub the migration secret

In the GitHub repo: **Settings > Secrets and variables > Actions > New repository secret**. Name `DATABASE_URL_UNPOOLED`, value the **direct** string.

Without this secret the `migrate` job skips with a notice, and the app would deploy against an empty database.

Check: the secret is listed under Repository secrets.

## 3. Merge to `main` through a pull request

`gh` on the Mac is signed in as an account that can't see the repo, so use the GitHub website.
1. Open a pull request from `feat/v1-content-ops` into `main`. CI runs on pull requests only, so this is the first CI run of the branch.
2. Wait for the `ci` job to pass (`pnpm check` and `pnpm build`).
3. Merge.

The push to `main` runs `ci` again, then `migrate`, which applies every file in `drizzle/` to Neon.

Check: the `migrate` job is green and its log ends with `migrations applied successfully`. In the Neon SQL editor, `select count(*) from work_type;` returns 4.

## 4. Create the first admin

From your machine, against the **direct** string. Values on the command line win over `.env.local`.

```bash
DATABASE_URL='<direct string>' ADMIN_EMAIL='you@cyberskill.world' ADMIN_NAME='Justin' pnpm db:seed-admin
```

It prints a temporary password once. Keep it for step 7.

Check: the output says `you@cyberskill.world is an admin.`

## 5. Create the Vercel project

1. **Add New > Project**, import `cyberskill-official/content-ops`. Vercel detects Next.js and pnpm (from `packageManager`); keep the default build settings.
2. Project name `content-ops` (or whatever you choose). The address will be `https://<project-name>.vercel.app` unless the name is taken; Vercel shows it before the first deploy.
3. Before deploying, add the environment variables below for **Production only**.

| Name                 | Value                                                         |
| -------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`       | Neon **pooled** string                                        |
| `BETTER_AUTH_SECRET` | a new value from `openssl rand -base64 32`, not the local one |
| `BETTER_AUTH_URL`    | `https://<project-name>.vercel.app`, no trailing slash        |

`DATABASE_URL_UNPOOLED`, `ADMIN_EMAIL` and `ADMIN_NAME` stay out of Vercel: only migrations and the seed script read them.
4. Deploy.

Check: the deployment is Ready and the build log shows the route list.

## 6. Project settings after the first deploy

- **Settings > Build and Deployment > Node.js Version**: `22.x`, the version CI uses.
- **Settings > Functions > Function Region**: Singapore (`sin1`), next to the database. Redeploy afterwards.
- **Settings > Git > Ignored Build Step**: choose "Custom" and enter `[ "$VERCEL_ENV" != "production" ]`. Preview builds have no environment variables and their addresses don't match `BETTER_AUTH_URL`, so sign-in can't work there; this skips them.
- **Custom domain** (optional): add it under **Settings > Domains**, then set `BETTER_AUTH_URL` to it and redeploy. Sign-in only accepts requests from the address in `BETTER_AUTH_URL`.

## 7. Smoke test

1. Open `https://<address>/vi/sign-in` and sign in with the admin email and temporary password.
2. Change the password on the Account page.
3. **Settings > Members**: add TuyetKy and Jay. Give each their temporary password in person.
4. **Settings > Work types** shows the four built-in types.
5. Create one content item, move it to review, and check it appears under Review.

## 8. Connect agents

Agent keys live in the database, so keys made locally don't work in production.
1. **Settings > Agents**: create a key. It is shown once.
2. The page shows the `claude mcp add` command with the production address. Run it with the real key in place of `csops_…`. If a local `content-ops` server is already set up, remove it first with `claude mcp remove content-ops`.
3. Run `claude mcp list` and check `content-ops` is connected.

Each key allows 30 requests a minute.

## Later deploys

Merge to `main`. Vercel deploys and the `migrate` job runs in parallel, so the new code can be live a minute before its migration. Keep migrations additive (new tables and nullable columns) so the old code keeps working through that minute.

## Undo

- **App**: Vercel **Deployments**, pick the previous one, **Instant Rollback**.
- **Data**: Neon **Restore** brings a branch back to a point in time, within the plan's history window. Restoring after a migration does not undo the migration files in `main`; revert those in git too.
