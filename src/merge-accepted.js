const withEachRepo = require('./utils/withEachRepo.js');
const logPR = require('./utils/logPR');
const chalk = require('chalk');

module.exports = () => {
  console.log(chalk.bold.underline.red('\nMerging Pull Requests:\n'));
  withEachRepo(async (api, repo) => {
    const {data: pulls} = await api.pullRequests.getAll({
      owner: repo.upstream,
      repo: repo.name,
      state: 'open',
    });
    for (const pull of pulls) {
      const {data: status} = await api.repos.getCombinedStatusForRef({
        owner: repo.upstream,
        repo: repo.name,
        ref: pull.head.sha,
      });
      const {data: reviews} = await api.pullRequests.getReviews({
        owner: repo.upstream,
        repo: repo.name,
        number: pull.number,
      });
      const hasStamp = reviews.some(r => {
        return r.state === 'APPROVED';
      });
      if (status.state === 'success' && hasStamp) {
        logPR(pull);
        await api.issues.createComment({
          owner: repo.upstream,
          repo: repo.name,
          number: pull.number,
          body: '!merge',
        });
      }
    }
  }, true);
};
