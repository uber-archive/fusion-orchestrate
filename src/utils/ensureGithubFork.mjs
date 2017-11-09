function getRepo(api, repo) {
  return new Promise((resolve, reject) => {
    api.repos.get({
      owner: process.env.GITHUB_USER,
      repo: repo.name
    }).then((repo) => {
      console.log(' - ok, found fork')
      resolve();
    }, (error) => {
      console.log(' - repo not found, forking');
      api.repos.fork({
        owner: repo.upstream,
        repo: repo.name,
      }).then(
        resolve,
        () => {
          console.warn(' - error forking repo');
        }
      );
    });
  });
}

export default async function (api, repo) {
  console.log(`Ensuring github fork for ${process.env.GITHUB_USER}/${repo.name}`);
  await getRepo(api, repo);
};
