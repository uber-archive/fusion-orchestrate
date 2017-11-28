const shelljs = require('shelljs');
const assert = require('assert');

const repoParentFolder = process.cwd() + '/../';

module.exports = function(repo, branchName, verbose = true) {
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
};
