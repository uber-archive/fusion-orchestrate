const chalk = require('chalk');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

module.exports = () => {
  console.log(chalk.bold.underline.green('\nEnforcing repository settings:\n'));
  withEachRepo(async (api, repo) => {
    console.log(chalk.bold(`Updating ${repo.upstream}/${repo.name}`));
    await api.repos.edit({
      owner: repo.upstream,
      repo: repo.name,
      name: repo.name,
      allow_rebase_merge: true,
      has_issues: true,
      has_projects: true,
      has_wiki: true,
      allow_squash_merge: true,
      allow_merge_commit: false,
    });

    console.log('Updating branch protection');
    await api.repos.updateBranchProtection({
      owner: repo.upstream,
      repo: repo.name,
      branch: 'master',
      enforce_admins: false,
      required_status_checks: {
        strict: false,
        contexts: [
          `buildkite/${repo.name.replace(/\./g, '-')}`,
          'probot/release-verification',
        ],
      },
      required_pull_request_reviews: {
        include_admins: true,
      },
      restrictions: null,
    });

    console.log('Updating pull request review enforcement');
    await api.repos.updateProtectedBranchPullRequestReviewEnforcement({
      owner: repo.upstream,
      repo: repo.name,
      branch: 'master',
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false,
    });

    await pause(200);
  });
};
