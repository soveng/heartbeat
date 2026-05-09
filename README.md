# heartbeat

Static activity dashboard for a set of GitHub repos. Renders commits, PRs,
issues, and releases as a `git log --oneline`-style timeline.

Live at [heartbeat.opensats.org](https://heartbeat.opensats.org/)

A GitHub Action fetches data via the GitHub GraphQL API at build time and
writes `public/data/events.json`. The browser never talks to GitHub directly,
so visitors don't burn any rate-limit budget.

Today only GitHub is wired up. The plan is to also pull from Gitea, GitLab,
and nostr-native hosts like [gitworkshop.dev](https://gitworkshop.dev/).

## Develop

Requires Bun 1.3+.

```bash
bun install
export GITHUB_TOKEN=ghp_yourtoken   # any PAT; no scopes needed for public repos
bun run fetch                       # writes public/data/events.json
bun run dev
```

## Configure

Each `repos*.yml` file at the project root lists tracked repos; all matching
files are merged and deduplicated.

```yaml
repos:
  - owner/repo-1
  - owner/repo-2
```

Knobs (time window, page sizes) live at the top of
[`scripts/fetch.ts`](scripts/fetch.ts).

## Deploy

Built for Vercel. Set `GITHUB_TOKEN` as an env var; `vercel-build` runs
`bun run fetch && bun run build`. For periodic refreshes, save a Vercel
Deploy Hook URL as the `VERCEL_DEPLOY_HOOK_URL` repo secret and the included
[`refresh.yml`](.github/workflows/refresh.yml) workflow pings it every 6 hours.
