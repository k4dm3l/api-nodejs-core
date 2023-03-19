/**
 * Library for storing and editing data
 */

const fs = require("fs");
const path = require("path");
const { parseJsonToObject } = require("./helpers");

const lib = {
  baseDir: path.join(__dirname, "/../.data/"),
  create: function (dir, file, data, callback) {
    // Open file
    fs.open(
      `${lib.baseDir}/${dir}/${file}.json`,
      "wx",
      (error, fileDescriptor) => {
        if (error) {
          callback("Could not create new file, it may already exists");
        } else {
          // Convert data to string
          const stringData = JSON.stringify(data);

          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData, (error) => {
            if (error) {
              callback("Error writing to new file");
            } else {
              fs.close(fileDescriptor, (error) => {
                if (error) {
                  callback("Error closing new file");
                } else {
                  callback(false);
                }
              });
            }
          });
        }
      }
    );
  },
  read: function (dir, file, callback) {
    fs.readFile(
      `${lib.baseDir}/${dir}/${file}.json`,
      "utf-8",
      (error, data) => {
        if (!error && data) {
          const parsedData = parseJsonToObject(data);
          callback(false, parsedData);
        } else {
          callback(error, data);
        }
      }
    );
  },
  update: function (dir, file, data, callback) {
    // Open the file
    fs.open(
      `${lib.baseDir}/${dir}/${file}.json`,
      "r+",
      (error, fileDescriptor) => {
        if (error) {
          callback("Could not open the file for updating");
        } else {
          const stringData = JSON.stringify(data);

          // Truncate the file
          fs.truncate(fileDescriptor, (error) => {
            if (error) {
              callback("Error truncating file");
            } else {
              // Write to the file and close it
              fs.writeFile(fileDescriptor, stringData, (error) => {
                if (error) {
                  callback("Error writing to existing file");
                } else {
                  fs.close(fileDescriptor, (error) => {
                    if (error) {
                      callback("Error closing the file");
                    } else {
                      callback(false);
                    }
                  });
                }
              });
            }
          });
        }
      }
    );
  },
  delete: function (dir, file, callback) {
    // Unlink the file
    fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, (error) => {
      if (error) {
        callback("Error deleting file");
      } else {
        callback(false);
      }
    });
  },
  list: function (dir, callback) {
    // List all itemts in a directory
    fs.readdir(`${lib.baseDir}/${dir}/`, (error, data) => {
      if (error || !data || !data.length) {
        callback(error, data);
      } else {
        const trimmedFileNames = [];

        data.forEach((fileName) => {
          trimmedFileNames.push(fileName.replace(".json", ""));
        });

        callback(false, trimmedFileNames);
      }
    });
  },
};

module.exports = {
  ...lib,
};
