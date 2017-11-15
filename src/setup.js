const ensureGithubFork = require('./utils/ensureGithubFork.js');
const ensureLocalCheckout = require('./utils/ensureLocalCheckout.js');
const pause = require('./utils/pause.js');
const resetLocalCheckout = require('./utils/resetLocalCheckout.js');
const withEachRepo = require('./utils/withEachRepo.js');

module.exports = () => {
  withEachRepo(async (api, repo) => {
    await ensureGithubFork(api, repo);
    await ensureLocalCheckout(api, repo);
    await resetLocalCheckout(api, repo);
    await pause(200);
  });
};
