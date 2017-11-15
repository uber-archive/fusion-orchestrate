process.on('unhandledRejection', e => {
  throw e;
});

import withEachRepo from './utils/withEachRepo.mjs';

console.log('The following PRs need your review');
withEachRepo(async (api, repo) => {
  const {data: pulls} = await api.pullRequests.getAll({
    owner: repo.upstream,
    repo: repo.name,
    state: 'open',
  });
  pulls
    .filter(p => {
      return p.user.login !== process.env.GITHUB_USER;
    })
    .forEach(async pull => {
      const {data: reviews} = await api.pullRequests.getReviews({
        owner: repo.upstream,
        repo: repo.name,
        number: pull.number,
      });
      if (reviews.length === 0) {
        console.log(pull.html_url);
      }
    });
}, true);
