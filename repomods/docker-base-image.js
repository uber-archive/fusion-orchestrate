const fs = require('fs');
const shelljs = require('shelljs');

const checkoutBranch = require('./../src/utils/branch/checkoutBranch.js');
const fastForwardBranch = require('./../src/utils/branch/fastForwardBranch.js');
const validateBranchWithUpstream = require('./../src/utils/branch/validateBranchWithUpstream');
const deleteBranch = require('./../src/utils/branch/deleteBranch.js');
const makeBranch = require('./../src/utils/branch/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

const BASE_IMAGE = 'FROM uber/web-base-image:1.0.0';

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-docker-base-image';
const commitTitle = `Use web base docker image`;

withEachRepo(async (api, repo) => {
  checkoutBranch(repo, 'master');
  fastForwardBranch(repo, 'master');
  validateBranchWithUpstream(repo, 'master');
  deleteBranch(api, repo, originBranch);
  makeBranch(repo, originBranch);

  const repoFolder = `${repoParentFolder}${repo.name}`;

  // Remove unused XVFB files
  try {
    fs.unlinkSync(`${repoFolder}/.buildkite/xvfb_daemon_run`);
    fs.unlinkSync(`${repoFolder}/.buildkite/xvfb_init`);
  } catch (e) {
    console.log(e);
  }

  // Get Docker content
  let dockerContent = fs.readFileSync(`${repoFolder}/Dockerfile`, 'utf8');

  // Update base image
  dockerContent = dockerContent.replace(/FROM\s+node.*/, BASE_IMAGE);

  // Write pipeline yml
  fs.writeFileSync(`${repoFolder}/Dockerfile`, dockerContent, 'utf8');

  // Commit changes & push
  shelljs.exec(`
    cd ${repoFolder} &&
    git commit -a -m "${commitTitle}" &&
    git push origin ${originBranch}
  `);

  // Open pull request
  await makePullRequest(api, repo, {
    title: commitTitle,
    originBranch,
  });

  await pause(200);
});
