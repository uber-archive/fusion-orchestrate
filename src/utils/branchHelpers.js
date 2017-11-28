const shelljs = require('shelljs');
const assert = require('assert');

const repoParentFolder = process.cwd() + '/../';

module.exports = {
  // Checkout branch
  checkout: function(repo, branchName, verbose) {
    console.log(`Checking out ${repo.name}/${branchName}.`);
    const repoFolder = `${repoParentFolder}${repo.name}`;

    const checkout = shelljs.exec(
      `
      cd ${repoFolder} &&
      git co ${branchName}
    `,
      {silent: !verbose}
    );
    assert(
      checkout.code === 0,
      ` - Unable to checkout ${repo.name}/${branchName}: ${checkout.stderr}.`
    );
  },

  // Fast forward to upstream head
  fastForward: function(repo, branchName, verbose) {
    console.log(`Pulling changes from remote ${repo.name}/${branchName}.`);
    const repoFolder = `${repoParentFolder}${repo.name}`;

    const statusShort = shelljs.exec(`cd ${repoFolder} && git status -s`, {
      silent: !verbose,
    });
    assert(
      !statusShort.stdout,
      'Branch has un-committed changes and is not clean.'
    );
    const fetchAndStatus = shelljs.exec(
      `cd ${repoFolder} && git fetch --tags && git status`,
      {
        silent: !verbose,
      }
    );
    assert(
      !fetchAndStatus.stdout.includes('have diverged'),
      'Local and origin branches have diverged.  Please manually handle this merge.'
    );
    const pull = shelljs.exec(
      `cd ${repoFolder} && git merge --ff-only origin/${branchName}`,
      {
        silent: !verbose,
      }
    );
    assert(pull.code === 0, ` - ${pull.stderr}`);
  },

  make: function(repo, branchName, verbose = true) {
    console.log(`Making branch ${repo.name}/${branchName}.`);
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
    console.log(' - Current branch name is:', currBranchName);
    assert(
      currBranchName === 'master',
      `Branch for ${repo.name} is not 'master'. Run setup.js.`
    );

    // Create branch
    const branchCreate = shelljs.exec(
      `
        cd ${repoFolder} &&
        git checkout -b ${branchName}
      `,
      {silent: !verbose}
    );
    assert(
      branchCreate.code === 0,
      ` - unable to create branch: ${branchCreate.stderr}`
    );
    console.log(' -', branchCreate.stderr.trim());
  },
};
