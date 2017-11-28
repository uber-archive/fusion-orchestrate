const fs = require('fs');
const shelljs = require('shelljs');
const yaml = require('js-yaml');
const assert = require('assert');

const {
  checkout,
  fastForward,
  make,
} = require('./../src/utils/branchHelpers.js');
const deleteBranchIfExists = require('./../src/utils/deleteBranchIfExists');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');
const copyFile = require('./../src/utils/copyFile.js');

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-buildkite-flow-plugin';
const commitTitle = 'Add Flow step to pipeline.yml';

const verbose = false;

withEachRepo(async (api, repo) => {
  const repoFolder = `${repoParentFolder}${repo.name}`;
  console.log(`Adding Flow to repo: ${repo.name}.`);

  // Checkout master
  checkout(repo, 'master', verbose);

  // Fast forward master, if necessary
  fastForward(repo, 'master', verbose);

  // Delete branch, if exists
  await deleteBranchIfExists(api, repo, originBranch, verbose);

  // Create the branch
  await make(repo, originBranch, verbose);

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
  console.log(`Committing changes and pushing to remote ${originBranch}.`);
  shelljs.exec(
    `
    cd ${repoFolder} &&
    git add . &&
    git commit -m "${commitTitle}" &&
    git push origin ${originBranch}`,
    {silent: !verbose}
  );

  // Open pull request
  console.log('Making pull request.');
  await makePullRequest(api, repo, {
    title: commitTitle,
    originBranch,
  });

  await pause(200);

  console.log('Complete.');
  console.log('========================================');
});
