const chalk = require('chalk');

const logPR = require('./utils/logPR');
const getOpenReviews = require('./utils/getOpenReviews');

module.exports = async () => {
  let needsReview = await getOpenReviews();
  const {yours, others} = needsReview.reduce(
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
  console.log(chalk.bold.underline.red('\nNeeds your review:\n'));
  others.forEach(logPR);
  console.log(chalk.bold.underline.red('\nNeeds others review\n'));
  yours.forEach(logPR);
};
