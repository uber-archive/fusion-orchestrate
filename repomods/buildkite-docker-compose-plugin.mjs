const fs = require('fs');
const shelljs = require('shelljs');
const yaml = require('js-yaml');

const makeBranch = require('./../src/utils/makeBranch.js');
const makePullRequest = require('./../src/utils/makePullRequest.js');
const pause = require('./../src/utils/pause.js');
const withEachRepo = require('./../src/utils/withEachRepo.js');

const COMPOSE_PLUGIN_VERSION = '1.7.0';

const repoParentFolder = process.cwd() + '/../';
const originBranch = 'orchestrate-docker-compose-plugin-version';
const commitTitle = `Upgrade docker-compose plugin to v${
  COMPOSE_PLUGIN_VERSION
}`;

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

  // Update docker-compose versions in pipeline
  pipeline.steps = pipeline.steps.map(step => {
    const stepsToUpdate = [];
    const newPluginKey = `docker-compose#v${COMPOSE_PLUGIN_VERSION}`;

    for (let pluginName in step.plugins) {
      if (pluginName.startsWith('docker-compose#v')) {
        stepsToUpdate.push(step.plugins[pluginName]);
        delete step.plugins[pluginName];
      }
    }
    stepsToUpdate.forEach(pluginDef => {
      step.plugins[newPluginKey] = pluginDef;
    });
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
