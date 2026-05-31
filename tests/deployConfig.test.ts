import { existsSync } from 'node:fs';

import { describe, expect, test } from 'bun:test';

describe('deployment config', () => {
  test('keeps provider-neutral build scripts for Appwrite', async () => {
    const pkg = await Bun.file('package.json').json();

    expect(pkg.scripts['deploy-build']).toBe('bun run fetch && bun run build');
    expect(pkg.scripts['hosted:smoke']).toBe('bun scripts/hostedSmoke.ts');
    expect(pkg.scripts['vercel-build']).toBeUndefined();
  });

  test('does not keep active legacy-provider deployment config', () => {
    expect(existsSync('vercel.json')).toBe(false);
    expect(existsSync('netlify.toml')).toBe(false);
  });
});
