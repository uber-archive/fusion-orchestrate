# fusion-orchestrate

[![Build status](https://badge.buildkite.com/d1aeec2079f4e24ac331c9a91a1cdaf681e96b86f9a0897a8c.svg?branch=master)](https://buildkite.com/uberopensource/fusion-orchestrate)

Orchestrates running scripts across all fusion repositories.

## Installation

```
npm install -g fusion-orchestrate
```

## Setup

Requires node 8.9.1 or above.

Generate a Github token at: https://github.com/settings/tokens/new

Update your ~/.bashrc || ~/.zshrc || ~/.fishrc
```bash
export GITHUB_USER=______
export GITHUB_TOKEN=_______
```

# Usage

```
Usage: fusion orchestrate [options] [command]

Commands:

  help           Display help
  mergeAccepted  Merge all your accepted PRs
  reviews        List all PRs needing review
  setup          Fork and clone all the fusionjs repos

Options:

  -h, --help     Output usage information
  -v, --version  Output the version number
```
