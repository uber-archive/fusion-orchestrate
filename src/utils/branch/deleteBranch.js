const shelljs = require('shelljs');
const assert = require('assert');

const repoParentFolder = process.cwd() + '/../';

const deleteLocalBranch = function(repoFolder, branchName, verbose) {
  // Determine if the branch exists locally
  const branchRef = shelljs.exec(
    `
    cd ${repoFolder} &&
    git rev-parse --verify ${branchName}
  `,
    {silent: !verbose}
  );
  if (branchRef.code !== 0 /*failure*/) {
    assert(branchRef.stderr.startsWith('fatal:'));
    // Branch does not exist, so we are done
    console.log(' - Branch does not exist locally!');
    return;
  }

  // Delete local branch
  const branchDelete = shelljs.exec(
    `
    cd ${repoFolder} &&
    git branch -D ${branchName}`,
    {silent: !verbose}
  );
  assert(
    branchDelete.code === 0,
    ` - Unable to delete local branch: ${branchDelete.stderr}.`
  );
  console.log(' - (local)', branchDelete.stdout.trim().replace(/\n/g, '\\n'));
};

const deleteRemoteBranch = function(repoFolder, branchName, verbose) {
  // Determine if the branch exists remotely
  const branchRefCount = shelljs.exec(
    `
    cd ${repoFolder} &&
    git ls-remote --heads origin ${branchName} | wc -l`,
    {silent: !verbose}
  );
  if (branchRefCount.stdout.trim().startsWith('0') /*failure*/) {
    console.log(' - Branch does not exist remotely!');
    return;
  }

  // Delete remote branch
  const branchDelete = shelljs.exec(
    `
    cd ${repoFolder} &&
    git push origin --delete ${branchName}`,
    {silent: !verbose}
  );
  assert(
    branchDelete.code === 0,
    ` - Unable to delete remote branch: ${branchDelete.stderr}.`
  );
  console.log(' - (remote)', branchDelete.stderr.trim().replace(/\n/g, '\\n'));
};

module.exports = async function(api, repo, branchName, verbose = false) {
  console.log(`Deleting branch ${repo.name}/${branchName}.`);
  const repoFolder = `${repoParentFolder}${repo.name}`;

  // Get current branch and ensure that we're on master.
  const currentBranch = shelljs.exec(
    `
    cd ${repoFolder} &&
    git rev-parse --abbrev-ref HEAD
  `,
    {silent: !verbose}
  );
  const currBranchName = currentBranch.stdout.trim();
  assert(
    currBranchName === 'master',
    `Branch for ${repo.name} should be master, but is ${currBranchName}.`
  );

  // Delete the branch locally, if applicable
  deleteLocalBranch(repoFolder, branchName, verbose);

  // Delete the remote branch, if applicable
  deleteRemoteBranch(repoFolder, branchName, verbose);
};
