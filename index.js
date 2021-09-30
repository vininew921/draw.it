const path = require("path");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const livereload = require("livereload").createServer();
const connectLivereload = require("connect-livereload");
const port = process.env.PORT || 3000;
const LobbyController = require("./Modules/LobbyController.js");
const Room = require("./Modules/Room.js");

const lobbyController = new LobbyController();

const publicDirectory = path.join(__dirname, 'public');

livereload.watch(publicDirectory);
livereload.server.once("connection", () =>{
  setTimeout(() =>{
    livereload.refresh("/");
  }, 100);
});

app.use(connectLivereload());

app.use(express.static(publicDirectory));

//Expose socket.io to client
app.use('/scripts', express.static(__dirname + '/node_modules/socket.io/client-dist/'));

app.get('/', (req, res) =>{
  res.sendFile(publicDirectory + "/pages/home.html");
});

app.get('/lobby', (req, res) => {
  res.sendFile(publicDirectory + "/pages/lobby.html");
});

function onConnection(socket) {
  socket.on("drawing", (data) => socket.broadcast.emit("drawing", data));

  socket.on("createRoom", (player) => {
    console.log(lobbyController.rooms);
    if (!lobbyController.getRoomByCode(player.roomCode)) {
      console.log("Player " + player.nickname + " created room " + player.roomCode);
      lobbyController.addRoom(new Room(8, player.roomCode));
    }
    else {
      console.log("Room " + player.roomCode + " already exists!");
    }
  });

  socket.on("joinRoom", (player) => {
    if (lobbyController.getRoomByCode(player.roomCode)) {
      console.log("Player " + player.nickname + " joined room " + player.roomCode);
    }
    else {
      console.log("Room " + player.roomCode + " doest not exists!");
    }
  });
}

io.on("connection", onConnection);

http.listen(port, () => console.log("listening on port " + port));
