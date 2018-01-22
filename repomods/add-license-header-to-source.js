const fs = require('fs');
const assert = require('assert');
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
const originBranch = 'orchestrate-add-license-header-to-source';

const commitTitle = 'Add short MIT license header to all source files';
const licenseText = `/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

`;
const longLicenseText = `// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

`;

const getAllFilePaths = root => {
  // Base case: root points to a file
  const status = fs.lstatSync(root);
  if (status.isFile()) {
    return [root];
  }

  // Otherwise, it's a directory
  assert(status.isDirectory()); // or invalid
  let paths = [];
  const files = fs.readdirSync(`${root}/`, {encoding: 'utf8'});
  for (let i = 0; i < files.length; i++) {
    paths = paths.concat(getAllFilePaths(`${root}/${files[i]}`));
  }
  return paths;
};

withEachRepo(async (api, repo) => {
  console.log(`Adding MIT license header to repo: ${repo.name}.`);

  checkoutBranch(repo, 'master');
  fastForwardBranch(repo, 'master');
  validateBranchWithUpstream(repo, 'master');
  deleteBranch(api, repo, originBranch);
  makeBranch(repo, originBranch);

  const repoFolder = `${repoParentFolder}${repo.name}`;
  let filePaths = [];
  try {
    filePaths = getAllFilePaths(repoFolder + '/src');
  } catch (e) {
    console.log('Skipping repo: ', repo.name);
    console.log('========================================');
    return;
  }

  // Prepend the license header to the top of each eligible file
  console.log('Adding license header to source files.');
  let hasShortHeaderForAllFiles = true; // all files already have short header
  filePaths.filter(p => p.endsWith('.js')).forEach(p => {
    let body = fs.readFileSync(p, {encoding: 'utf8'});
    if (body.startsWith(licenseText)) {
      return; // header already exists
    } else {
      hasShortHeaderForAllFiles = false;
    }

    // Edge case: if the long form header exists, remove it
    if (body.startsWith(longLicenseText)) {
      body = body.slice(longLicenseText.length, body.length);
    }

    fs.writeFileSync(p, `${licenseText}${body}`, {encoding: 'utf8'});
  });

  if (hasShortHeaderForAllFiles) {
    console.log(` - All source files already have license header`);
    console.log('Complete.');
    console.log('========================================');
    return;
  }

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

  console.log('Complete.');
  console.log('========================================');
});
