const fs = require('fs');
const shelljs = require('shelljs');
const yaml = require('js-yaml');

const makeBranch = require('./../src/utils/branch/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-multiple-node-versions-wip';
const commitTitle = `Implement CI for multiple node versions

Implements Docker services for running against multiple node versions at once using a build arg.
Curently runs against node 8 and node 10.`;

withEachRepo(async (api, repo) => {
  const repoFolder = `${repoParentFolder}${repo.name}`;

  if (
    (!repo.name.startsWith('fusion-') &&
      !repo.name.startsWith('create-fusion') &&
      repo.name !== 'browser-tests') ||
    ['fusion-release', 'fusion-orchestrate'].includes(repo.name)
  ) {
    console.log(`Skipping repo: ${repo.name}`);
    return;
  }
  console.log(`Processing repo: ${repo.name}`);

  // Create the branch
  await makeBranch(repo, originBranch);

  // Load and update the Dockerfile
  const origDockerfileContent = fs.readFileSync(
    `${repoFolder}/Dockerfile`,
    'utf8'
  );
  const newDockerfileStartContent = `ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE`;

  const baseImagePattern = /FROM.uber\/web-base-image.*/;
  if (!baseImagePattern.test(origDockerfileContent)) {
    throw new Error('Could not find base image pattern in repo', repoFolder);
  }
  const newDockerfileContent = origDockerfileContent.replace(
    baseImagePattern,
    newDockerfileStartContent
  );
  fs.writeFileSync(`${repoFolder}/Dockerfile`, newDockerfileContent, 'utf8');

  // Load docker-compose and add old node version
  let dockerCompose;
  try {
    dockerCompose = yaml.safeLoad(
      fs.readFileSync(`${repoFolder}/docker-compose.yml`, 'utf8')
    );
  } catch (e) {
    console.log(e);
  }

  // Duplicate all services, extend from base service, and update base image.
  Object.keys(dockerCompose.services).forEach(service => {
    const newServiceName = `${service}-node-last`;
    dockerCompose.services[newServiceName] = {
      extends: service,
      build: {
        context: '.',
        args: {
          BASE_IMAGE: 'uber/web-base-image:1.0.9',
        },
      },
    };
  });

  // Write new content
  fs.writeFileSync(
    `${repoFolder}/docker-compose.yml`,
    yaml.dump(dockerCompose),
    'utf8'
  );

  // Parse pipeline yml
  let pipeline;
  try {
    pipeline = yaml.safeLoad(
      fs.readFileSync(`${repoFolder}/.buildkite/pipeline.yml`, 'utf8')
    );
  } catch (e) {
    console.log(e);
  }

  // Duplicate all steps (except wait step) to run on the new pipeline.
  const newSteps = pipeline.steps.reduce((accum, step) => {
    // Push the original step
    accum.push(step);

    // Return if we're processing a wait step.
    if (typeof step === 'string') {
      return accum;
    }

    // Clone step, and rename.
    const newStep = {
      ...JSON.parse(JSON.stringify(step)),
      name: `${step.name} node8`,
      plugins: {},
    };
    Object.keys(step.plugins).forEach(pluginKey => {
      // Easy object cloning to avoid weird &ref props in YAML output.
      newStep.plugins[pluginKey] = JSON.parse(
        JSON.stringify(step.plugins[pluginKey])
      );

      // Do nothing for non docker-compose plugins
      if (!pluginKey.startsWith('docker-compose')) {
        return;
      }

      // Use new service for docker compose plugins
      if (newStep.plugins[pluginKey].build) {
        newStep.plugins[pluginKey].build = `${
          newStep.plugins[pluginKey].build
        }-node-last`;
      }
      if (newStep.plugins[pluginKey].run) {
        newStep.plugins[pluginKey].run = `${
          newStep.plugins[pluginKey].run
        }-node-last`;
      }
    });
    accum.push(newStep);

    return accum;
  }, []);
  pipeline.steps = newSteps;

  // Write pipeline yml
  fs.writeFileSync(
    `${repoFolder}/.buildkite/pipeline.yml`,
    yaml.dump(pipeline),
    'utf8'
  );

  // Commit changes & push
  shelljs.exec(`
    cd ${repoFolder} &&
    git commit -a -m "${commitTitle}" &&
    git push origin -f ${originBranch}
  `);

  // Open pull request
  await makePullRequest(api, repo, {
    title: commitTitle,
    originBranch,
  });

  await pause(200);
});
