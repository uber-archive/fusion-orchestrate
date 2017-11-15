const fs = require('fs');
const shelljs = require('shelljs');

const repoParentFolder = process.cwd() + '/../';

module.exports = async function(api, repo) {
  console.log(`Ensuring local checkout for ${repo.name}.`);
  const repoFolder = repoParentFolder + repo.name;
  if (fs.existsSync(repoFolder)) {
    console.log(' - folder exists');
  } else {
    console.log(' - missing checkout, cloning');
    shelljs.exec(
      `cd ${repoParentFolder} && git clone git@github.com:${
        process.env.GITHUB_USER
      }/${repo.name}.git`
    );
  }
};
