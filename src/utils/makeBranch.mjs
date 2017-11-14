import shelljs from 'shelljs';

const repoParentFolder = process.cwd() + '/../';

export default async function(api, repo, branchName) {
  console.log(`Making branch ${repo.name}/${branchName}.`);
  const repoFolder = `${repoParentFolder}${repo.name}`;

  // Get current branch and ensure that we're on master.
  const currentBranch = shelljs.exec(`
    cd ${repoFolder} &&
    git rev-parse --abbrev-ref HEAD
  `);
  const currBranchName = currentBranch.stdout.trim();
  console.log(' - branch name is: ', currBranchName);
  if (currBranchName !== 'master') {
    throw new Error(`Branch for ${repo.name} is not master. Run setup.mjs.`);
  }

  // Create branch
  const branchCreate = shelljs.exec(`
    cd ${repoFolder} &&
    git checkout -b ${branchName}
  `);
  if (branchCreate.stderr) {
    console.warn(' - error creating branch', branchCreate.stderr);
  }
}
