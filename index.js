/*
  Draw.it
  Copyright (C) 2021  Various Authors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const path = require('path');
const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const livereload = require('livereload').createServer();
const connectLivereload = require('connect-livereload');
const LobbyController = require('./Modules/LobbyController');

const port = process.env.PORT || 3000;
const lobbyController = new LobbyController();
const publicDirectory = path.join(__dirname, 'public');

/*
 * Live Reload Server
 */

livereload.watch(publicDirectory);
livereload.server.once('connection', () => {
  setTimeout(() => { livereload.refresh('/'); }, 100);
});

/*
 * Express
 */

app.use(connectLivereload());
app.use(express.static(publicDirectory));

app.get('/', (req, res) => {
  res.sendFile(`${publicDirectory}/pages/home.html`);
});

app.get('/lobby', (req, res) => {
  res.sendFile(`${publicDirectory}/pages/lobby.html`);
});

app.get('/game', (req, res) => {
  res.sendFile(`${publicDirectory}/pages/game.html`);
});

// expose socket.io to client
app.use('/scripts', express.static(`${__dirname}/node_modules/socket.io/client-dist/`));

/*
 * Socket
 */

function onConnection(socket) {
  socket.on('createRoom', (player) => {
    lobbyController.createRoom(socket, player);
  });

  socket.on('joinRoom', (player) => {
    lobbyController.joinRoom(io, socket, player);
  });

  socket.on('joinGame', (data) => {
    lobbyController.joinGame(io, socket, data.playerId, data.roomCode);
  });

  socket.on('disconnecting', () => {
    setTimeout(() => lobbyController.removePlayerFromRooms(io, socket), 10000);
  });

  socket.on('playerReadyChanged', (player) => {
    lobbyController.changePlayerReady(io, socket, player);
  });

  socket.on('lobbyDrawing', (data, player) => {
    lobbyController.drawing(io, player, data);
  });

  socket.on('gameDrawing', (data, player) => {
    lobbyController.drawing(io, player, data);
  });
}

/*
 * Init
 */

io.on('connection', onConnection);
http.listen(port, () => console.log(`listening on port ${port}`));
