import { describe, expect, test } from 'bun:test';

describe('tooling', () => {
  test('bun test runs TypeScript tests', () => {
    expect(Bun.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
