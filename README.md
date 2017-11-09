# fusion-orchestrate

[![Build status](https://badge.buildkite.com/d1aeec2079f4e24ac331c9a91a1cdaf681e96b86f9a0897a8c.svg?branch=master)](https://buildkite.com/uberopensource/fusion-orchestrate)

Orchestrates running scripts across all fusion repositories.

## Scripts

## src/setup.js

Runs setup and cleans local folders.

## Usage

Requires node 9.1 or above.

Generate a Github token at: https://github.com/settings/tokens/new

```
GITHUB_USER=______ GITHUB_TOKEN=_______ node --experimental-modules src/setup.mjs
```
