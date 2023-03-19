/**
 * Test runner
 */
const unitTests = require('./unit');
const apiTest = require('./api');

// Override the NODE_ENV variable
process.env.NODE_ENV = 'testing';

// Application logic for the tes runner
const _app = {};

// Container for the tests
_app.tests = {
  // unit: unitTests,
  api: apiTest,
}

// Count all the tests
_app.countTests = () => {
  let counter = 0;

  for (const key in _app.tests) {
    if (_app.tests.hasOwnProperty(key)) {
      const subTests = _app.tests[key];

      for (const testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          counter++;
        }
      }
    }
  }

  return counter;
};

// Produce a test outcome report
_app.produceTestReport = (limit, successes, errors) => {
  console.log("");
  console.log("--------BEGIN TEST REPORT--------");
  console.log("");
  console.log("Total Tests: ", limit);
  console.log("Pass: ", successes);
  console.log("Fail: ", errors.length);
  console.log("");

  // If there are errors, print them
  if (errors.length) {
    console.log("-------BEGIND ERROR DETAILS-------");
    console.log("");
    
    errors.forEach(error => {
      console.log("\x1b[31m%s\x1b[0m", error.name);
      console.log("\x1b[31m%s\x1b[0m", error.error);
      console.log("");
    });

    console.log("");
    console.log("-------END ERROR DETAILS-------");
  }

  console.log("");
  console.log("---------END  TEST REPORT---------");
  process.exit(0);
}

// Run all the test, collecting the results
_app.runTests = () => {
  let errors = [];
  let successes = 0;
  let limit = _app.countTests();
  let counter = 0;

  for (const key in _app.tests) {
    if (_app.tests.hasOwnProperty(key)) {
      let subTest = _app.tests[key];

      for (const test in subTest) {
        if (subTest.hasOwnProperty(test)) {
          (function() {
            const tmpTestName = test;
            const testValue = subTest[test];

            // Call the test
            try {
              testValue(() => {
                // If it calls back without throwing then it succeeded log in green
                console.log(
                  "\x1b[32m%s\x1b[0m",
                  tmpTestName
                );

                counter++;
                successes++;

                if (counter === limit) {
                  _app.produceTestReport(limit, successes, errors);
                }
              })
            } catch (e) {
              // If it throws then it failed so capture the error and log in red
              errors.push({
                name: test,
                error: e,
              });

              console.log(
                "\x1b[31m%s\x1b[0m",
                tmpTestName
              );
              counter++;
              
              if (counter === limit) {
                _app.produceTestReport(limit, successes, errors);
              }
            }
          })()
        }
      }
      
    }
  }

}

// Run the tests
_app.runTests();
