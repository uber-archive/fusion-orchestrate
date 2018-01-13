const api = require('./api');

/* blacklist of repositories to not include */
const blacklist = ['rfcs'];

const getForOrg = async org => {
  const {data} = await api.repos.getForOrg({
    org: org,
  });
  return data.filter(item => !blacklist.includes(item.name)).map(item => {
    return {
      upstream: org,
      name: item.name,
    };
  });
};

module.exports = async function getRepos() {
  return [
    ...(await getForOrg('fusionjs')),
    ...(await getForOrg('uber-workflow')),
  ];
};
