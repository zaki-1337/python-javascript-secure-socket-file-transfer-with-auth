"use strict";

const tls = require("tls");
const fs = require("fs");
const path = require("path");
const readline = require("readline-sync");

const HOST = "127.0.0.1";
const PORT = 1337;

let requestedFileName; // to receive
let receivedFileName;

let receivedData; // write stream

let state = "BEFORE-LOGIN";

const options = {
  ca: fs.readFileSync("public-cert.pem"),
  host: HOST,
  port: PORT,
  rejectUnauthorized: false, // Set to false for testing purposes only
};

const socket = tls.connect(options, () => {
  console.log(`Client connected using TLS to server at ${HOST}:${PORT}`);

  const userName = readline.question("Enter the username: ");
  const passWord = readline.question("Enter the password: ");

  const loginDetails = { uname: userName, pass: passWord };

  socket.write(JSON.stringify(loginDetails), "utf-8");

  socket.on("data", (data) => {
    const { type, response } = handleServerResponse(data);

    if (type == "login-request") {
      if (response) {
        console.log("Logged in successfully.");
      } else {
        console.log("Invalid credentials. Try Again.");

        const userName = readline.question("Enter the username: ");
        const passWord = readline.question("Enter the password: ");

        const loginDetails = { uname: userName, pass: passWord };

        socket.write(JSON.stringify(loginDetails), "utf-8");
      }
    }
    if (type == "resource-request") {
      requestedFileName = response;
      socket.write(requestedFileName, "utf-8");
      console.log("Resource request sent.");
    }
    if (type == "file-request") {
      console.log("File being sent.");
    }
    if (type == "data") {
      if (!receivedData) {
        receivedFileName = `received-${requestedFileName}`;
        receivedData = fs.createWriteStream(
          path.join(__dirname, "Client Data", receivedFileName)
        );
      }

      receivedData.write(response);
    }
  });

  socket.on("close", () => {
    console.log("Received all data.");
    receivedData.close(() => {
      console.log("File saved successfully.");
    });

    console.log("Connection closed.");

    state = "BEFORE-FILE-REQUEST"; // ready for new file
  });
});

function handleServerResponse(data) {
  if (state == "BEFORE-LOGIN") {
    let loggedIn = 0;

    const message = data.toString("utf-8");
    if (message.includes("Logged in.")) {
      loggedIn = 1;
      state = "BEFORE-FILE-REQUEST";
    }

    return { type: "login-request", response: loggedIn };
  }
  if (state == "BEFORE-FILE-REQUEST") {
    if (data.toString("utf-8").includes("Sending File...")) {
      state = "FILE-REQUEST-SENT";

      return { type: "file-request", response: "" };
    }

    console.log("Files available on the server: ");

    const message = eval(data.toString("utf-8")).filter(
      (e) => e != ".DS_Store"
    ); // gives list
    console.log(message);

    let requestedResource = readline.question(
      "Enter resource to request or '..' to go back a folder: "
    );
    while (!message.includes(requestedResource) && requestedResource != "..") {
      requestedResource = readline.question(
        "Resource not present in server.\nEnter resource to request or '..' to go back a folder: "
      );
    }

    return { type: "resource-request", response: requestedResource };
  }
  if (state == "FILE-REQUEST-SENT") {
    console.log("Receiving data from server...");

    return { type: "data", response: data };
  }
}
