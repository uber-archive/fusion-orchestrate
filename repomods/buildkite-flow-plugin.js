const fs = require('fs');
const shelljs = require('shelljs');
const yaml = require('js-yaml');
const assert = require('assert');

const makeBranch = require('./../src/utils/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');
const copyFile = require('./../src/utils/copyFile.js');

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-buildkite-flow-plugin';
const commitTitle = 'Add Flow step to pipeline.yml';

withEachRepo(async (api, repo) => {
  // Create the branch
  await makeBranch(api, repo, originBranch);

  // Parse pipeline yml
  const repoFolder = `${repoParentFolder}${repo.name}`;
  let pipeline;
  try {
    pipeline = yaml.safeLoad(
      fs.readFileSync(`${repoFolder}/.buildkite/pipeline.yml`, 'utf8')
    );
  } catch (e) {
    console.log(e);
  }

  // Get docker-compose version
  const dockerIndex = pipeline.steps.findIndex(
    item => item.name === ':docker: :package:'
  );
  assert(
    dockerIndex !== -1,
    'Buildkite pipeline does not contain a command for docker -- verison unknown for Flow'
  );
  const dockerComposePluginKeys = Object.keys(
    pipeline.steps[dockerIndex].plugins
  ).filter(name => name.startsWith('docker-compose#v'));
  assert(
    dockerComposePluginKeys.length === 1,
    'Docker compose step should have a single versioned docker-compose plugin'
  );
  const dockerComposeName = dockerComposePluginKeys[0]; // e.g. 'docker-compose#v1.7.0'

  // Leverage existing :eslint: command for new :flowtype: command
  const eslintIndex = pipeline.steps.findIndex(
    item => item.name === ':eslint:'
  );
  assert(
    eslintIndex !== -1,
    'Buildkite pipeline does not contain a command for eslint to use as a baseline for flow'
  );
  const eslintStep = pipeline.steps[eslintIndex];

  // Update pipeline.steps to include new Flow step
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
  fs.writeFileSync(
    `${repoFolder}/.buildkite/pipeline.yml`,
    yaml.dump(pipeline),
    'utf8'
  );

  // Add flow dependency and initialize it
  shelljs.exec(`
    cd ${repoFolder} &&
    yarn add --dev flow-bin --registry https://registry.npmjs.org &&
    yarn run flow init`);

  // Add reasonable defaults to .flowconfig
  await copyFile('./repomods/assets/.flowconfig', `${repoFolder}/.flowconfig`);

  // Commit changes & push
  shelljs.exec(`
    cd ${repoFolder} &&
    git add . &&
    git commit -m "${commitTitle}" &&
    git push origin ${originBranch}
  `);

  // Open pull request
  await makePullRequest(api, repo, {
    title: commitTitle,
    originBranch,
  });

  await pause(200);
});
