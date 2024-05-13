const express = require('express');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');
const http = require("http"); // Import http module

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
// const { ChromaClient } = require("chromadb");

const configFile = fs.readFileSync('config.json', 'utf8');
const config = JSON.parse(configFile);

const app = express();
const port = config.serverPort || 8080;
const userRouter = require('./routes/routes');

app.use(cors());

app.use(session({
  secret: 'moggers',
  resave: false,
  saveUninitialized: true,
}));

app.use(userRouter);

const server = http.createServer(app); // Create an HTTP server with Express app

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
}); // Pass the HTTP server to socket.io

io.on("connection", function (socket) {
  // console.log("Socket: a user connected");

  socket.on("chat message", obj => {
    console.log("received socket chat message");
    io.to(obj.room).emit("chat message", obj);
  });

  socket.on("join room", obj => {
    console.log("joining a room");
    socket.join(obj.room);
  });

  socket.on("leave room", obj => {
    console.log("leaving a room");
    socket.leave(obj.room);
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});