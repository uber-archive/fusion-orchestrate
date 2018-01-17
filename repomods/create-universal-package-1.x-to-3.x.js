const fs = require('fs');
const path = require('path');
const glob = require('glob');
const shelljs = require('shelljs');

const checkoutBranch = require('./../src/utils/branch/checkoutBranch.js');
const fastForwardBranch = require('./../src/utils/branch/fastForwardBranch.js');
const validateBranchWithUpstream = require('./../src/utils/branch/validateBranchWithUpstream');
const deleteBranch = require('./../src/utils/branch/deleteBranch.js');
const makeBranch = require('./../src/utils/branch/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-cup-upgrade-3.x';
const commitTitle = `Upgrade create-universal-package@^3.2.x`;

const wrapGlob = (pattern, options) => {
  return new Promise(resolve => {
    glob(pattern, options, function(er, files) {
      resolve(files);
    });
  });
};

withEachRepo(async (api, repo) => {
  checkoutBranch(repo, 'master');
  fastForwardBranch(repo, 'master');
  validateBranchWithUpstream(repo, 'master');
  deleteBranch(api, repo, originBranch);
  makeBranch(repo, originBranch);

  const repoFolder = `${repoParentFolder}${repo.name}`;

  // Get version of create-universal-package
  let packageContent;
  try {
    // eslint-disable-next-line import/no-dynamic-require
    packageContent = require(`${repoFolder}/package.json`);
  } catch (e) {
    console.log('Could not load package.json, skipping');
    return;
  }
  if (!packageContent.devDependencies) {
    console.log('No dev dependencies, skipping');
    return;
  }

  const semvar = packageContent.devDependencies['create-universal-package'];
  if (!semvar || semvar.startsWith('3') || semvar.startsWith('^3')) {
    console.log('Already using version 3, skipping');
    return;
  }

  // Move tests and update import paths
  const moveFile = (oldPath, type) => {
    const baseName = path.basename(oldPath);
    const newPath = path.resolve(
      repoFolder,
      path.dirname(oldPath),
      '..',
      baseName.replace(/js$/, `${type}.js`)
    );
    console.log(`- moving file from ${oldPath} to ${newPath}`);
    shelljs.exec(`
      cd ${repoFolder} &&
      mv ${oldPath} ${newPath}
    `);

    shelljs.exec(`
      ./node_modules/.bin/jscodeshift \
      -t node_modules/refactoring-codemods//lib/transformers/import-relative-transform.js \
      ${newPath} \
      --prevFilePath=${path.resolve(repoFolder, oldPath)} \
      --nextFilePath=${newPath}
    `);
  };
  const nodeFiles = await wrapGlob('src/**__tests__/__node__/**/*.*', {
    cwd: repoFolder,
  });
  for (let i = 0; i < nodeFiles.length; i++) {
    await moveFile(nodeFiles[i], 'node');
  }

  const browserFiles = await wrapGlob('src/**__tests__/__browser__/**/*.*', {
    cwd: repoFolder,
  });
  for (let i = 0; i < browserFiles.length; i++) {
    await moveFile(browserFiles[i], 'browser');
  }

  // Upgrade package.json fields
  if (!packageContent.files.includes('src')) {
    packageContent.files.push('src');
  }
  packageContent.main = './dist/index.js';
  packageContent.module = './dist/index.es.js';
  packageContent.browser = {
    './dist/index.js': './dist/browser.es5.js',
    './dist/index.es.js': './dist/browser.es5.es.js',
  };
  packageContent.es2015 = {
    './dist/browser.es5.es.js': './dist/browser.es2015.es.js',
  };
  packageContent.es2017 = {
    './dist/browser.es5.es.js': './dist/browser.es2017.es.js',
    './dist/browser.es2015.es.js': './dist/browser.es2017.es.js',
  };
  fs.writeFileSync(
    `${repoFolder}/package.json`,
    `${JSON.stringify(packageContent, null, '  ')}\n`,
    'utf8'
  );

  // Upgrade devDependencies
  shelljs.exec(`
    cd ${repoFolder} &&
    yarn add --dev create-universal-package@^3.2.4
  `);

  // Commit changes & push
  shelljs.exec(`
    cd ${repoFolder} &&
    git add . &&
    git commit -a -m "${commitTitle}" &&
    git push origin ${originBranch} -f
  `);

  // Open pull request
  await makePullRequest(api, repo, {
    title: commitTitle,
    originBranch,
  });

  await pause(200);
});
