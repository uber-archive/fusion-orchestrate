const fs = require('fs');
const shelljs = require('shelljs');
const yaml = require('js-yaml');

const checkoutBranch = require('./../src/utils/branch/checkoutBranch.js');
const fastForwardBranch = require('./../src/utils/branch/fastForwardBranch.js');
const validateBranchWithUpstream = require('./../src/utils/branch/validateBranchWithUpstream');
const deleteBranch = require('./../src/utils/branch/deleteBranch.js');
const makeBranch = require('./../src/utils/branch/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

const BUILDER_QUEUE = 'builders';
const WORKER_QUEUE = 'workers';
const DOCKER_REGISTRY = '027047743804.dkr.ecr.us-east-2.amazonaws.com/uber';

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-buildkite-pipeline-queues';
const commitTitle = `Update pipeline queues`;

withEachRepo(async (api, repo) => {
  checkoutBranch(repo, 'master');
  fastForwardBranch(repo, 'master');
  validateBranchWithUpstream(repo, 'master');
  deleteBranch(api, repo, originBranch);
  makeBranch(repo, originBranch);

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

  // Update details in pipeline
  pipeline.steps = pipeline.steps.map(step => {
    for (let pluginName in step.plugins) {
      if (pluginName.startsWith('docker-compose')) {
        // See if there is a image-repository key
        if (step.plugins[pluginName]['image-repository']) {
          step.plugins[pluginName]['image-repository'] = DOCKER_REGISTRY;

          // If this plugin has an image-registry, but no builder queue, set it to use the builder queue.
          if (!step.agents || !step.agents.queue) {
            step.agents = {queue: BUILDER_QUEUE};
          }
        }
      }
    }

    // Update agents
    if (!step.agents) {
      step.agents = {
        queue: WORKER_QUEUE,
      };
    } else if (step.agents.queue === 'uber-builders') {
      step.agents = {
        queue: BUILDER_QUEUE,
      };
    } else if (step.agents.queue !== BUILDER_QUEUE) {
      throw new Error(`Not sure what to do with ${step.agents.queue} queue`);
    }

    return step;
  });

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
    git push origin ${originBranch}
  `);

  // Open pull request
  await makePullRequest(api, repo, {
    title: commitTitle,
    originBranch,
  });

  await pause(200);
});
