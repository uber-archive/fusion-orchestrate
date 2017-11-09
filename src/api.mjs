import GitHubApi from 'github';

const github = new GitHubApi({
  //debug: true,
  timeout: 5000,
  host: 'api.github.com',
  protocol: 'https',
  followRedirects: true,
  rejectUnauthorized: false,
});

if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN
  })
}

export default github;
