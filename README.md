![siroc](https://user-images.githubusercontent.com/904724/101661809-0375af80-3a49-11eb-9c82-0b84306f9fc7.png)


# 🌬️ siroc

[![npm version][npm-version-src]][npm-version-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![alerts][alerts-src]][alerts-href]
[![grade][grade-src]][grade-href]
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->

> `siroc` is a zero-config but extensible framework for developing Node applications and libraries

## Features

- 💯 **Zero-config required**: Intelligent support for your package
  - Supports running and compiling TypeScript and the latest JavaScript syntax
- ⚒️ **Extensible**: Write your own commands and build hooks
- 💪 **Typescript**: Fully typed and self-documenting

**`siroc` is still a work in progress. Feedback is welcome, and changes will be frequent.**

## Quick start

Just install `siroc`.

```bash
# You can install siroc as a development dependency
pnpm i siroc --dev

# ... or install globally
pnpm -g i siroc
```

## Configuration

You can configure `siroc` by creating a `siroc.config.ts`, `siroc.config.js` or `siroc.config.json` file at the same level as your `package.json`.

In a monorepo, any configuration options at the root level are inherited by your workspaces, though of course you can override them.

```js
import { defineSirocConfig } from 'siroc'

export default defineSirocConfig({
  // fully typed options
})
```

## Commands

### `siroc build`

`siroc` knows what to build based on your `package.json`.

By default, `siroc` will build your `src/index.js` or `src/index.ts` file into whatever output file is specified in your package.json's `main` field.

If you have specified additional binaries, `siroc` will look for input files matching their names.

Under the hood, `siroc` uses `rollup` and `esbuild` to build and produce type definitions for your files.

#### Monorepos

If you have enabled yarn workspaces, siroc will build each of your workspaces. You can choose to build only some of these by specifying what to build.

```bash
yarn siroc build @mypackage/cli
```

#### Watch mode

You can build in watch mode, which will rebuild as necessary when source files change:

```
yarn siroc build --watch
```

#### Configuration

At the most basic level, your entrypoints are configured in your `package.json`:

- `bin` (see [npm docs](https://docs.npmjs.com/files/package.json#bin))
- `main`, `module` and `browser` (see [npm docs](https://docs.npmjs.com/files/package.json#main))
- `types` if you want a TS declaration file to be generated for your main/module/browser entrypoints
- `exports` (see [npm docs](https://nodejs.org/api/packages.html#packages_conditional_exports))

There are some conventions in place of configuration that are worth noting:
* the file type is inferred from the file name if possible (e.g. `babel.es.js` will be in 'es' format)
* `main` defaults to CJS, `module` to ES, `browser` to UMD, and `bin` to CJS
* if you have a folder mapped using [subpath patterns](https://nodejs.org/api/packages.html#packages_subpath_patterns) and it matches a folder within your `src` folder, the files within will be copied across and lightly transpiled using [mkdist](https://github.com/unjs/mkdist).

##### Example
```json5
{
  "exports": {
    ".": {
      // This will be compiled in CJS and matched to src/index.ts
      "require": "./dist/index.js",
      // This will be compiled in ES and matched to src/index.ts
      "import": "./dist/index.es.js"
    },
    // src/templates will be lightly transpiled with mkdist and copied to dist/templates
    "./templates/*": "./dist/templates/*",
    // siroc will not touch this
    "./package.json": "./package.json"
  },
  // This will be compiled in CJS and matched to src/index.ts
  "main": "./dist/index.js",
  // This will be compiled in ES and matched to src/index.ts
  "module": "./dist/index.es.js",
  // Types will be generated for src/index.ts
  "types": "./dist/index.d.ts",
  "bin": {
    // This will be compiled in CJS and matched to src/cli/index.ts
    "siroc": "bin/cli.js",
    // This will be compiled in CJS and matched to src/cli/runtime.ts
    "siroc-runner": "bin/runtime.js"
  }
}
```

#### Build hooks

`siroc` makes available three hooks for customising your build, if you need it.

1. `build:extend`
1. `build:extendRollup`
1. `build:done`

### `siroc dev`

If you're working in a monorepo, it can be helpful to have accurate and up-to-date intellisense when importing from other libraries in a monorepo, without having to rebuild every time you make changes.

Running `siroc dev` will replace your package entrypoints with stubs that point to your source files. Your binaries will run your source files directly using `jiti`.

### `siroc run`

You can run arbitrary shell commands or node scripts using the power of [the `jiti` runtime](https://github.com/unjs/jiti).

For example:

```bash
# You can run a node script written in TypeScript
yarn siroc run myfile.ts

# You can run a command in all your workspaces
yarn siroc run ls --workspaces
```

## Contributors

Contributions are very welcome.

1. Clone this repo

   ```bash
   git clone https://github.com/unjs/siroc
   ```

2. Install dependencies and build project

   ```bash
   yarn

   # Stub modules for rapid development
   yarn siroc dev

   # Test (on changes)
   yarn siroc jest
   ```

**Tip:** You can also run `yarn link` within a package directory to test the module locally with another project.

## License

[MIT License](./LICENCE) - Made with 💖


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/siroc?style=flat-square
[npm-version-href]: https://npmjs.com/package/siroc

[npm-downloads-src]: https://img.shields.io/npm/dm/siroc?style=flat-square
[npm-downloads-href]: https://npm.chart.dev/siroc

[github-actions-src]: https://img.shields.io/github/actions/workflow/status/unjs/siroc/ci.yml?branch=main&style=flat-square
[github-actions-href]: https://github.com/unjs/siroc/actions/workflows/ci.yml

[alerts-src]: https://img.shields.io/lgtm/alerts/github/unjs/siroc?style=flat-square
[alerts-href]: https://lgtm.com/projects/g/unjs/siroc

[grade-src]: https://img.shields.io/lgtm/grade/javascript/github/unjs/siroc?style=flat-square
[grade-href]: https://lgtm.com/projects/g/unjs/siroc
