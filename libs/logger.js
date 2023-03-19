/**
 * Library for storing and rotating logs
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const logger = {};

logger.baseDir = path.join(__dirname, "../.logs/");

/**
 * Append a string to a file. Create the file if it does not exists.
 * @param {*} fileName
 * @param {*} logString
 * @param {*} callback
 */
logger.append = function (fileName, logString, callback) {
  // Open the file
  fs.open(`${logger.baseDir}${fileName}.log`, "a", (error, fileDescriptor) => {
    if (error || !fileDescriptor) {
      callback("Could not open file for appending");
    } else {
      fs.appendFile(fileDescriptor, `${logString}\n`, (error) => {
        if (error) {
          callback("Error appending the log file");
        } else {
          fs.close(fileDescriptor, (error) => {
            if (error) {
              callback("Error closing the log file");
            } else {
              callback(false);
            }
          });
        }
      });
    }
  });
};

/**
 * List all the logs and optionally includes the compress logs
 * @param {*} includeCompressedLogs
 * @param {*} callback
 */
logger.list = function (includeCompressedLogs, callback) {
  fs.readdir(logger.baseDir, (error, data) => {
    if (error || !data || !data.length) {
      callback(error, data);
    } else {
      const trimmedFileNames = [];

      data.forEach((fileName) => {
        // Add the .log files
        if (fileName.indexOf(".log") > -1) {
          trimmedFileNames.push(fileName.replace(".log", ""));
        }

        // Add on the .gz files
        if (fileName.indexOf(".gz.b64") > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace(".gz.b64", ""));
        }
      });

      callback(false, trimmedFileNames);
    }
  });
};

/**
 * Compress the contents of one .log file into a .gz.b64 file within the same directory
 * @param {*} logFileId
 * @param {*} newLogFileId
 * @param {*} callback
 */
logger.compress = function (logFileId, newLogFileId, callback) {
  const sourceFile = `${logFileId}.log`;
  const destinationFile = `${newLogFileId}.gz.b64`;

  // Read the source file
  fs.readFile(
    `${logger.baseDir}${sourceFile}`,
    "utf-8",
    (error, inputString) => {
      if (error || !inputString) {
        callback(error);
      } else {
        // Compress the data using gzip
        zlib.gzip(inputString, (error, buffer) => {
          if (error || !buffer) {
            callback(error);
          } else {
            // Send the data to the destination file
            fs.open(
              `${logger.baseDir}${destinationFile}`,
              "wx",
              (error, fileDescriptor) => {
                if (error || !fileDescriptor) {
                  callback(error);
                } else {
                  // Write the destination file
                  fs.writeFile(
                    fileDescriptor,
                    buffer.toString("base64"),
                    (error) => {
                      if (error) {
                        callback(error);
                      } else {
                        // Close destination file
                        fs.close(fileDescriptor, (error) => {
                          if (error) {
                            callback(error);
                          } else {
                            callback(false);
                          }
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        });
      }
    }
  );
};

/**
 * Decompress the contents of a .gz.b64 file inot a string variable
 */
logger.decompress = function (fileId, callback) {
  fs.readFile(`${logger.baseDir}${fileId}.gz.b64`, "utf-8", (error, str) => {
    if (error || !str) {
      callback(error);
    } else {
      // Decompress the data
      const inputBuffer = Buffer.from(str, "base64");
      zlib.unzip(inputBuffer, (error, outputBuffer) => {
        if (error || !outputBuffer) {
          callback(error);
        } else {
          const str = outputBuffer.toString();
          callback(false, str);
        }
      });
    }
  });
};

/**
 * Truncate a log file
 * @param {*} logId
 * @param {*} callback
 */
logger.truncate = function (logId, callback) {
  fs.truncate(`${logger.baseDir}${logId}.log`, 0, (error) => {
    if (error) {
      callback(false);
    } else {
      callback(error);
    }
  });
};

module.exports = logger;
