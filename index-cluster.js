/**
 * Main File
 */

// Dependencies
const server = require("./server");
const workers = require("./workers");
const cli = require('./libs/cli');
const cluster = require('cluster');
const os = require('os');

const app = {
  init: function (callback) {
    if (cluster.isMaster) {
      // Start workers
      workers.init();

      // Start the CLI, but make sure it starts last
      setTimeout(() => {
        cli.init();
        callback();
      }, 50);

      // Fork the process
      for (let core = 0; core < os.cpus().length; core++) {
        cluster.fork();
      }
    } else {
      // Start servers
      server.init();
    }
  },
};

// Self invoking only if required directly
if (require.main === module) {
  app.init(() => {});
}

// Export app
module.exports = app;
