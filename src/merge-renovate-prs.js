const chalk = require('chalk');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

module.exports = () => {
  console.log(chalk.bold.underline.red('\nMerging Renovate Pull Requests:\n'));
  withEachRepo(async (api, repo) => {
    const {data: pulls} = await api.pullRequests.getAll({
      owner: repo.upstream,
      repo: repo.name,
      state: 'open',
    });

    for (let i = 0; i < pulls.length; i++) {
      const pull = pulls[i];
      if (pull.user.login !== 'renovate[bot]') {
        continue;
      }

      console.log(chalk.bold('Processing - ', pull.title));
      console.log(pull.html_url);

      const {data: status} = await api.repos.getCombinedStatusForRef({
        owner: repo.upstream,
        repo: repo.name,
        ref: pull.head.sha,
      });

      if (status.state !== 'success') {
        console.log(chalk.bold('failing tests, skipping'));
        continue;
      }

      await api.pullRequests.createReview({
        owner: repo.upstream,
        repo: repo.name,
        number: pull.number,
        event: 'APPROVE',
      });

      await api.issues.createComment({
        owner: repo.upstream,
        repo: repo.name,
        number: pull.number,
        body: '!merge',
      });
    }

    await pause(200);
  });
};
