import { describe, expect, test } from 'bun:test';

describe('refresh workflow', () => {
  test('uses the Netlify build hook secret for scheduled refreshes', async () => {
    const workflow = await Bun.file('.github/workflows/refresh.yml').text();

    expect(workflow).toContain('Refresh Netlify Deploy');
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain("cron: '0 */6 * * *'");
    expect(workflow).toContain('curl -fsS -X POST "$HOOK"');
    expect(workflow).toContain('secrets.NETLIFY_BUILD_HOOK_URL');
    expect(workflow).not.toMatch(/vercel/i);
  });
});
