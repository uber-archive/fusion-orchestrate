const chalk = require('chalk');

module.exports = function logPR(p) {
  console.log(`${chalk.gray(p.title)} | ${chalk.underline(p.html_url)}`);
};
