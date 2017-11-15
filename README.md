# fusion-orchestrate

[![Build status](https://badge.buildkite.com/d1aeec2079f4e24ac331c9a91a1cdaf681e96b86f9a0897a8c.svg?branch=master)](https://buildkite.com/uberopensource/fusion-orchestrate)

Orchestrates running scripts across all fusion repositories.

## Scripts

### src/setup.js

`node src/setup.js`

Runs setup and cleans local folders.


## Usage

Requires node 8.9.1 or above.

Generate a Github token at: https://github.com/settings/tokens/new

Update your ~/.bashrc || ~/.zshrc || ~/.fishrc
```bash
export GITHUB_USER=______
export GITHUB_TOKEN=_______

# NOTE replace the following aliases with whatever shortcuts you want
alias forkall="node --experimental-modules ~/path/to/fusion-orchestrate/src/setup.mjs"
alias myprs="node --experimental-modules ~/path/to/fusion-orchestrate/src/my-prs.mjs"
alias reviews="node --experimental-modules ~/path/to/fusion-orchestrate/src/reviews.mjs"
alias mergeaccepted="node --experimental-modules ~/path/to/fusion-orchestrate/src/merge-accepted.mjs"
```
