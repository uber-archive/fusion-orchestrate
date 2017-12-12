const chalk = require('chalk');

const logPR = require('./utils/logPR');
const getOpenReviews = require('./utils/getOpenReviews');

module.exports = async (name, sub, options) => {
  let needsReview = await getOpenReviews();
  let {yours, others} = needsReview.reduce(
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
  if (options.mine) {
    others = [];
  } else if (options.others) {
    yours = [];
  }
  if (others.length) {
    console.log(chalk.bold.underline.red('\nNeeds your review:\n'));
    others.forEach(logPR);
  }
  if (yours.length) {
    console.log(chalk.bold.underline.red('\nNeeds others review\n'));
    yours.forEach(logPR);
  }
  if (!others.length && !yours.length) {
    console.log(chalk.bold.underline.red('\nCould not find any reviews\n'));
  }
};
