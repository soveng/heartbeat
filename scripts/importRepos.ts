import { loadRepoConfig } from './repoSources';

const config = await loadRepoConfig();

console.log(`Loaded ${config.projectCount} project(s) from ${config.source}`);
console.log(
  `Resolved ${config.repos.length} unique GitHub repo(s) across ${Object.keys(config.groups).length} group(s)`,
);
for (const [group, repos] of Object.entries(config.groups)) {
  console.log(`  ${group}: ${repos.length} repo(s)`);
}
if (config.skipped.length > 0) {
  console.log(`Skipped ${config.skipped.length} non-repo link(s)`);
}
