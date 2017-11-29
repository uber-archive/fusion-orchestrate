const shelljs = require('shelljs');
const assert = require('assert');

const repoParentFolder = process.cwd() + '/../';

module.exports = function(repo, branchName, verbose) {
  console.log(`Validating ${branchName} against upstream/${branchName}.`);
  const repoFolder = `${repoParentFolder}${repo.name}`;

  const diffCount = shelljs.exec(
    `
    cd ${repoFolder} &&
    git diff HEAD upstream/${branchName} | wc -l`,
    {silent: !verbose}
  );
  assert(
    diffCount.stdout.trim().startsWith('0'),
    `Current HEAD differs from upstream/${branchName}.`
  );
};
