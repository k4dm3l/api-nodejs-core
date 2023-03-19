/**
 * Server configuration & handler function
 */

const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const router = require("./routes");
const handlers = require("./handlers");
const { parseJsonToObject } = require("./libs/helpers");

const util = require("util");
const debug = util.debuglog("server");

const server = {};

server.serverConfiguration = (req, res) => {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get headers as object
  const headers = req.headers;

  // Get the payload if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    // Choose the handler related to the request. If not should return notFound handler
    const requestedHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: parseJsonToObject(buffer),
    };

    try {
      // Route the request to the handler
      requestedHandler(data, (statusCode, payload) => {
        server.processHandlerResponse(res, method, trimmedPath, statusCode, payload)
      });
    } catch (error) {
      debug(error);
      server.processHandlerResponse(res, method, trimmedPath, 500, {
        Error: 'An uknown error has occurer'
      },
      'json');
    }
  });
};

// Process the response from the handler
server.processHandlerResponse = (res, method, trimmedPath, statusCode, payload, contentType) => {
  // Use the status code called back by the handler or default 200
  statusCode = typeof statusCode === "number" ? statusCode : 200;

  // Use the payload called back by the handler or default empty
  payload = typeof payload === "object" ? payload : {};

  // Convert the payload to a string
  const payloadString = JSON.stringify(payload);

  // Return the response
  res.setHeader("Content-type", "application/json");
  res.writeHead(statusCode);
  res.end(payloadString);

  // Log the request path
  // If the response is 200, print green otherwise print red
  if (statusCode === 200) {
    debug("\x1b[32m%s\x1b[0m", `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
  } else {
    debug("\x1b[31m%s\x1b[0m", `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
  }
}

// Init HTTP server
server.httpServer = http.createServer((req, res) => {
  server.serverConfiguration(req, res);
});

// HTTPS option object
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/https/cert.pem")),
};

// Init HTTPS server
server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    server.serverConfiguration(req, res);
  }
);

server.init = function () {
  // Start HTTP server
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      "\x1b[35m%s\x1b[0m",
      `[${config.envName}]:Server running on port ${config.httpPort}`
    );
  });

  // Start HTTPS server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      "\x1b[35m%s\x1b[0m",
      `[${config.envName}]:Server running on port ${config.httpsPort}`
    );
  });
};

module.exports = server;
