const GitHubApi = require('@octokit/rest');

const github = new GitHubApi({
  debug: true,
  timeout: 5000,
});

if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });
}

module.exports = github;
