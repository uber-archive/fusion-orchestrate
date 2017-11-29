const fs = require('fs');
const shelljs = require('shelljs');
const yaml = require('js-yaml');
const assert = require('assert');

const checkoutBranch = require('./../src/utils/branch/checkoutBranch.js');
const fastForwardBranch = require('./../src/utils/branch/fastForwardBranch.js');
const validateBranchWithUpstream = require('./../src/utils/branch/validateBranchWithUpstream');
const deleteBranch = require('./../src/utils/branch/deleteBranch.js');
const makeBranch = require('./../src/utils/branch/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');
const copyFile = require('./../src/utils/copyFile.js');
const getOpenReviews = require('./../src/utils/getOpenReviews.js');

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-buildkite-flow-plugin';
const commitTitle = 'Add Flow step to pipeline.yml';
const username = process.env.GITHUB_USER;

// TODO Web Platform 2017-11-28 - Move this into a separate file
/* Config */
const verbose = false;

/* Helper functions */
// Gets all open pull requests originating from user's fork to fusionjs repo with this commit title.
const getExistingReviews = async repo =>
  (await getOpenReviews()).filter(
    review =>
      review.title === commitTitle &&
      review.user.login.toLowerCase() === username.toLowerCase() &&
      review.head.label.toLowerCase() ===
        `${username}:${originBranch}`.toLowerCase() &&
      review.head.repo.full_name.toLowerCase() ===
        `${username}/${repo.name}`.toLowerCase() &&
      review.base.label.toLowerCase() === 'fusionjs:master' &&
      review.base.repo.full_name.toLowerCase() ===
        `${repo.upstream}/${repo.name}`.toLowerCase()
  );

withEachRepo(async (api, repo) => {
  const repoFolder = `${repoParentFolder}${repo.name}`;
  console.log(`Adding Flow to repo: ${repo.name}.`);

  // Determine if an existing pull request already exists
  const existingReviews = await getExistingReviews(repo);
  if (existingReviews.length > 0) {
    console.warn(
      ` - At least one existing pull request is still open.  Please close all before attempting to make a new one.  Skipping pull request`
    );
    existingReviews.forEach(review => {
      console.log(`   - ${review.url}`);
    });

    console.log('Complete.');
    console.log('========================================');
    return;
  }

  // Checkout master
  checkoutBranch(repo, 'master', verbose);

  // Fast forward master, if necessary
  fastForwardBranch(repo, 'master', verbose);

  // Validate that master matches upstream/master
  validateBranchWithUpstream(repo, 'master', verbose);

  // Delete branch, if exists
  deleteBranch(api, repo, originBranch, verbose);

  // Create the branch
  makeBranch(repo, originBranch, verbose);

  // Parse pipeline yml
  let pipeline;
  try {
    pipeline = yaml.safeLoad(
      fs.readFileSync(`${repoFolder}/.buildkite/pipeline.yml`, 'utf8')
    );
  } catch (e) {
    // TODO Web Platform 2017-11-27 - Gracefully handle this error
    throw e;
  }

  // Get docker-compose version
  const dockerIndex = pipeline.steps.findIndex(item =>
    item.name.includes(':docker:')
  );
  assert(
    dockerIndex !== -1,
    'Buildkite pipeline does not contain a command for docker -- verison unknown for Flow.'
  );
  const dockerComposePluginKeys = Object.keys(
    pipeline.steps[dockerIndex].plugins
  ).filter(name => name.startsWith('docker-compose#v'));
  assert(
    dockerComposePluginKeys.length === 1,
    'Docker compose step should have a single versioned docker-compose plugin.'
  );
  const dockerComposeName = dockerComposePluginKeys[0]; // e.g. 'docker-compose#v1.7.0'

  // Leverage existing :eslint: command for new :flowtype: command
  const eslintIndex = pipeline.steps.findIndex(
    item => item.name === ':eslint:'
  );
  assert(
    eslintIndex !== -1,
    'Buildkite pipeline does not contain a command for eslint to use as a baseline for flow.'
  );
  const eslintStep = pipeline.steps[eslintIndex];

  // Update pipeline.steps to include new Flow step
  console.log('Updating pipeline.yml to include new Flow step');
  const flowIndex = pipeline.steps.findIndex(
    item => item.name === ':flowtype:'
  );
  if (flowIndex === -1) {
    console.log(' - Adding :flowtype: step to pipeline buffer');
    const flowStep = {
      command: 'yarn flow',
      name: ':flowtype:',
      plugins: {}, // fleshed out below
    };
    flowStep.plugins[dockerComposeName] = {};
    for (let key in eslintStep.plugins[dockerComposeName]) {
      flowStep.plugins[dockerComposeName][key] =
        eslintStep.plugins[dockerComposeName][key];
    }
    pipeline.steps.splice(eslintIndex, 0, flowStep);

    // Write pipeline yml
    console.log(' - Writing new pipeline.yml');
    fs.writeFileSync(
      `${repoFolder}/.buildkite/pipeline.yml`,
      yaml.dump(pipeline),
      'utf8'
    );
  } else {
    console.warn(' - :flowtype: already exists in pipeline.yml.');
  }

  // Add flow-bin dependency
  console.log(`Adding 'flow-bin' as a dependency.`);
  shelljs.exec(
    `
    cd ${repoFolder} &&
    yarn add --dev flow-bin --registry https://registry.npmjs.org`,
    {silent: !verbose}
  );

  // Initialize Flow
  console.log('Initializing Flow.');
  const initFlow = shelljs.exec(
    `
    cd ${repoFolder} &&
    yarn run flow init`,
    {silent: !verbose}
  );
  if (initFlow.code === 1) {
    console.warn(
      ` - Flow could not be initialized: ${initFlow.stderr
        .trim()
        .replace(/\n/g, '\\n')}`
    );
  }

  // Add reasonable defaults to .flowconfig
  console.log(`Copying populated .flowconfig to ${repoFolder}/.flowconfig.`);
  await copyFile('./repomods/assets/.flowconfig', `${repoFolder}/.flowconfig`);

  // Commit changes & push
  console.log(`Committing changes and pushing to origin/${originBranch}.`);
  shelljs.exec(
    `
    cd ${repoFolder} &&
    git add . &&
    git commit -m "${commitTitle}" &&
    git push origin ${originBranch}`,
    {silent: !verbose}
  );

  // Open pull request
  console.log(
    `Making pull request to merge into ${repo.upstream}/${repo.name}.`
  );
  //  - Ensure changes between HEAD and upstream/master
  const diffCount = shelljs.exec(
    `
    cd ${repoFolder} &&
    git diff upstream/master HEAD | wc -l`,
    {silent: !verbose}
  );

  if (!diffCount.stdout.trim().startsWith('0')) {
    await makePullRequest(api, repo, {
      title: commitTitle,
      originBranch,
    });
  } else {
    console.warn(
      ' - No diff between HEAD and upstream/master.  Skipping pull request.'
    );
  }

  await pause(200);

  console.log('Complete.');
  console.log('========================================');
});
