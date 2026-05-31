import { describe, expect, test } from 'bun:test';

describe('refresh workflow', () => {
  test('uses the Appwrite VCS deployment API for scheduled refreshes', async () => {
    const workflow = await Bun.file('.github/workflows/refresh.yml').text();

    expect(workflow).toContain('Refresh Appwrite Deploy');
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain("cron: '17 */6 * * *'");
    expect(workflow).toContain('group: appwrite-refresh');
    expect(workflow).toContain('deployments/vcs');
    expect(workflow).toContain('"type":"branch","reference":"master","activate":true');
    expect(workflow).toContain('X-Appwrite-Project: $APPWRITE_PROJECT_ID');
    expect(workflow).toContain('X-Appwrite-Key: $APPWRITE_API_KEY');
    expect(workflow).toContain('secrets.APPWRITE_ENDPOINT');
    expect(workflow).toContain('secrets.APPWRITE_PROJECT_ID');
    expect(workflow).toContain('secrets.APPWRITE_SITE_ID');
    expect(workflow).toContain('secrets.APPWRITE_API_KEY');
    expect(workflow).toContain('ready)');
    expect(workflow).toContain('failed)');
    expect(workflow).not.toMatch(/netlify/i);
    expect(workflow).not.toMatch(/vercel/i);
  });
});
