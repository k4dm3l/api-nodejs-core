/**
 * CLI-Related Tasks
 */

// Dependencies
const os = require('os');
const readline = require('readline');
const util = require('util');
const events = require('events');
const v8 = require('v8');
const _data = require('./data');
const _logs = require('./logger');
const _helpers = require('./helpers');
const childProcess = require('child_process');

const debug = util.debuglog('cli');

class _events extends events{};

const e = new _events();

// Instantiate the CLI module object
const cli = {
  processInput: (str) => {
    str = typeof(str) === 'string' && str.trim().length ? str.trim() : false

    // Only process the input if the user actually wrote something. Otherwise igonre
    if (str) {
      // Codify the unique strings that identify the unique questions allowed to be asked
      const uniqueInputs = [
        'man',
        'help',
        'exit',
        'stats',
        'list users',
        'more user info',
        'list checks',
        'more check info',
        'list logs',
        'more log info'
      ];

      // Go through the possible inputs, emit and event when a match is found
      let matchFound = false;
      let counter = 0;

      uniqueInputs.some((input) => {
        if (str.toLowerCase().indexOf(input) > -1) {
          matchFound = true;

          // Emit an event matching the unique input and include the full string given
          e.emit(input, str);
          return true;
        }
      });

      // If no match is found, tell the user to try again
      if (!matchFound) {
        console.log('Sorry, try again');
      }
    }
  },
  init: () => {
    // Send the start message to the console in dark blue
    console.log(
      "\x1b[34m%s\x1b[0m",
      "The CLI is running"
    );

    // Start the interface
    const _interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      propmt: '>'
    });

    // Create an initila prompt
    _interface.prompt();

    // Handle each line of input separately
    _interface.on('line', (str) => {
      // Send to the input processor
      cli.processInput(str);

      // Re-initialize the prompt afterwards
      _interface.prompt();

      // If the user stops the CLI, ko;; the associated process
      _interface.on('close', () => {
        process.exit(0);
      })
    })
  },
  horizontalLine: () => {
    // Get the available screen size
    const width = process.stdout.columns;
    let line = '';

    for (let i = 0; i < width; i++) {
      line += '-';
    }

    console.log(line)
  },
  centered: (str) => {
    str = typeof(str) === 'string' && str.trim().length ? str.trim() : '';

    const width = process.stdout.columns;
    const leftPadding = Math.floor((width - str.length) / 2);

    let line = '';

    for (let i = 0; i < leftPadding; i++) {
      line += ' ';
    }

    line += str;
    console.log(line);
  },
  verticalSpace: (lines) => {
    lines = typeof(lines) === 'number' && lines > 0 ? lines : 1;

    for (let i = 0; i < lines; i++) {
      console.log('');
    }
  },
  // Responders object
  responders: {
    // Help / Man
    help: () => {
      const commands = {
        'exit': 'Kill the CLI (and the rest of the application)',
        'man': 'Show this help page',
        'help': 'Alias of the man command',
        'stats': 'Get statistics on the underlying operating system and resource utilization',
        'list users': 'Show a list of all the registered (undelited) users in the system',
        'more user info --{userId}': 'Show details of a specific user',
        'list checks --up --down': 'Show a list of all the active checks in the system, including their state. The "--up" and the "--down" are both optional',
        'more check info --{checkId}': 'Show details of a specific check',
        'list logs': 'Show a list of all the log files available to be read (compress only)',
        'more log info --{fileName}': 'Show details of a specified log file',
      };

      // Show a header for the help page that is as wide as the screen
      cli.horizontalLine();
      cli.centered('CLI MANUAL');
      cli.horizontalLine();
      cli.verticalSpace(2);

      // Show each command followed by its explanation, in whit and yellow respectively
      for (const key in commands) {
        if (commands.hasOwnProperty(key)) {
          const value = commands[key];
          let line = '\x1b[33m' + key + '\x1b[0m';
          const padding = 60 - line.length;

          for (let i = 0; i < padding; i++) {
            line += ' ';
          }

          line += value;
          console.log(line);
          cli.verticalSpace();
        }
      }

      cli.verticalSpace(1);

      // End with another horizontalLine
      cli.horizontalLine();

    },
    // Exit
    exit: () => {
      process.exit(0);
    },
    // Stats
    stats: () => {
      // Compile an object of stats
      const stats = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        'Update': os.uptime()+' Seconds',
      };

      cli.horizontalLine();
      cli.centered('SYSTEM STATISTICS');
      cli.horizontalLine();
      cli.verticalSpace(2);

       // Log out each stat
      for (const key in stats) {
        if (stats.hasOwnProperty(key)) {
          const value = stats[key];
          let line = '\x1b[33m' + key + '\x1b[0m';
          const padding = 60 - line.length;

          for (let i = 0; i < padding; i++) {
            line += ' ';
          }

          line += value;
          console.log(line);
          cli.verticalSpace();
        }
      }

      cli.verticalSpace(1);

      // End with another horizontalLine
      cli.horizontalLine();
    },
    // Lis Users
    listsUsers: () => {
      _data.list('users', (error, userIds) => {
        if (!error && userIds && userIds.length) {
          cli.verticalSpace();
          userIds.forEach((userId) => {
            _data.read('users', userId, (error, userData) => {
              if (!error && userData) {
                let line = `Name: ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Checks: `;
                const numberOfChecks = typeof(userData.checks) === 'object' && 
                  userData.checks instanceof Array && 
                  userData.checks.length 
                  ? userData.checks.length
                  : 0
                
                line += numberOfChecks

                console.log(line);
                cli.verticalSpace();
              }
            });
          })
        }
      });
    },
    // Use Info
    moreUserInfo: (str) => {
      // Get the ID from the string provided
      const arr = str.split('--');
      const userId = typeof(arr[1]) === 'string' && arr[1].trim().length ? arr[1].trim() : false;

      if (userId) {
        _data.read('users', userId, (error, userData) => {
          if (!error && userData) {
            // Remove the hashed password
            delete userData.hashPassword;

            // Print the JSON with text highlighting
            cli.verticalSpace();
            console.dir(userData, {
              colors: true
            });
            cli.verticalSpace();
          }
        });
      }
    },
    // Lis Checks
    listChecks: (str) => {
      _data.list('checks', (error, checkIds) => {
        if (!error && checkIds && checkIds.length) {
          cli.verticalSpace();
          checkIds.forEach((checkId) => {
            _data.read('checks', checkId, (error, checkData) => {
              let includeCheck = false;
              const lowerString = str.toLowerCase();

              // Get the state default to down
              const state = typeof(checkData.state) === 'string' ? checkData.state : 'down';
              // Get the state default to unknown
              const stateOrUnknown = typeof(checkData.state) === 'string' ? checkData.state : 'unknown';

              // If the user has specified the state, or hasn't specified any state include the current
              if (
                lowerString.indexOf('--'+state) > -1 || 
                (
                  lowerString.indexOf('--down') === -1 && 
                  lowerString.indexOf('--up') === -1
                )
              ) {
                let line = `ID: ${checkData.id} ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} ${stateOrUnknown}`;
                console.log(line);
                cli.verticalSpace(); 
              }
            });
          });
        }
      });
    },
    // Check Info
    moreCheckInfo: (str) => {
      // Get the ID from the string provided
      const arr = str.split('--');
      const checkId = typeof(arr[1]) === 'string' && arr[1].trim().length ? arr[1].trim() : false;

      if (checkId) {
        _data.read('checks', checkId, (error, checkData) => {
          if (!error && checkData) {

            // Print the JSON with text highlighting
            cli.verticalSpace();
            console.dir(checkData, {
              colors: true
            });
            cli.verticalSpace();
          }
        });
      }
    },
    // Lis Logs
    listLogs: () => {
      const ls = childProcess.spawn('ls', ['./.logs/']);
      ls.stdout.on('data', (dataObject) => {
        // Explode into separate lines
        const dataStr = dataObject.toString();
        const logFilesNames = dataStr.split('\n');

        cli.verticalSpace();
        logFilesNames.forEach((logFileName) => {
          if (typeof(logFileName) === 'string' && logFileName.length && logFileName.indexOf('-') > -1) {
            console.log(logFileName.trim().split('.')[0]);
            cli.verticalSpace();
          }
        });
      });
    },
    // Log Info
    moreLogInfo: (str) => {
      // Get the ID from the string provided
      const arr = str.split('--');
      const logFileName = typeof(arr[1]) === 'string' && arr[1].trim().length ? arr[1].trim() : false;

      if (logFileName) {
        cli.verticalSpace();
        _logs.decompress(logFileName, (error, strData) => {
          if (!error && strData) {
            // Split into lines
            const arr = strData.split('\n');
            arr.forEach((jsonString) => {
              let logObject = _helpers.parseJsonToObject(jsonString);

              if (logObject && JSON.stringify(logObject) !== '{}') {
                console.dir(logObject, {
                  colors: true
                });
                cli.verticalSpace();
              }
            });
          }
        });
      }
    },
  }
};

// Input handlers
e.on('man', (str) => {
  cli.responders.help();
});

e.on('help', (str) => {
  cli.responders.help();
});

e.on('exit', (str) => {
  cli.responders.exit();
});

e.on('stats', (str) => {
  cli.responders.stats();
});

e.on('list users', (str) => {
  cli.responders.listsUsers();
});

e.on('more user info', (str) => {
  cli.responders.moreUserInfo(str);
});

e.on('list checks', (str) => {
  cli.responders.listChecks(str);
});

e.on('more check info', (str) => {
  cli.responders.moreCheckInfo(str);
});

e.on('list logs', (str) => {
  cli.responders.listLogs();
});

e.on('more log info', (str) => {
  cli.responders.moreLogInfo(str);
});

module.exports = cli;