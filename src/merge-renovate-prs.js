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

    // Only merge a single PR at a time due to renovate rebasing all PRs.
    let mergedOnePr = false;

    for (let i = 0; i < pulls.length; i++) {
      const pull = pulls[i];
      if (pull.user.login !== 'renovate[bot]' || mergedOnePr) {
        continue;
      }

      console.log(chalk.bold('Processing - ', pull.title));
      console.log(pull.html_url);

      const {data: status} = await api.repos.getCombinedStatusForRef({
        owner: repo.upstream,
        repo: repo.name,
        ref: pull.head.sha,
      });

      await api.issues.addLabels({
        owner: repo.upstream,
        repo: repo.name,
        number: pull.number,
        labels: ['greenkeeping'],
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

      mergedOnePr = true;
    }

    await pause(200);
  });
};
