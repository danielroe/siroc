require('v8-compile-cache')

const _require = require('esm')(module)
module.exports = _require('./cli.js')
