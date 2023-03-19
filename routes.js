const { sample, ping, users, tokens, checks, exampleError } = require("./handlers");

module.exports = {
  health: sample,
  ping: ping,
  "api/users": users,
  "api/tokens": tokens,
  "api/checks": checks,
  'examples/error': exampleError,
};
