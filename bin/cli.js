#!/usr/bin/env node
const args = require('args');
const setup = require('../src/setup');
const mergeAccepted = require('../src/merge-accepted');
const reviews = require('../src/reviews');

args
  .command('setup', 'Fork and clone all the fusionjs repos', setup)
  .command('mergeAccepted', 'Merge all your accepted PRs', mergeAccepted)
  .command('reviews', 'List all PRs needing review', reviews);

const flags = args.parse(process.argv);
console.log('flags', flags);
