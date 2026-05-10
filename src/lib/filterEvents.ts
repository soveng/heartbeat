import type { Event } from '../types';

export type EventFilters = {
  groupRepos: Set<string> | null;
  repoSelection: Set<string> | null;
  typeSelection: Set<string> | null;
  actorSelection: Set<string> | null;
  repoQuery: string;
};

function inSet<T>(set: Set<T> | null, value: T): boolean {
  return !set || set.size === 0 || set.has(value);
}

export function filterEvents(events: Event[], filters: EventFilters): Event[] {
  const query = filters.repoQuery.trim().toLowerCase();
  return events.filter(
    (event) =>
      (!filters.groupRepos || filters.groupRepos.has(event.repo)) &&
      (!query || event.repo.toLowerCase().includes(query)) &&
      inSet(filters.repoSelection, event.repo) &&
      inSet(filters.typeSelection, event.type) &&
      inSet(filters.actorSelection, event.actor),
  );
}
