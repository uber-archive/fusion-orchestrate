async function getRepo(api, repo) {
  try {
    await api.repos.get({
      owner: process.env.GITHUB_USER,
      repo: repo.name
    });
    console.log(' - ok, found fork');
  } catch(e) {
    console.log(' - repo not found, forking');
  }

  try {
    await api.repos.fork({
      owner: repo.upstream,
      repo: repo.name,
    });
  } catch(e) {
    console.warn(' - error forking repo');
  }
}

export default async function (api, repo) {
  console.log(`Ensuring github fork for ${process.env.GITHUB_USER}/${repo.name}`);
  await getRepo(api, repo);
};
