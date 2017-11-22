const api = require('./api');

/* blacklist of repositories to not include */
const blacklist = ['rfcs', 'probot-app-workflow'];

module.exports = async function getRepos() {
  const {data} = await api.repos.getForOrg({
    org: 'fusionjs',
  });
  return data.filter(item => !blacklist.includes(item)).map(item => {
    return {
      upstream: 'fusionjs',
      name: item.name,
    };
  });
};
