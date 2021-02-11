### [0.6.5](https://github.com/nuxt-contrib/siroc/compare/v0.6.4...v0.6.5) (2021-02-11)


### Features

* allow custom sources for package types ([ebc5a02](https://github.com/nuxt-contrib/siroc/commit/ebc5a02f14ab962666ae2d3e784f188c01677331))

### [0.6.4](https://github.com/nuxt-contrib/siroc/compare/v0.6.3...v0.6.4) (2021-02-11)


### Bug Fixes

* fix build failures in windows environments caused by paths ([f5f01c1](https://github.com/nuxt-contrib/siroc/commit/f5f01c12a847373f90b3817f450e2a43847a5d36))

### [0.6.3](https://github.com/nuxt-contrib/siroc/compare/v0.6.2...v0.6.3) (2021-01-20)


### Bug Fixes

* invert json matching requirement ([6767c0f](https://github.com/nuxt-contrib/siroc/commit/6767c0f2cd3c6d1fdaa0e07461f810e46a73c5c1))

### [0.6.2](https://github.com/nuxt-contrib/siroc/compare/v0.6.1...v0.6.2) (2021-01-16)


### Bug Fixes

* support matching entrypoints in subdirectories ([60c9920](https://github.com/nuxt-contrib/siroc/commit/60c99203e812b6bc0df3b270e3d21dc9acc36404))

### [0.6.1](https://github.com/nuxt-contrib/siroc/compare/v0.6.0...v0.6.1) (2021-01-16)

## [0.6.0](https://github.com/nuxt-contrib/siroc/compare/v0.5.0...v0.6.0) (2020-12-06)


### Features

* add ability to build custom entrypoint ([17714c7](https://github.com/nuxt-contrib/siroc/commit/17714c7b8a1015d5119c0e421a191f7ef6d262e2)), closes [#84](https://github.com/nuxt-contrib/siroc/issues/84)


### Bug Fixes

* exit code 1 with bulid errors ([95f5f2e](https://github.com/nuxt-contrib/siroc/commit/95f5f2e2c05d712d41c25e76cd80902d596b581f)), closes [#196](https://github.com/nuxt-contrib/siroc/issues/196)
* use module format with `mjs` extension ([0159b26](https://github.com/nuxt-contrib/siroc/commit/0159b264027ab21be9d136ebc6ca19fa7379f55e)), closes [#201](https://github.com/nuxt-contrib/siroc/issues/201)

## [0.5.0](https://github.com/nuxt-contrib/siroc/compare/v0.4.3...v0.5.0) (2020-11-29)


### ⚠ BREAKING CHANGES

* upgrade deps to typescript 4.1

### Features

* add optional logging of entry -> output ([ee95d8d](https://github.com/nuxt-contrib/siroc/commit/ee95d8d229fafb9c1aa79c9e980ddfdee726a35d)), closes [#192](https://github.com/nuxt-contrib/siroc/issues/192)


### Miscellaneous Chores

* upgrade deps to typescript 4.1 ([be6f6c9](https://github.com/nuxt-contrib/siroc/commit/be6f6c99c572fd71a49efc174e844e7abef14787))

### [0.4.3](https://github.com/nuxt-contrib/siroc/compare/v0.4.2...v0.4.3) (2020-11-24)


### Bug Fixes

* don't use `.flat()` (to support node 10) ([c816faa](https://github.com/nuxt-contrib/siroc/commit/c816faab0e3a504f555a5e94ee21759fce4c583d))

### [0.4.2](https://github.com/nuxt-contrib/siroc/compare/v0.4.1...v0.4.2) (2020-11-23)


### Bug Fixes

* don't build exports if also in main/browser/module ([72f1b35](https://github.com/nuxt-contrib/siroc/commit/72f1b3554947b7ef15a9816c2f11eabf7fd2e9d2)), closes [#195](https://github.com/nuxt-contrib/siroc/issues/195)
* don't swallow errors in hooks - fix cleaning build directory ([43cc5fa](https://github.com/nuxt-contrib/siroc/commit/43cc5fa39f758c8b376718fe17c50dbdf7e9b57f)), closes [#194](https://github.com/nuxt-contrib/siroc/issues/194)

### [0.4.1](https://github.com/nuxt-contrib/siroc/compare/v0.4.0...v0.4.1) (2020-11-17)


### Bug Fixes

* exclude json files from type generation ([6781286](https://github.com/nuxt-contrib/siroc/commit/67812862db855ee6daa778193c8ee5a534493976)), closes [#193](https://github.com/nuxt-contrib/siroc/issues/193)

## [0.4.0](https://github.com/nuxt-contrib/siroc/compare/v0.3.3...v0.4.0) (2020-10-11)


### Features

* add support for multiple entrypoints using `exports` ([4bc4d1d](https://github.com/nuxt-contrib/siroc/commit/4bc4d1dbc8b181afac0fa9767ee03fa60593d4fa)), closes [#71](https://github.com/nuxt-contrib/siroc/issues/71)

### [0.3.3](https://github.com/nuxt-contrib/siroc/compare/v0.3.2...v0.3.3) (2020-09-30)


### Bug Fixes

* export default package options ([78e4757](https://github.com/nuxt-contrib/siroc/commit/78e4757c8a710c1c4d84af0fcb73f707c4ef2975))

### [0.3.2](https://github.com/nuxt-contrib/siroc/compare/v0.3.1...v0.3.2) (2020-09-30)


### Features

* allow specifying esbuild plugin options directly ([0125825](https://github.com/nuxt-contrib/siroc/commit/0125825d820a386cf3de08db322427d857d5eba5))

### [0.3.1](https://github.com/nuxt-contrib/siroc/compare/v0.3.0...v0.3.1) (2020-08-29)


### Features

* :children_crossing: improve siroc config experience ([3ea1e3f](https://github.com/nuxt-contrib/siroc/commit/3ea1e3f8b7968071a05571e7561b92bd2f5cf7d5))


### Bug Fixes

* 🔇 set exports to `auto` mode ([716e858](https://github.com/nuxt-contrib/siroc/commit/716e8589266a6a462885e022d36666a3cb1600c3)), closes [#85](https://github.com/nuxt-contrib/siroc/issues/85)

## [0.3.0](https://github.com/nuxt-contrib/siroc/compare/v0.2.0...v0.3.0) (2020-07-27)


### ⚠ BREAKING CHANGES

* `changelog` is no longer a valid command and `@siroc/jest-preset` and `@siroc/eslint-config`  must be installed separately

* `@siroc/core` and `@siroc/cli` are no longer separate packages but must be accessed through `siroc`

### Code Refactoring

* merge `siroc`, `@siroc/core` and `@siroc/cli` into single package ([0bcbbe9](https://github.com/nuxt-contrib/siroc/commit/0bcbbe9861199358981585ab7fc5ce71c079e13e))

* remove `changelog` command and rethink presets ([9fd5e8a](https://github.com/nuxt-contrib/siroc/commit/9fd5e8a05a29ff2f4111b4db3c3b5e0c18b32031))

## [0.2.0](https://github.com/nuxt-contrib/siroc/compare/v0.1.2...v0.2.0) (2020-07-26)


### Features

* **core:** print filesizes on build ([63e2c2c](https://github.com/nuxt-contrib/siroc/commit/63e2c2c3742bdae63703f2bd5aa1073d6d6752f2))


### Bug Fixes

* **core:** treat optionalDeps as external ([fee3ff7](https://github.com/nuxt-contrib/siroc/commit/fee3ff7c1ca064e41660141b8bc19e0104a24487))
* pin `rollup-plugin-esbuild` ([f109a90](https://github.com/nuxt-contrib/siroc/commit/f109a90cd920b04ceaa78f699680ab241188069d))

### [0.1.2](https://github.com/nuxt-contrib/siroc/compare/v0.1.1...v0.1.2) (2020-06-27)


### Bug Fixes

* **eslint-config:** depend on `[@typescript-eslint](https://github.com/typescript-eslint)` ([52c4d29](https://github.com/nuxt-contrib/siroc/commit/52c4d291a6a0e35e7d7ad51e4def929539ca7cab))

### [0.1.1](https://github.com/nuxt-contrib/siroc/compare/v0.1.0...v0.1.1) (2020-06-27)


### Features

* **eslint-config:** make prettier support optional ([57938f1](https://github.com/nuxt-contrib/siroc/commit/57938f10b0677da1c8a55a853de6bdb8186f268d))


### Bug Fixes

* treat peerDeps as external ([692a791](https://github.com/nuxt-contrib/siroc/commit/692a791b52e015b2045a81cdca7133222a905d51))


### Reverts

* Revert "chore: upgrade deps" ([4bbafb9](https://github.com/nuxt-contrib/siroc/commit/4bbafb9ec3a52c8781eb4cc10002eedf9b4a624f))

## [0.1.0](https://github.com/nuxt-contrib/siroc/compare/v0.0.2...v0.1.0) (2020-06-16)


### Features

* **cli:** allow custom commands ([8a2a232](https://github.com/nuxt-contrib/siroc/commit/8a2a232434ba15e8b04f8800e337546abbfd093a))
* **cli:** default to running commands in parallel ([43ea6c8](https://github.com/nuxt-contrib/siroc/commit/43ea6c8e9ff1d6e73db30def9eaa8a45d3b7a6b9))
* **cli, eslint-config:** add support for eslint command ([7cdc0b1](https://github.com/nuxt-contrib/siroc/commit/7cdc0b17608f8a8ec8c58ce3dd483838e47ca132))
* **cli, jest-preset:** add jest config ([2fea3be](https://github.com/nuxt-contrib/siroc/commit/2fea3bec244d32ee0588cba014acff598f81167d))
* **core:** look in parent directories for package config ([ad77639](https://github.com/nuxt-contrib/siroc/commit/ad77639b86d27c5da9cb2ed89e11993f087078f2))
* **core, cli:** add support for dev stubbing ([fa77a7b](https://github.com/nuxt-contrib/siroc/commit/fa77a7bf23525f4e826f65c4946f55d6f0a04e23))
* **jest-preset:** add basic jest preset ([68f93c5](https://github.com/nuxt-contrib/siroc/commit/68f93c56ca54492c55e11f3ca367117828b542d3))
* **jest-preset:** allow extending jest ([e20c294](https://github.com/nuxt-contrib/siroc/commit/e20c294f50a83bb756b74ad6ebe5a7ea322351a1))
* add support for json config ([901609f](https://github.com/nuxt-contrib/siroc/commit/901609f9e737a8ca7c0696445f332ef766e4bb93))
* allow typescript siroc config ([79976d1](https://github.com/nuxt-contrib/siroc/commit/79976d178b0d5172cf57699ad69fea3cd49e543c))


### Bug Fixes

* **cli:** allow tests to pass with no tests ([1383ed1](https://github.com/nuxt-contrib/siroc/commit/1383ed167ba56f4463ec223c7f4daa7400ab614a))
* **jest-preset:** support js transform ([e2b0c6a](https://github.com/nuxt-contrib/siroc/commit/e2b0c6a6bd1d440cecaac8ddda3d3b400c9240c2))
* add `Object.entries` polyfill for node 10 ([5566a16](https://github.com/nuxt-contrib/siroc/commit/5566a16dbc8605401a0fad583d05b8746a6559ba))
* add `Object.fromEntries` polyfill for node 10 ([0c9d8e6](https://github.com/nuxt-contrib/siroc/commit/0c9d8e64daf3786dc24fe62528a399eb32d9124a))
* ix `allSettled` polyfill for node 10 ([e91e8c8](https://github.com/nuxt-contrib/siroc/commit/e91e8c84bac3fc892fcba1836533af34ea235a5e))
* remove circular dependency ([9053c27](https://github.com/nuxt-contrib/siroc/commit/9053c278de04384b331fc89be9f2fd5bd8cf4f60))
* remove nuxt known authors ([23c0019](https://github.com/nuxt-contrib/siroc/commit/23c0019d566014e72d8beb5d2f058d77a9710025))
* **core:** only create stubs for buildable packages ([32ca50d](https://github.com/nuxt-contrib/siroc/commit/32ca50de9a9b609602354e58e89784b9a20533d0))
* revert allSettled polyfill temporarily ([3d136f2](https://github.com/nuxt-contrib/siroc/commit/3d136f26f92ca5097e7e1e8ecbd90d3a753f4a77))
* use relative path for module stubs ([610c7d0](https://github.com/nuxt-contrib/siroc/commit/610c7d0ac056f3569a70ad8dcd77da3c71da3d71))


### Performance Improvements

* **core:** reduce code execution in build ([be34f6c](https://github.com/nuxt-contrib/siroc/commit/be34f6c5f3e5f9dfe8b213f20f2426ab2d2a360b))
* use `v8-compile-cache` for cli ([e601f30](https://github.com/nuxt-contrib/siroc/commit/e601f30275f4d78c2fdea1609c6e0cf1161d3e7b))

### [0.0.2](https://github.com/nuxt-contrib/siroc/compare/v0.0.2...v0.1.0) (2020-06-09)


### Features

* add --dev mode for building ([a7554b2](https://github.com/nuxt-contrib/siroc/commit/a7554b23e5f3d6c8f4cc6a76c337c57aeafd883a))
* add `jiti` runtime support ([dc245ba](https://github.com/nuxt-contrib/siroc/commit/dc245ba119bf3894713ff62f4d62fc96b0b30ff2))
* add node timing ([57ab8e5](https://github.com/nuxt-contrib/siroc/commit/57ab8e5b2038d64a87dc98cf55fe0496a99dd6f2))
* add support for running files in all workspaces ([47d7265](https://github.com/nuxt-contrib/siroc/commit/47d72652671328e9f9a6138b2d56e0d2fc365d9d))
* build speed improvement and dx ([e036a9f](https://github.com/nuxt-contrib/siroc/commit/e036a9f034d0401e4992d3449ec9fb91aee6a674))
* compile binaries ([c2c6642](https://github.com/nuxt-contrib/siroc/commit/c2c66425b582d8b2fe98f48423a4debe79022276))
* improve rollup config generation ([0e322bb](https://github.com/nuxt-contrib/siroc/commit/0e322bb63cc35b79cb72fb44aec4ed53dd14aabd))
* set permissions on binaries ([05b92d1](https://github.com/nuxt-contrib/siroc/commit/05b92d1ac0cfc6d126fb5816daeedba6381341e4))
* support legacy file name ([3f50db0](https://github.com/nuxt-contrib/siroc/commit/3f50db0408e6b5707cbbc692d220b1bce0b96a3e))
* use es build of cli ([5a4db66](https://github.com/nuxt-contrib/siroc/commit/5a4db66d68327cdba459e36c3b61a0b0f49506fc))
* use siroc (and `jiti`) to compile siroc ([51c1cf4](https://github.com/nuxt-contrib/siroc/commit/51c1cf4b4380320d91a868295b63dc04e3d95c65))


### Bug Fixes

* add execa types ([3cb4762](https://github.com/nuxt-contrib/siroc/commit/3cb4762a9c3b9cb52f67a7fb2af44da4bef86f5a))
* remove `.flat` (target node 10) ([0d72f9f](https://github.com/nuxt-contrib/siroc/commit/0d72f9f6e29f5499077040fde57c61cb76d84817))
* revert bootstrapping ([8b06abc](https://github.com/nuxt-contrib/siroc/commit/8b06abca04feafada5db707a760c9f8477ebb1da))


### Performance Improvements

* remove excess deps ([2224c79](https://github.com/nuxt-contrib/siroc/commit/2224c79995ede60f5b6649a99b73f07fb75d1c5b))

