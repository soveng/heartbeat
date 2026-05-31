# heartbeat

Static activity dashboard for projects explored at Sovereign Engineering cohorts.
It renders commits, PRs, issues, and releases as a compact `git log --oneline`
style timeline.

Target site: [heartbeat.sovereignengineering.io](https://heartbeat.sovereignengineering.io/)

Data is fetched at build time. The browser only reads `public/data/events.json`,
so visitors never call GitHub directly and never spend API rate limit.

Fork provenance: this project is adapted from
[OpenSats/heartbeat](https://github.com/OpenSats/heartbeat). Keep the `upstream`
remote pointed at OpenSats for later generic fix PRs.

## Develop

Requires Bun 1.3+.

```bash
bun install
export GITHUB_TOKEN=ghp_yourtoken   # public_repo scope is enough for public repos
bun run fetch                       # writes public/data/events.json
bun run dev
```

Useful checks:

```bash
bun test
bun run typecheck
bun run lint
bun run format:check
bun run build
```

## Configure

Heartbeat derives its repo set from the Sovereign Engineering website project
catalog.

Default source:

- `https://raw.githubusercontent.com/soveng/website/main/src/data/showcaseProjects.json`

Rules:

- GitHub repo URLs become `owner/repo`.
- GitHub URLs with deeper paths, such as `/pull/123` or `/tree/main`, still map
  to the base repo.
- GitHub owner/org URLs, such as `github.com/orgs/Routstr`, expand to all public
  non-archived repos for that owner.
- Public `github.com/soveng` repos are always added to the `soveng` group.
- Non-GitHub and site-only project links are reported and skipped.

Override source for local testing:

```bash
SOVENG_PROJECTS_JSON=/path/to/showcaseProjects.json bun run import:repos
SOVENG_PROJECTS_JSON=https://example.com/showcaseProjects.json bun run fetch
```

Knobs for the activity window and per-repo page sizes live at the top of
[`scripts/fetch.ts`](scripts/fetch.ts).

## Branch workflow

- `master` is the Sovereign Engineering heartbeat base.
- `upstream/master` tracks OpenSats heartbeat and is not used as the fork base.
- Create scoped issue branches from latest `master`, named `issue/NN-short-name`.
- Merge issue branches back to `master` with `git merge --ff-only`.
- Keep issue branches after merge so they remain available for review and later
  upstream extraction.
- For upstream PRs, create new branches from `upstream/master` and manually port
  only generic fixes. Do not include Sovereign Engineering branding, catalog
  logic, domain config, or Bun-only choices unless upstream asks for them.

## Deploy

Appwrite is the canonical hosted deployment path for this fork.

Built with Bun. Deployment builds must run the GitHub fetcher before `vite build`
because `public/data/events.json` is generated and intentionally ignored by git.
The browser only reads the generated file from the published `dist` output.

Local env:

- `GITHUB_TOKEN` or `GH_TOKEN`: GitHub token used locally by the fetcher for owner expansion and GraphQL activity fetches.
- `SOVENG_PROJECTS_JSON`: optional explicit project catalog path or URL.
- `HOSTED_BASE_URL`: optional base URL for `bun run hosted:smoke`.

Appwrite site env:

- `GITHUB_TOKEN`: read-only GitHub token used by `bun run fetch`.
- `SOVENG_PROJECTS_JSON`: optional explicit project catalog path or URL.

GitHub Actions repo secrets:

- `APPWRITE_ENDPOINT`: Appwrite endpoint including `/v1`, for example `https://<REGION>.cloud.appwrite.io/v1`.
- `APPWRITE_PROJECT_ID`: Appwrite project id.
- `APPWRITE_SITE_ID`: Appwrite site id.
- `APPWRITE_API_KEY`: Appwrite API key scoped to create and read site deployments.

### Appwrite

Create an Appwrite Sites project linked to `soveng/heartbeat`:

- Production branch: `master`
- Framework/rendering: static site
- Install command:

  ```bash
  curl -fsSL https://bun.com/install | bash -s "bun-v1.3.3" && export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && bun --version && bun install --frozen-lockfile
  ```

- Build command:

  ```bash
  export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && bun run deploy-build
  ```

- Output directory: `dist`

Scheduled refreshes are handled by `.github/workflows/refresh.yml`. The workflow
uses the Appwrite VCS deployment API every 6 hours to rebuild `master` and
activate the new deployment when it becomes ready.

Verification commands:

```bash
HOSTED_BASE_URL=https://<appwrite-generated-domain> bun run hosted:smoke
HOSTED_BASE_URL=https://heartbeat.sovereignengineering.io bun run hosted:smoke
```

Cutover checklist:

1. Deploy and verify the Appwrite generated domain.
2. Add custom domain `heartbeat.sovereignengineering.io` in Appwrite.
3. Point DNS as requested by Appwrite.
4. Run the custom-domain smoke check above.
5. Keep the previous hosting provider available for 24 hours as rollback.
