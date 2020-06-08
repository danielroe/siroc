export const publish = `
#!/bin/bash
set -e

if [ ! "$1" ]; then
  echo "Usage $0 [version]"
  exit 1
fi

yarn build

./scripts/workspace-run npm publish -q

git tag -a v$1 -m v$1
git push --tags
`

export const version = `
#!/bin/bash
set -e

yarn lerna version --no-changelog --no-git-tag-version --no-push --force-publish "*"
`
