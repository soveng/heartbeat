import { z } from 'zod';
import { graphql } from '@octokit/graphql';
import type {
  CommitNode,
  GitHubRepoActivity,
  IssueNode,
  PrNode,
  ReleaseNode,
} from './events';

const GithubRepoSchema = z.object({
  full_name: z.string(),
  archived: z.boolean().default(false),
  private: z.boolean().default(false),
});

const GithubRepoListSchema = z.array(GithubRepoSchema);

type ListOwnerReposOptions = {
  token?: string;
  apiBase?: string;
};

function githubHeaders(token: string | undefined): Record<string, string> {
  return {
    accept: 'application/vnd.github+json',
    'user-agent': 'soveng-heartbeat',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchOwnerReposFromEndpoint(
  apiBase: string,
  endpoint: 'orgs' | 'users',
  owner: string,
  token: string | undefined,
): Promise<string[] | null> {
  const repos: string[] = [];
  for (let page = 1; ; page += 1) {
    const url = `${apiBase}/${endpoint}/${encodeURIComponent(owner)}/repos?per_page=100&page=${page}`;
    const res = await fetch(url, { headers: githubHeaders(token) });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`GitHub repo list failed for ${owner}: ${res.status} ${res.statusText}`);
    }

    const batch = GithubRepoListSchema.parse(await res.json());
    for (const repo of batch) {
      if (!repo.private && !repo.archived) repos.push(repo.full_name);
    }
    if (batch.length < 100) break;
  }
  return repos;
}

export async function listPublicOwnerRepos(
  owner: string,
  options: ListOwnerReposOptions = {},
): Promise<string[]> {
  const token = options.token ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const apiBase = options.apiBase ?? 'https://api.github.com';
  const orgRepos = await fetchOwnerReposFromEndpoint(apiBase, 'orgs', owner, token);
  const repos =
    orgRepos ?? (await fetchOwnerReposFromEndpoint(apiBase, 'users', owner, token)) ?? [];
  return [...new Set(repos)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

type RepoQueryResult = {
  repository: {
    nameWithOwner: string;
    defaultBranchRef: { target: { history: { nodes: CommitNode[] } } } | null;
    pullRequests: { nodes: PrNode[] };
    issues: { nodes: IssueNode[] };
    releases: { nodes: ReleaseNode[] };
  } | null;
};

export type RepoFetchLimits = {
  commits: number;
  prs: number;
  issues: number;
  releases: number;
};

const REPO_QUERY = /* GraphQL */ `
  query Repo(
    $owner: String!
    $name: String!
    $commits: Int!
    $prs: Int!
    $issues: Int!
    $releases: Int!
  ) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: $commits) {
              nodes {
                oid
                abbreviatedOid
                committedDate
                messageHeadline
                url
                author {
                  name
                  user {
                    login
                  }
                }
              }
            }
          }
        }
      }
      pullRequests(first: $prs, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          number
          title
          url
          createdAt
          mergedAt
          closedAt
          merged
          author {
            login
          }
          mergedBy {
            login
          }
        }
      }
      issues(first: $issues, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          number
          title
          url
          createdAt
          closedAt
          author {
            login
          }
        }
      }
      releases(first: $releases, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          tagName
          name
          url
          publishedAt
          createdAt
          author {
            login
          }
        }
      }
    }
  }
`;

export async function fetchRepoActivity(
  client: typeof graphql,
  repoName: string,
  limits: RepoFetchLimits,
): Promise<GitHubRepoActivity | null> {
  const [owner, name] = repoName.split('/');
  const data = await client<RepoQueryResult>(REPO_QUERY, {
    owner,
    name,
    commits: limits.commits,
    prs: limits.prs,
    issues: limits.issues,
    releases: limits.releases,
  });
  const repo = data.repository;
  if (!repo) return null;
  return {
    repo: repoName,
    commits: repo.defaultBranchRef?.target.history.nodes ?? [],
    pullRequests: repo.pullRequests.nodes,
    issues: repo.issues.nodes,
    releases: repo.releases.nodes,
  };
}
