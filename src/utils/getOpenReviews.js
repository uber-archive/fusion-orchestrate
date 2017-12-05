const getRepos = require('../repos');
const api = require('../api');

module.exports = async () => {
  const repos = await getRepos();
  const needsReview = await Promise.all(
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
          const acceptedReviews = reviews.filter(
            review => review.state === 'APPROVED'
          );
          if (acceptedReviews.length === 0) {
            return pull;
          } else {
            return null;
          }
        })
      );
    })
  );
  // console.log(
  //   'NEEDSREVIEW',
  //   [needsReview[1]]
  //     .reduce((prev, current) => {
  //       return prev.concat(current);
  //     }, [])
  //     .filter(o => o && o.title && o.title.startsWith('Begin'))[0]
  // );
  return needsReview
    .reduce((prev, current) => {
      return prev.concat(current);
    }, [])
    .filter(Boolean);
};
