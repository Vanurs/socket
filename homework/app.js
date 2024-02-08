// Import Libraries and Setup

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Tell our Node.js Server to host our P5.JS sketch from the public folder.
app.use(express.static("public"));

// Setup Our Node.js server to listen to connections from chrome, and open chrome when it is ready
server.listen(3000, () => {
  console.log("listening on *:3000");
});

let printEveryMessage = false; 

// Callback function for what to do when our P5.JS sketch connects and sends us messages
io.on("connection", (socket) => {
  console.log("a user connected");
  // Code to run every time we get a message from P5.JS
  socket.on("drawing", (data) => {

    //do something
    socket.broadcast.emit('drawing', data);//broadcast.emit means send to everyone but the sender

    // Print it to the Console
    if (printEveryMessage) {
      console.log(data);
    }
  });
});

