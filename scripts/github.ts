import { z } from 'zod';

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
