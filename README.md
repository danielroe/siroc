<h1 align="center">🌬️ siroc</h1>
<p align="center">Zero-config build tooling for Node</p>

<p align="center">
<a href="https://npmjs.com/package/siroc">
    <img alt="" src="https://img.shields.io/npm/v/siroc/latest.svg?style=flat-square">
</a>
<a href="https://npmjs.com/package/siroc">
    <img alt="" src="https://img.shields.io/npm/dt/siroc.svg?style=flat-square">
</a>
<a href="https://lgtm.com/projects/g/nuxt-contrib/siroc">
    <img alt="" src="https://img.shields.io/lgtm/alerts/github/nuxt-contrib/siroc?style=flat-square">
</a>
<a href="https://lgtm.com/projects/g/nuxt-contrib/siroc">
    <img alt="" src="https://img.shields.io/lgtm/grade/javascript/github/nuxt-contrib/siroc?style=flat-square">
</a>
</p>

> `siroc` is a zero-config but extensible framework for developing Node applications and libraries

## Features

- 💯 **Zero-config required**: Intelligent support for your package
  - Supports running and compiling TypeScript and the latest JavaScript syntax
  - Autoconfigured `jest` and `eslint` with optional presets
- ⚒️ **Extensible**: Write your own commands and build hooks
- 💪 **Typescript**: Fully typed and self-documenting

**`siroc` is still a work in progress. Feedback is welcome, and changes will be frequent.**

## Quick start

Just install `siroc`.

```bash
# You can install siroc as a development dependency
yarn add siroc --dev

# ... or install globally
yarn global add siroc
```

## Configuration

You can configure `siroc` by creating a `siroc.config.ts`, `siroc.config.js` or `siroc.config.json` file at the same level as your `package.json`.

In a monorepo, any configuration options at the root level are inherited by your workspaces, though of course you can override them.

### TypeScript

```ts
import type { PackageOptions } from 'siroc'

const config: PackageOptions = {
  // fully typed options
}

export default config
```

### JavaScript

```js
/**
 * @type {import('siroc').PackageOptions} config
 */
const config = {
  // fully typed options
}

export default config
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
- `main` and `module` (see [npm docs](https://docs.npmjs.com/files/package.json#main))

#### Build hooks

`siroc` makes available three hooks for customising your build, if you need it.

1. `build:extend`
1. `build:extendRollup`
1. `build:done`

### `siroc dev`

If you're working in a monorepo, it can be helpful to have accurate and up-to-date intellisense when importing from other libraries in a monorepo, without having to rebuild every time you make changes.

Running `siroc dev` will replace your package entrypoints with stubs that point to your source files. Your binaries will run your source files directly using `jiti`.

### `siroc run`

You can run arbitrary shell commands or node scripts using the power of [the `jiti` runtime](https://github.com/nuxt-contrib/jiti).

For example:

```bash
# You can run a node script written in TypeScript
yarn siroc run myfile.ts

# You can run a command in all your workspaces
yarn siroc run ls --workspaces
```

## Presets

### eslint

Rather than configure `eslint`, you can extend `@siroc/eslint-config`, with zero-config support for TypeScript (and prettier, if you have it installed within your package dev dependencies).

1. Add the eslint config:

   ```bash
   yarn add --dev @siroc/eslint-config
   ```

2. Add the following `.eslintrc.js` to your project:

   ```js
   module.exports = {
     extends: ['@siroc'],
     // Your rules/plugins here
   }
   ```

### jest

Rather than configure `jest`, you can extend `@siroc/jest-preset`, with zero-config support for TypeScript test and source files. By default it will also include any settings from a local `jest.config.js` (e.g. in a package directory).

1. Add the jest preset:

   ```bash
   yarn add --dev @siroc/jest-preset
   ```

2. Add the following `jest.config.js` to your project:

   ```js
   module.exports = {
     preset: '@siroc/jest-preset',
     // Your customisations here
   }
   ```

## Contributors

Contributions are very welcome.

1. Clone this repo

   ```bash
   git clone git@github.com:nuxt-contrib/siroc.git
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
