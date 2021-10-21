const path = require("path");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const livereload = require("livereload").createServer();
const connectLivereload = require("connect-livereload");
const port = process.env.PORT || 3000;
const LobbyController = require("./Modules/LobbyController.js");

const lobbyController = new LobbyController();

const publicDirectory = path.join(__dirname, "public");

livereload.watch(publicDirectory);
livereload.server.once("connection", () => {
  setTimeout(() => {
    livereload.refresh("/");
  }, 100);
});

app.use(connectLivereload());

app.use(express.static(publicDirectory));

//Expose socket.io to client
app.use("/scripts", express.static(__dirname + "/node_modules/socket.io/client-dist/"));

app.get("/lobby", (req, res) => {
  res.sendFile(publicDirectory + "/pages/lobby.html");
});

app.get("/", (req, res) => {
  res.sendFile(publicDirectory + "/pages/home.html");
});

app.get("/game", (req, res) => {
  res.sendFile(publicDirectory + "/pages/game.html");
});

function onConnection(socket) {
  socket.on("lobbyDrawing", (data,player) => {
    lobbyController.drawing(io, player, data)
  });

  socket.on("createRoom", (player) => {
    lobbyController.createRoom(socket, player);
  });

  socket.on("disconnecting", () => {
    setTimeout(() => lobbyController.removePlayerFromRooms(io, socket), 10000);
  });

  socket.on("joinRoom", (player) => {
    lobbyController.joinRoom(io, socket, player);
  });

  socket.on("playerReadyChanged", (player) => {
    lobbyController.changePlayerReady(io, socket, player);
  });

  socket.on("joinGame", (data) => {
    lobbyController.joinGame(io, socket, data.playerId, data.roomCode);
  });
}

io.on("connection", onConnection);

http.listen(port, () => console.log("listening on port " + port));
