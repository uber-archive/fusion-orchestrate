const api = require('./../api');
const getRepos = require('./../repos');

module.exports = async function(eachCallback, parallel = false) {
  const repos = await getRepos();
  for (let i = 0; i < repos.length; i++) {
    const result = eachCallback(api, repos[i]);
    if (!parallel) {
      await result;
    }
  }
};
