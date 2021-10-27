/*
 *  Draw.it
 *  Copyright (C) 2021 Various Authors
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const Room = require('./Room');

class LobbyController {
  constructor() {
    this.rooms = [];
  }

  randomIndex(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomizeWord() {
    const number = this.randomIndex(0, this.words.length);
    this.word = this.list.pop(number);
  }

  addRoom(room) {
    this.rooms.push(room);
  }

  getRoomByCode(roomCode) {
    for (let i = 0; i < this.rooms.length; i++) {
      if (this.rooms[i].roomCode === roomCode) {
        return this.rooms[i];
      }
    }
    return undefined;
  }

  createRoom(socket, player) {
    player.socketId = socket.id;
    let currentRoom = this.getRoomByCode(player.roomCode);
    if (!currentRoom) {
      currentRoom = new Room(8, player.roomCode);
      currentRoom.addPlayer(player);
      this.addRoom(currentRoom);
      socket.join(currentRoom.roomCode);
      socket.emit('joinComplete', currentRoom);
    } else {
      socket.emit('joinFailed');
    }
  }

  checkRepeatedNicknames(player, players) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].nickname == player.nickname) return false;
    }
    return true;
  }

  joinRoom(io, socket, player) {
    player.socketId = socket.id;
    const currentRoom = this.getRoomByCode(player.roomCode);
    if (currentRoom && !currentRoom.gameStarted) {
      if (currentRoom.players.length >= currentRoom.maxPlayers) {
        socket.emit('joinFailedMaxPlayers');
        return;
      }

      if (!this.checkRepeatedNicknames(player, currentRoom.players)) {
        socket.emit('nickInUse');
        return;
      }

      currentRoom.addPlayer(player);
      currentRoom.everyoneReady = false;
      io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
      socket.join(currentRoom.roomCode);
      socket.emit('joinComplete', currentRoom);
    } else {
      socket.emit('joinFailed');
    }
  }

  drawing(io, player, data) {
    const currentRoom = this.getRoomByCode(player.roomCode);
    io.to(currentRoom.roomCode).emit('playerDrawing', data);
  }

  changePlayerReady(io, socket, player) {
    const iterator = socket.rooms.values();
    let roomCode = iterator.next()?.value;
    while (roomCode) {
      const currentRoom = this.getRoomByCode(roomCode);
      if (currentRoom) {
        for (let i = 0; i < currentRoom.players.length; i++) {
          if (currentRoom.players[i].nickname === player.nickname) {
            currentRoom.players[i].ready = player.ready;
            break;
          }
        }
        currentRoom.checkEveryoneReady();
        currentRoom.setupAvaialbleDrawers();
        this.setupTurn(roomCode);
        io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
      }

      roomCode = iterator.next()?.value;
    }
  }

  setupTurn(roomCode) {
    const currentRoom = this.getRoomByCode(roomCode);
    currentRoom.chooseDrawer();
    currentRoom.chooseWord();
    return currentRoom;
  }

  newTurn(io, roomCode) {
    let currentRoom = this.getRoomByCode(roomCode);
    if (currentRoom.availableDrawers.length == 0) {
      io.to(currentRoom.roomCode).emit('endGame', currentRoom);
    }
    currentRoom = this.setupTurn(roomCode);
    io.to(currentRoom.roomCode).emit('newGame', currentRoom);
  }

  removePlayerFromRooms(io, socket) {
    const iterator = socket.rooms.values();
    let roomCode = iterator.next()?.value;
    while (roomCode) {
      const currentRoom = this.getRoomByCode(roomCode);
      if (currentRoom && !currentRoom.gameStarted) {
        const newPlayersList = [];
        for (let i = 0; i < currentRoom.players.length; i++) {
          if (currentRoom.players[i].socketId !== socket.id) {
            newPlayersList.push(currentRoom.players[i]);
          }
        }

        currentRoom.players = newPlayersList;
        currentRoom.checkEveryoneReady();
        io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
      }

      roomCode = iterator.next()?.value;
    }
  }

  joinGame(io, socket, playerId, roomCode) {
    const currentRoom = this.getRoomByCode(roomCode);
    if (currentRoom) {
      for (let i = 0; i < currentRoom.players.length; i++) {
        const currentPlayer = currentRoom.players[i];
        if (currentPlayer.socketId === playerId) {
          socket.join(currentRoom.roomCode);
          currentPlayer.socketId = socket.id;
          currentRoom.gameStarted = true;
          currentRoom.mostRecentPlayer = currentPlayer;
          socket.emit('joinComplete', currentRoom);
          io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
          return;
        }
      }

      socket.emit('joinFailed');
    } else {
      socket.emit('joinFailed');
    }
  }
}

module.exports = LobbyController;
