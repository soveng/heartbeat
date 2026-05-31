import { DatasetSchema } from '../src/types';

type CheckResult = {
  label: string;
  ok: boolean;
  detail?: string;
};

type SmokeResponse = {
  url: URL;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

const REQUIRED_ROOT_HEADERS: Record<string, string> = {
  'content-security-policy': "default-src 'self'",
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=()',
};

const EVENTS_CACHE_HEADER = 'max-age=0';
const ASSET_CACHE_HEADER = 'max-age=31536000';

function baseUrl(): URL {
  const raw = process.argv[2] ?? process.env.HOSTED_BASE_URL;
  if (!raw) {
    throw new Error('Provide HOSTED_BASE_URL or pass the hosted base URL as the first argument.');
  }
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Hosted base URL must use http or https: ${raw}`);
  }
  return url;
}

function at(base: URL, path: string): URL {
  return new URL(path, base);
}

function curl(args: string[], url: URL): string {
  const result = Bun.spawnSync({
    cmd: ['curl', ...args, url.toString()],
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (result.exitCode !== 0) {
    throw new Error(`${url} curl failed: ${result.stderr.toString().trim()}`);
  }
  return result.stdout.toString();
}

function parseHeaders(
  raw: string,
  url: URL,
): Pick<SmokeResponse, 'status' | 'statusText' | 'headers'> {
  const blocks = raw
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const block = blocks.at(-1);
  if (!block) {
    throw new Error(`${url} returned no response headers`);
  }

  const [statusLine, ...lines] = block.split(/\r?\n/);
  const statusMatch = statusLine?.match(/^HTTP\/\S+\s+(\d+)\s*(.*)$/i);
  if (!statusMatch) {
    throw new Error(`${url} returned malformed status line: ${statusLine}`);
  }

  const headers: Record<string, string> = {};
  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    headers[name] = headers[name] ? `${headers[name]}, ${value}` : value;
  }

  return {
    status: Number(statusMatch[1]),
    statusText: statusMatch[2] ?? '',
    headers,
  };
}

async function fetchOk(url: URL): Promise<SmokeResponse> {
  const head = parseHeaders(curl(['-fsSIL', '--max-time', '15'], url), url);
  const body = curl(['-fsSL', '--max-time', '15'], url);
  return { url, ...head, body };
}

function header(res: SmokeResponse, name: string): string | null {
  return res.headers[name.toLowerCase()] ?? null;
}

function expectHeader(res: SmokeResponse, name: string, expected: string): CheckResult {
  const actual = header(res, name);
  return {
    label: `${name} header`,
    ok: actual !== null && actual.includes(expected),
    detail: actual === null ? 'missing' : actual,
  };
}

function findAssetPath(html: string): string | null {
  const match = html.match(/\b(?:src|href)="([^"]*\/assets\/[^"]+)"/);
  return match?.[1] ?? null;
}

async function checkRoot(base: URL): Promise<{ html: string; checks: CheckResult[] }> {
  const res = await fetchOk(at(base, '/'));
  const html = res.body;
  const checks: CheckResult[] = [
    {
      label: 'root HTML contains app title',
      ok: html.includes('heartbeat') && html.includes('Sovereign Engineering'),
    },
  ];
  for (const [header, expected] of Object.entries(REQUIRED_ROOT_HEADERS)) {
    checks.push(expectHeader(res, header, expected));
  }
  return { html, checks };
}

async function checkEvents(base: URL): Promise<CheckResult[]> {
  const res = await fetchOk(at(base, '/data/events.json'));
  const json = JSON.parse(res.body);
  const dataset = DatasetSchema.parse(json);
  return [
    {
      label: 'events dataset parses',
      ok: Array.isArray(dataset.events) && dataset.generatedAt.length > 0,
      detail: `${dataset.events.length} events generated at ${dataset.generatedAt}`,
    },
    expectHeader(res, 'cache-control', EVENTS_CACHE_HEADER),
  ];
}

async function checkOgImage(base: URL): Promise<CheckResult[]> {
  const res = await fetchOk(at(base, '/soveng-og-logo.jpg'));
  const contentType = header(res, 'content-type') ?? '';
  return [
    {
      label: 'OpenGraph image content type',
      ok: contentType.includes('image/jpeg'),
      detail: contentType,
    },
  ];
}

async function checkAsset(base: URL, html: string): Promise<CheckResult[]> {
  const assetPath = findAssetPath(html);
  if (!assetPath) {
    return [{ label: 'discover built asset URL', ok: false, detail: 'no /assets/ URL in HTML' }];
  }
  const res = await fetchOk(at(base, assetPath));
  return [expectHeader(res, 'cache-control', ASSET_CACHE_HEADER)];
}

function print(checks: CheckResult[]): boolean {
  let ok = true;
  for (const check of checks) {
    if (check.ok) {
      console.log(`ok - ${check.label}${check.detail ? ` (${check.detail})` : ''}`);
      continue;
    }
    ok = false;
    console.error(`not ok - ${check.label}${check.detail ? ` (${check.detail})` : ''}`);
  }
  return ok;
}

async function main() {
  const base = baseUrl();
  const { html, checks: rootChecks } = await checkRoot(base);
  const checks = [
    ...rootChecks,
    ...(await checkEvents(base)),
    ...(await checkOgImage(base)),
    ...(await checkAsset(base, html)),
  ];
  if (!print(checks)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
