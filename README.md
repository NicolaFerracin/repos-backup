# GitHub backup

In order to backup all GitHub repos, I created this script that downloads them all. Some features:
- allows to specify a list of repos to ignore
- automatically deletes any node_modules that have not been git-ignored

## Run

In order to run the script:
- `npm i`
- create `.env` file
- add your GitHub access token key, under `GITHUB_ACCESS_TOKEN`
- optionally add `DOWNLOAD_FOLDER` or let it default to `./repos`
- optionally define a list under `IGNORED_REPOS` of all the repos to ignore, comma separated  (i.e. `repo1,repo2`)
- run with `node ./index`
