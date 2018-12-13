const api = require('./api');

/* blacklist of repositories to not include */
const blacklist = [
  // Blacklisted because of no tests, or code.
  'rfcs',
  // Deprecated modules
  'fusion-plugin-csrf-protection-react',
  // Blacklisted due to package deprecation
  'fusion-react-async',
  // Docs site, may want to unblacklist.
  'fusionjs.github.io',
];

const getForOrg = async org => {
  let pageNum = 1;
  let results = [];
  let isEmpty = false;
  while (!isEmpty) {
    const {data} = await api.repos.getForOrg({
      org: org,
      page: pageNum,
    });
    results.push(data);

    pageNum++;
    isEmpty = data.length === 0;
  }

  const data = [].concat.apply([], results);
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
