const withEachRepo = require('./utils/withEachRepo.js');

module.exports = () => {
  withEachRepo(async (api, repo) => {
    console.log(`${repo.upstream}/${repo.name}`);
  });
};
