const shelljs = require('shelljs');
const assert = require('assert');

const repoParentFolder = process.cwd() + '/../';

module.exports = function(repo, branchName, verbose) {
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
};
