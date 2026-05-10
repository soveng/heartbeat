import { describe, expect, test } from 'bun:test';
import { filterEvents } from '../src/lib/filterEvents';
import type { Event } from '../src/types';

const events: Event[] = [
  {
    id: 'soveng/heartbeat:commit:1',
    repo: 'soveng/heartbeat',
    type: 'commit',
    timestamp: '2026-05-09T00:00:00Z',
    actor: 'alice',
    title: 'update heartbeat',
    url: 'https://github.com/soveng/heartbeat/commit/1',
    shortId: 'abc1234',
  },
  {
    id: 'soveng/website:issue_opened:2',
    repo: 'soveng/website',
    type: 'issue_opened',
    timestamp: '2026-05-08T00:00:00Z',
    actor: 'bob',
    title: 'update website',
    url: 'https://github.com/soveng/website/issues/2',
    shortId: '#2',
  },
];

describe('filterEvents', () => {
  test('filters by repo query without requiring serialized repo selections', () => {
    expect(
      filterEvents(events, {
        repoQuery: 'heart',
        groupRepos: null,
        repoSelection: null,
        typeSelection: null,
        actorSelection: null,
      }).map((event) => event.repo),
    ).toEqual(['soveng/heartbeat']);
  });

  test('keeps explicit repo selections independent from repo query', () => {
    expect(
      filterEvents(events, {
        repoQuery: '',
        groupRepos: null,
        repoSelection: new Set(['soveng/website']),
        typeSelection: null,
        actorSelection: null,
      }).map((event) => event.repo),
    ).toEqual(['soveng/website']);
  });

  test('combines query and group filters', () => {
    expect(
      filterEvents(events, {
        repoQuery: 'soveng',
        groupRepos: new Set(['soveng/heartbeat']),
        repoSelection: null,
        typeSelection: null,
        actorSelection: null,
      }).map((event) => event.repo),
    ).toEqual(['soveng/heartbeat']);
  });
});
