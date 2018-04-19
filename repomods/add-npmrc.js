const shelljs = require('shelljs');

const checkoutBranch = require('./../src/utils/branch/checkoutBranch.js');
const fastForwardBranch = require('./../src/utils/branch/fastForwardBranch.js');
const validateBranchWithUpstream = require('./../src/utils/branch/validateBranchWithUpstream');
const deleteBranch = require('./../src/utils/branch/deleteBranch.js');
const makeBranch = require('./../src/utils/branch/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-npmrc';
const commitTitle = `Add .npmrc`;

withEachRepo(async (api, repo) => {
  checkoutBranch(repo, 'master');
  fastForwardBranch(repo, 'master');
  validateBranchWithUpstream(repo, 'master');
  deleteBranch(api, repo, originBranch);
  makeBranch(repo, originBranch);

  const repoFolder = `${repoParentFolder}${repo.name}`;

  // Commit changes & push
  try {
    shelljs.exec(`
    cd ${repoFolder} &&
    echo "registry=https://registry.yarnpkg.com" >> .npmrc &&
    git add -f .npmrc &&
    git commit -m "${commitTitle}" &&
    git push origin ${originBranch}
  `);

    // Open pull request
    await makePullRequest(api, repo, {
      title: commitTitle,
      originBranch,
    });
  } catch (e) {
    console.log('Error, skipping.', e);
  }

  await pause(200);
});
