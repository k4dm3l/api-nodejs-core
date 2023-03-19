/**
 * Workers configuration
 */

// Dependencies
const path = require("path");
const fs = require("fs");
const _data = require("../libs/data");
const https = require("https");
const http = require("http");
const url = require("url");
const { sendSms } = require("../integrations/twilio");
const { append, list, compress, truncate } = require("../libs/logger");
const util = require("util");

const debug = util.debuglog("workers");

const workers = {};

/**
 * Log in files the result of the checks
 * @param {*} originalCheckData
 * @param {*} checkOutcome
 * @param {*} state
 * @param {*} alertWarranted
 * @param {*} timeOfCheck
 */
workers.log = function (
  originalCheckData,
  checkOutcome,
  state,
  alertWarranted,
  timeOfCheck
) {
  // Form the log data
  const logData = {
    check: originalCheckData,
    otucome: checkOutcome,
    state,
    alert: alertWarranted,
    time: timeOfCheck,
  };

  // Convert data to a string
  const logString = JSON.stringify(logData);

  // Determine the name of the log file
  const logFileName = originalCheckData.id;

  // Append the log string to the file
  append(logFileName, logString, (error) => {
    if (error) {
      debug("Loggin to file failed");
    } else {
      debug("Loggin to file success");
    }
  });
};

/**
 * Alert the user as to a change in their check status
 * @param {*} newCheckData
 */
workers.alertUserToStatusChange = function (newCheckData) {
  const message = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`;

  sendSms(newCheckData.userPhone, message, (error) => {
    if (error) {
      debug(
        "Error: Could not send sms alert to user who had a state change in their check"
      );
    } else {
      debug(
        `Success: User was alerted to a status change in their check via sms: "${message}"`
      );
    }
  });
};

/**
 * Process the check outcome and update the check data as needed, triger an alert.
 * Special logic for accomodating a check that has never been tested before
 * @param {*} originalCheckData
 * @param {*} checkOutcome
 */
workers.processCheckOutcome = function (originalCheckData, checkOutcome) {
  // Decide if the check is considered up or down
  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.sucessCodes.indexOf(checkOutcome.responseCode) > 1
      ? "up"
      : "down";

  // Decide if an alert is warranted
  const alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;

  // Log the outcome
  const timeOfCheck = Date.now();
  workers.log(
    originalCheckData,
    checkOutcome,
    state,
    alertWarranted,
    timeOfCheck
  );

  // Update the check data
  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;

  _data.update("checks", newCheckData.id, newCheckData, (error) => {
    if (error) {
      debug("Error trying to save updates to one of the checks");
    } else {
      // Send the new check data to the next phase in the process if needed
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        debug("Check outcome has not changed, not alert needed");
      }
    }
  });
};

/**
 * Perfom the check, send the originalCheckData and the outcome
 * @param {*} originalCheckData
 */
workers.perfomCheck = function (originalCheckData) {
  // Prepare the initial check outcome
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  // Mark that the outcome has not been sent yet
  let outcomeSent = false;

  // Parse the hostname and the path out of the original check data
  const parsedUrl = url.parse(
    `${originalCheckData.protocol}://${originalCheckData.url}`,
    true
  );
  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path; // Using path and not "pathname" because we want the query string

  // Configure the request details
  const requestConfig = {
    protocol: `${originalCheckData.protocol}:`,
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  // Instantiate the request object using either http or https module
  const _moduleToUse = originalCheckData.protocol === "http" ? http : https;
  const request = _moduleToUse.request(requestConfig, (response) => {
    // Grab status request and update checkOutcome and pass the data along
    checkOutcome.responseCode = response.statusCode;

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the error so it doesn't get thrown
  request.on("error", (error) => {
    // Update checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: error,
    };

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  request.on("timeout", (error) => {
    // Update checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: "timeout",
    };

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // End the request
  request.end();
};

/**
 * Sanity-check the check data
 * @param {*} originalCheckData
 */
workers.validateCheckData = function (originalCheckData) {
  originalCheckData =
    typeof originalCheckData === "object" && originalCheckData !== null
      ? originalCheckData
      : {};

  originalCheckData.id =
    typeof originalCheckData.id === "string" &&
    originalCheckData.id.trim().length === 20
      ? originalCheckData.id.trim()
      : false;

  originalCheckData.userPhone =
    typeof originalCheckData.userPhone === "string" &&
    originalCheckData.userPhone.trim().length === 10
      ? originalCheckData.userPhone.trim()
      : false;

  originalCheckData.protocol =
    typeof originalCheckData.protocol === "string" &&
    ["http", "https"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;

  originalCheckData.url =
    typeof originalCheckData.url === "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url
      : false;

  originalCheckData.method =
    typeof originalCheckData.method &&
    ["post", "get", "put", "delete"].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false;

  originalCheckData.sucessCodes =
    typeof originalCheckData.sucessCodes === "object" &&
    originalCheckData.sucessCodes instanceof Array &&
    originalCheckData.sucessCodes.length > 0
      ? originalCheckData.sucessCodes
      : false;

  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds === "number" &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds > 0 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false;

  const validationFields = Object.keys(originalCheckData).some(
    (key) => originalCheckData[key] === false
  );

  // Set the key for check site state
  originalCheckData.state =
    typeof originalCheckData.state === "string" &&
    ["up", "down"].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : "down";

  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked === "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  // If all the checks pass, pass the data along to next stage
  if (validationFields) {
    debug("Error: some required fields in check information is missing");
  } else {
    workers.perfomCheck(originalCheckData);
  }
};

/**
 * Lookup all checks, get their data, send to a validator
 */
workers.gatherAllChecks = function () {
  // Get all the checks
  _data.list("checks", (error, checks) => {
    if (error || !checks || !checks.length) {
      debug("Error: Could not find any checks to process");
    } else {
      checks.forEach((check) => {
        // Read in the check data
        _data.read("checks", check, (error, originalCheckData) => {
          if (error || !originalCheckData) {
            debug("Error reading check data");
          } else {
            // Pass it to the check validator and let the function continue or log error
            workers.validateCheckData(originalCheckData);
          }
        });
      });
    }
  });
};

/**
 * Rotate (compress) the log files
 */
workers.rotateLogs = function () {
  // List all the non compress log files
  list(false, (error, logs) => {
    if (error || !logs || !logs.length) {
      debug("Error: could not find any logs to rotate");
    } else {
      logs.forEach((logFile) => {
        // Compress the data to a different file
        const logId = logFile.replace(".log", "");
        const newLogId = `${logId}-${Date.now()}`;

        compress(logId, newLogId, (error) => {
          if (error) {
            debug("Error compressing one of the log files");
          } else {
            // Truncate the log
            truncate(logId, (error) => {
              if (error) {
                debug("Error truncating log file");
              } else {
                debug("Success truncating log file");
              }
            });
          }
        });
      });
    }
  });
};

/**
 * Timer to execute the log-rotation process once per day
 */
workers.logRotationLoop = function () {
  setInterval(() => {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

/**
 * Timer to execute the worker-process once per minute
 */
workers.loop = function () {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

workers.init = function () {
  console.log("\x1b[33m%s\x1b[0m", "Background workers are running");
  // Execute all the checks inmediatly
  workers.gatherAllChecks();

  // Call the loop so the checks will execute later on
  workers.loop();

  // Compress all the logs immediately
  workers.rotateLogs();

  // Call the compression loop so logs will be compressed later on
  workers.logRotationLoop();
};

module.exports = workers;
