import { describe, expect, test } from 'bun:test';

const currentForkSection = (changelog: string) =>
  changelog.split('\n## [Upstream 0.1.0]')[0] ?? changelog;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ');

describe('changelog', () => {
  test('keeps the current fork section Appwrite-canonical', async () => {
    const changelog = await Bun.file('CHANGELOG.md').text();
    const currentFork = currentForkSection(changelog);
    const normalizedCurrentFork = collapseWhitespace(currentFork);

    expect(normalizedCurrentFork).toContain(
      'Made Appwrite the canonical hosted deployment provider and moved legacy deployment-provider config out of the active branch.',
    );
    expect(normalizedCurrentFork).toContain(
      'Switched scheduled refreshes to the Appwrite VCS deployment API.',
    );
    expect(normalizedCurrentFork).toContain(
      'Hosted deployment smoke checks for the generated activity feed, OpenGraph image, and security/cache headers.',
    );
    expect(currentFork).not.toMatch(/netlify/i);
    expect(currentFork).not.toMatch(/vercel/i);
  });
});
