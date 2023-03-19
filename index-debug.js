/**
 * Main File
 */

// Dependencies
const server = require("./server");
const workers = require("./workers");
const cli = require('./libs/cli');
const exampleDebuggingProblem = require('./libs/exampleDebuggingProblem');

const app = {
  init: function () {

    debugger;
    // Start servers
    server.init();

    debugger;
    // Start workers
    workers.init();

    debugger;
    // Start the CLI, but make sure it starts last
    setTimeout(() => {
      cli.init();
    }, 50);

    debugger;
    let foo = 1;
    foo++;

    debugger;
    foo = foo * foo;

    debugger;
    foo = foo.toString();

    debugger;
    // Calling debuggin error
    exampleDebuggingProblem.init();
    debugger;
  },
};

// Execut init app function
app.init();

// Export app
module.exports = app;
