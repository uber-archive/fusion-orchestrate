const getRepos = require('./repos');
const api = require('./api');
module.exports = async () => {
  const repos = await getRepos();
  let needsReview = await Promise.all(
    repos.map(async repo => {
      const {data: pulls} = await api.pullRequests.getAll({
        owner: repo.upstream,
        repo: repo.name,
        state: 'open',
      });
      return Promise.all(
        pulls.map(async pull => {
          const {data: reviews} = await api.pullRequests.getReviews({
            owner: repo.upstream,
            repo: repo.name,
            number: pull.number,
          });
          if (reviews.length === 0) {
            return pull;
          } else {
            return null;
          }
        })
      );
    })
  );
  const {yours, others} = needsReview
    .reduce((prev, current) => {
      return prev.concat(current);
    }, [])
    .filter(Boolean)
    .reduce(
      (byType, current) => {
        if (current.user.login === process.env.GITHUB_USER) {
          byType.yours.push(current);
        } else {
          byType.others.push(current);
        }
        return byType;
      },
      {yours: [], others: []}
    );
  console.log('\nNeeds your review:\n');
  others.forEach(logPR);
  console.log('\nNeeds others review\n');
  yours.forEach(logPR);
};

function logPR(p) {
  console.log(p.title);
  console.log(p.html_url);
}
