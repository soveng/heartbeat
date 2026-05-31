import { describe, expect, test } from 'bun:test';

describe('deployment docs', () => {
  test('document Appwrite as the canonical deployment path', async () => {
    const readme = await Bun.file('README.md').text();

    expect(readme).toContain('### Appwrite');
    expect(readme).toContain('GITHUB_TOKEN');
    expect(readme).toContain('GH_TOKEN');
    expect(readme).toContain('SOVENG_PROJECTS_JSON');
    expect(readme).toContain('APPWRITE_ENDPOINT');
    expect(readme).toContain('APPWRITE_PROJECT_ID');
    expect(readme).toContain('APPWRITE_SITE_ID');
    expect(readme).toContain('APPWRITE_API_KEY');
    expect(readme).toContain('bun run deploy-build');
    expect(readme).toContain('bun run hosted:smoke');
    expect(readme).toContain('dist');
    expect(readme).toContain('heartbeat.sovereignengineering.io');
    expect(readme).not.toContain('NETLIFY_BUILD_HOOK_URL');
    expect(readme).not.toContain('heartbeat-soveng.netlify.app');
    expect(readme).not.toContain('Netlify is the canonical');
    expect(readme).not.toMatch(/vercel/i);
  });
});
