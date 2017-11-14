export default async function(api, repo, {title, originBranch}) {
  console.log(`Making pull request from: ${originBranch}`);
  await api.pullRequests.create({
    owner: repo.upstream,
    repo: repo.name,
    title,
    body: 'Created with fusion-orchestrate.',
    head: `${process.env.GITHUB_USER}:${originBranch}`,
    base: 'master',
  });
}
