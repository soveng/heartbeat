import { describe, expect, test } from 'bun:test';

describe('deployment docs', () => {
  test('document Netlify as the canonical deployment path', async () => {
    const readme = await Bun.file('README.md').text();

    expect(readme).toContain('### Netlify');
    expect(readme).toContain('GITHUB_TOKEN');
    expect(readme).toContain('GH_TOKEN');
    expect(readme).toContain('SOVENG_PROJECTS_JSON');
    expect(readme).toContain('NETLIFY_BUILD_HOOK_URL');
    expect(readme).toContain('bun run deploy-build');
    expect(readme).toContain('dist');
    expect(readme).toContain('heartbeat.sovereignengineering.io');
    expect(readme).toContain('heartbeat-soveng.netlify.app');
    expect(readme).not.toMatch(/vercel/i);
  });
});
