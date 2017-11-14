import ensureGithubFork from './utils/ensureGithubFork.mjs';
import ensureLocalCheckout from './utils/ensureLocalCheckout.mjs';
import pause from './utils/pause.mjs';
import resetLocalCheckout from './utils/resetLocalCheckout.mjs';
import withEachRepo from './utils/withEachRepo.mjs';

withEachRepo(async (api, repo) => {
  await ensureGithubFork(api, repo);
  await ensureLocalCheckout(api, repo);
  await resetLocalCheckout(api, repo);
  await pause(200);
});
