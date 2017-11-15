const shelljs = require('shelljs');

const repoParentFolder = process.cwd() + '/../';

module.exports = async function(api, repo) {
  console.log(`Resetting local changes for ${repo.name}.`);
  const repoFolder = `${repoParentFolder}${repo.name}`;

  // Set remotes
  const originRemote = shelljs.exec(`
    cd ${repoFolder} &&
    git remote set-url origin git@github.com:${process.env.GITHUB_USER}/${
    repo.name
  }.git
  `);
  if (originRemote.stderr) {
    console.warn(' - error setting origin remote, resetting it');
    shelljs.exec(`
      cd ${repoFolder} &&
      (git remote rm origin || true) &&
      git remote add origin git@github.com:${process.env.GITHUB_USER}/${
      repo.name
    }.git
    `);
  }

  const upstreamRemote = shelljs.exec(`
    cd ${repoFolder} &&
    git remote set-url upstream git@github.com:${repo.upstream}/${repo.name}.git
  `);
  if (upstreamRemote.stderr) {
    console.warn(' - error setting upstream remote, resetting it');
    shelljs.exec(`
      cd ${repoFolder} &&
      (git remote rm upstream || true) &&
      git remote add upstream git@github.com:${repo.upstream}/${repo.name}.git
    `);
  }

  // Checkout master and pull latest
  shelljs.exec(`
    cd ${repoFolder} &&
    git reset --hard HEAD &&
    git checkout master &&
    git pull upstream master
  `);
};
