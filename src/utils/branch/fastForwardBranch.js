const shelljs = require('shelljs');
const assert = require('assert');

const repoParentFolder = process.cwd() + '/../';

module.exports = function(repo, branchName, verbose) {
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
};
