# Contributing to @ftrack/api

Thank you for wanting to contribute to our JavaScript API!

Please clone this repository, and follow these instructions to make sure you are in a clean spot before coding:

Using node version as reflected in `.nvmrc`, run:

- yarn install
- yarn test

If the tests passes, you should be good to go. Please submit a PR with your changes and we will look at them as soon as possible.

## Publishing a release

_This is only relevant for ftrack employees when preparing and publishing a new release._

To publish a new release, follow these steps:

Locally:

- `git switch -c release/<new-release-tag>`
- `npm version <new-release-tag>`
- `git push --follow-tags`

On Github:

- Create a new PR from your branch, and get someone to approve it, then merge.
- [Create a new release](https://github.com/ftrackhq/javascript-api/releases/new), pointing to your tag. Generate new release notes based on commit history and clean it up a bit. Choose whether or not it should be a pre-release (your tag should reflect this by appending a beta tag, e.g. `1.0.0-beta.1`)
- Click publish, and make sure the Github action passes. Then you should see a new release on [NPM](https://www.npmjs.com/package/@ftrack/api).
