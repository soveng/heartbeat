import { describe, expect, test } from 'bun:test';

const currentForkSection = (changelog: string) =>
  changelog.split('\n## [Upstream 0.1.0]')[0] ?? changelog;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ');

describe('changelog', () => {
  test('keeps the current fork section Netlify-canonical', async () => {
    const changelog = await Bun.file('CHANGELOG.md').text();
    const currentFork = currentForkSection(changelog);
    const normalizedCurrentFork = collapseWhitespace(currentFork);

    expect(normalizedCurrentFork).toContain(
      'Made Netlify the canonical deployment provider and moved legacy deployment-provider config out of the active branch.',
    );
    expect(normalizedCurrentFork).toContain(
      'Switched scheduled refreshes to a Netlify build hook.',
    );
    expect(normalizedCurrentFork).toContain(
      'Netlify security and cache headers for the static deployment.',
    );
    expect(currentFork).not.toMatch(/vercel/i);
  });
});
