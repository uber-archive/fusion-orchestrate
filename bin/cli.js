#!/usr/bin/env node
process.on('unhandledRejection', e => {
  throw e;
});
const args = require('args');
const setup = require('../src/setup');
const mergeAccepted = require('../src/merge-accepted');
const reviews = require('../src/reviews');

args
  .command('setup', 'Fork and clone all the fusionjs repos', setup)
  .command('mergeAccepted', 'Merge all your accepted PRs', mergeAccepted)
  .option('mine', 'Show only your pull requests')
  .option('others', 'Show only others pull requests')
  .command('reviews', 'List all PRs needing review', reviews);

args.parse(process.argv);
