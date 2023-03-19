/**
 * Main File
 */

// Dependencies
const server = require("./server");
const workers = require("./workers");
const cli = require('./libs/cli');

const app = {
  init: function (callback) {
    // Start servers
    server.init();

    // Start workers
    workers.init();

    // Start the CLI, but make sure it starts last
    setTimeout(() => {
      cli.init();
      callback();
    }, 50)
  },
};

// Self invoking only if required directly
if (require.main === module) {
  app.init(() => {});
}

// Export app
module.exports = app;
