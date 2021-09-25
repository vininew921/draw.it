const path = require("path");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const livereload = require("livereload").createServer();
const connectLivereload = require("connect-livereload");
const port = process.env.PORT || 3000;

const publicDirectory = path.join(__dirname, 'public');

livereload.watch(publicDirectory);
livereload.server.once("connection", () =>{
  setTimeout(() =>{
    livereload.refresh("/");
  }, 100);
});

app.use(connectLivereload());

app.use(express.static(publicDirectory));


app.get('/', (req, res) =>{
  res.sendFile(__dirname + '/index.html');
});

function onConnection(socket) {
  socket.on("drawing", (data) => socket.broadcast.emit("drawing", data));
}

io.on("connection", onConnection);

http.listen(port, () => console.log("listening on port " + port));
