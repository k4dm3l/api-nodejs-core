/**
 * Main File
 */
'use strict';

// Dependencies
const server = require("./server");
const workers = require("./workers");
const cli = require('./libs/cli');

foo = 'bar'

const app = {
  init: function () {
    // Start servers
    server.init();

    // Start workers
    workers.init();

    // Start the CLI, but make sure it starts last
    setTimeout(() => {
      cli.init();
    }, 50)
  },
};

// Execut init app function
app.init();

// Export app
module.exports = app;
