import ensureGithubFork from './utils/ensureGithubFork.mjs';
import ensureLocalCheckout from './utils/ensureLocalCheckout.mjs';
import pause from './utils/pause.mjs';
import resetLocalCheckout from './utils/resetLocalCheckout.mjs';

import api from './api';
import repos from './repos';

(async () => {
  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    await ensureGithubFork(api, repo);
    await ensureLocalCheckout(api, repo);
    await resetLocalCheckout(api, repo);
    await pause(200);
  }
})();
