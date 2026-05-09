import type { Event, EventType } from '../src/types';

export type Actor = { login: string } | null;

export type CommitNode = {
  oid: string;
  abbreviatedOid: string;
  committedDate: string;
  messageHeadline: string;
  url: string;
  author: { user: Actor; name: string | null } | null;
};

export type PrNode = {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  merged: boolean;
  author: Actor;
  mergedBy: Actor;
};

export type IssueNode = {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  closedAt: string | null;
  author: Actor;
};

export type ReleaseNode = {
  tagName: string;
  name: string | null;
  url: string;
  publishedAt: string | null;
  createdAt: string;
  author: Actor;
};

export type GitHubRepoActivity = {
  repo: string;
  commits: CommitNode[];
  pullRequests: PrNode[];
  issues: IssueNode[];
  releases: ReleaseNode[];
};

type EventInput = {
  repo: string;
  type: EventType;
  nativeId: string;
  timestamp: string;
  actor: string;
  title: string;
  url: string;
  shortId: string;
};

function makeEvent(e: EventInput): Event {
  return {
    id: `${e.repo}:${e.type}:${e.nativeId}`,
    repo: e.repo,
    type: e.type,
    timestamp: e.timestamp,
    actor: e.actor,
    title: e.title,
    url: e.url,
    shortId: e.shortId,
  };
}

const login = (a: Actor) => a?.login ?? 'unknown';

function commitToEvents(repo: string, n: CommitNode): Event[] {
  return [
    makeEvent({
      repo,
      type: 'commit',
      nativeId: n.oid,
      timestamp: n.committedDate,
      actor: n.author?.user?.login ?? n.author?.name ?? 'unknown',
      title: n.messageHeadline,
      url: n.url,
      shortId: n.abbreviatedOid,
    }),
  ];
}

function prToEvents(repo: string, n: PrNode): Event[] {
  const common = {
    repo,
    nativeId: String(n.number),
    title: n.title,
    url: n.url,
    shortId: `#${n.number}`,
  };
  const events: Event[] = [
    makeEvent({ ...common, type: 'pr_opened', timestamp: n.createdAt, actor: login(n.author) }),
  ];
  if (n.merged && n.mergedAt) {
    events.push(
      makeEvent({
        ...common,
        type: 'pr_merged',
        timestamp: n.mergedAt,
        actor: login(n.mergedBy ?? n.author),
      }),
    );
  } else if (n.closedAt) {
    events.push(
      makeEvent({ ...common, type: 'pr_closed', timestamp: n.closedAt, actor: login(n.author) }),
    );
  }
  return events;
}

function issueToEvents(repo: string, n: IssueNode): Event[] {
  const common = {
    repo,
    nativeId: String(n.number),
    title: n.title,
    url: n.url,
    shortId: `#${n.number}`,
    actor: login(n.author),
  };
  const events: Event[] = [makeEvent({ ...common, type: 'issue_opened', timestamp: n.createdAt })];
  if (n.closedAt)
    events.push(makeEvent({ ...common, type: 'issue_closed', timestamp: n.closedAt }));
  return events;
}

function releaseToEvents(repo: string, n: ReleaseNode): Event[] {
  return [
    makeEvent({
      repo,
      type: 'release',
      nativeId: n.tagName,
      timestamp: n.publishedAt ?? n.createdAt,
      actor: login(n.author),
      title: n.name ?? n.tagName,
      url: n.url,
      shortId: n.tagName,
    }),
  ];
}

export function repoActivityToEvents(activity: GitHubRepoActivity): Event[] {
  return [
    ...activity.commits.flatMap((n) => commitToEvents(activity.repo, n)),
    ...activity.pullRequests.flatMap((n) => prToEvents(activity.repo, n)),
    ...activity.issues.flatMap((n) => issueToEvents(activity.repo, n)),
    ...activity.releases.flatMap((n) => releaseToEvents(activity.repo, n)),
  ];
}
